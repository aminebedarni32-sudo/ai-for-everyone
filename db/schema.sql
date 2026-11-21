CREATE TABLE IF NOT EXISTS support_orders (
  id UUID PRIMARY KEY,
  amount_usdt NUMERIC(20, 6) NOT NULL CHECK (amount_usdt IN (1, 3, 5, 10, 50)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired')),
  txid TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  CHECK (txid IS NULL OR txid ~ '^[A-Fa-f0-9]{64}$')
);

CREATE INDEX IF NOT EXISTS support_orders_created_at_idx
  ON support_orders (created_at DESC);
