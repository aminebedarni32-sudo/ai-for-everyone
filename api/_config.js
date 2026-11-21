export const USDT_CONTRACT_TRON = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
export const ALLOWED_AMOUNTS = new Set(['1', '3', '5', '10', '50']);

export function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(body));
}

export function dbClient() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  // Lazy import keeps the database driver on the server only.
  return import('@neondatabase/serverless').then(({ neon }) => neon(process.env.DATABASE_URL));
}

export function receiveAddress() {
  const address = process.env.RECEIVE_ADDRESS;
  if (!address || !/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) {
    throw new Error('RECEIVE_ADDRESS is missing or malformed');
  }
  return address;
}
