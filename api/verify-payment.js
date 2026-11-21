import { dbClient, json, receiveAddress, USDT_CONTRACT_TRON } from './_config.js';

function isValidTxid(value) {
  return typeof value === 'string' && /^[a-fA-F0-9]{64}$/.test(value);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (process.env.SUPPORT_ENABLED !== 'true') {
    return json(res, 503, { status: 'disabled', error: 'Live payment verification is not enabled yet.' });
  }

  try {
    const orderId = String(req.body?.orderId ?? '');
    const txid = String(req.body?.txid ?? '').trim();
    if (!/^[0-9a-fA-F-]{36}$/.test(orderId) || !isValidTxid(txid)) {
      return json(res, 400, { error: 'A valid order ID and 64-character transaction ID are required.' });
    }

    const sql = await dbClient();
    const orders = await sql`
      SELECT id, amount_usdt::text AS amount_usdt, status, txid, created_at
      FROM support_orders WHERE id = ${orderId} LIMIT 1
    `;
    const order = orders[0];
    if (!order) return json(res, 404, { error: 'Support request not found.' });
    if (order.status === 'paid') {
      return order.txid?.toLowerCase() === txid.toLowerCase()
        ? json(res, 200, { status: 'paid', message: 'This request was already verified.' })
        : json(res, 409, { error: 'This support request has already been paid with another transaction.' });
    }
    if (order.status !== 'pending') return json(res, 409, { error: 'This support request is not pending.' });
    if (Date.now() - new Date(order.created_at).getTime() > 24 * 60 * 60 * 1000) {
      return json(res, 410, { error: 'This support request has expired. Create a new one.' });
    }

    const address = receiveAddress();
    const url = new URL(`https://api.trongrid.io/v1/accounts/${encodeURIComponent(address)}/transactions/trc20`);
    url.searchParams.set('only_confirmed', 'true');
    url.searchParams.set('only_to', 'true');
    url.searchParams.set('limit', '200');
    url.searchParams.set('order_by', 'block_timestamp,desc');
    url.searchParams.set('contract_address', USDT_CONTRACT_TRON);
    url.searchParams.set('min_timestamp', String(new Date(order.created_at).getTime() - 5 * 60 * 1000));

    const headers = {};
    if (process.env.TRONGRID_API_KEY) headers['TRON-PRO-API-KEY'] = process.env.TRONGRID_API_KEY;
    const chainResponse = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    if (!chainResponse.ok) {
      console.error('TronGrid response:', chainResponse.status);
      return json(res, 502, { error: 'The blockchain data provider is temporarily unavailable. Try again later.' });
    }
    const chainData = await chainResponse.json();
    const transfer = (chainData.data || []).find((item) =>
      String(item.transaction_id || '').toLowerCase() === txid.toLowerCase() &&
      String(item.to || '').toLowerCase() === address.toLowerCase() &&
      String(item.token_info?.address || '').toLowerCase() === USDT_CONTRACT_TRON.toLowerCase() &&
      Number(item.token_info?.decimals) === 6 &&
      BigInt(item.value || '0') === BigInt(Math.round(Number(order.amount_usdt) * 1_000_000))
    );

    if (!transfer) {
      return json(res, 202, {
        status: 'not_verified',
        message: 'No matching confirmed transfer was found yet. Check the TXID, amount, recipient and network, then retry.'
      });
    }

    // A UNIQUE constraint on txid prevents the same chain transaction being credited twice.
    const updated = await sql`
      UPDATE support_orders
      SET status = 'paid', txid = ${txid.toLowerCase()}, paid_at = NOW()
      WHERE id = ${orderId} AND status = 'pending'
        AND NOT EXISTS (SELECT 1 FROM support_orders WHERE txid = ${txid.toLowerCase()})
      RETURNING id
    `;
    if (!updated.length) {
      return json(res, 409, { error: 'This transaction may already be linked to another request, or the request changed. Contact support if you believe this is an error.' });
    }

    return json(res, 200, { status: 'paid', amountUSDT: order.amount_usdt, network: 'TRON (TRC20)' });
  } catch (error) {
    console.error('verify-payment failed:', error?.message || 'unknown error');
    return json(res, 500, { error: 'Verification could not be completed. Try again later.' });
  }
}
