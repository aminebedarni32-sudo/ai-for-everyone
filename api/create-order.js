import { randomUUID } from 'node:crypto';
import { ALLOWED_AMOUNTS, dbClient, json, receiveAddress } from './_config.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  try {
    const amount = String(req.body?.amount ?? '');
    if (!ALLOWED_AMOUNTS.has(amount)) {
      return json(res, 400, { error: 'Choose one of the available support amounts.' });
    }

    const id = randomUUID();
    const sql = await dbClient();
    await sql`INSERT INTO support_orders (id, amount_usdt) VALUES (${id}, ${amount})`;

    const enabled = process.env.SUPPORT_ENABLED === 'true';
    return json(res, 201, {
      orderId: id,
      amountUSDT: amount,
      network: 'TRON (TRC20)',
      token: 'USDT',
      receiveAddress: receiveAddress(),
      paymentsEnabled: enabled,
      message: enabled
        ? 'Send the exact amount using USDT on TRON (TRC20), then submit the transaction ID.'
        : 'Preview only: live payments are disabled while the verification system is being configured.'
    });
  } catch (error) {
    console.error('create-order failed:', error?.message || 'unknown error');
    return json(res, 500, { error: 'Could not create the support request. Check server configuration.' });
  }
}
