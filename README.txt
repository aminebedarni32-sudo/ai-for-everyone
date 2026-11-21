AI FOR EVERYONE — Vercel starter (v1.2)
=======================================

WHAT THIS PACKAGE CONTAINS
- Static community landing page (index.html)
- Vercel serverless API: create support request and verify a USDT TRC20 transfer
- PostgreSQL schema for support requests and unique TXIDs
- Server-only configuration template

IMPORTANT SAFETY DEFAULT
SUPPORT_ENABLED=false. Do not switch it to true until the database is configured,
the recipient address is verified in RedotPay, provider limits are understood,
and the verifier has been tested. This starter does not itself establish that
RedotPay permits public fundraising or pooled contributions.

REQUIRED SERVICES
1. Vercel project connected to this repository.
2. Neon PostgreSQL (or compatible PostgreSQL) database.
3. TronGrid API key for reliable production API access.

DATABASE SETUP
Run db/schema.sql once in the SQL editor for your Neon database.

VERCEL ENVIRONMENT VARIABLES
Add these in Project > Settings > Environment Variables:
- DATABASE_URL: Neon connection string
- TRONGRID_API_KEY: TronGrid API key (server-side only)
- RECEIVE_ADDRESS: verified USDT-TRC20 deposit address
- SUPPORT_ENABLED: false

Keep SUPPORT_ENABLED=false during initial deployment. Redeploy after changing
Vercel environment variables. Never put secrets in index.html or variables
prefixed with NEXT_PUBLIC_.

DEPLOY
1. Create a GitHub repository and upload the contents of this folder.
2. In Vercel, choose Add New > Project and import that repository.
3. Add the environment variables above (SUPPORT_ENABLED=false).
4. Deploy. Open the deployment URL and create a preview support request.
5. Confirm that a pending row is created in support_orders.
6. Do not accept live funds until a real payment integration review is complete.

VERIFICATION DESIGN
The API checks the confirmed TRC20 transfer history for the configured receiving
account, filters by the official TRON USDT contract, recipient, exact amount,
6 decimals, and TXID. The database's UNIQUE constraint on txid prevents reuse.
The current first version checks the latest 200 matching account transfers;
production hardening should add robust pagination / direct transaction lookup,
rate limiting, abuse protection, monitoring, and an admin reconciliation flow.

TESTING NOTE
The verification endpoint intentionally returns disabled while SUPPORT_ENABLED
is false. Do not test by sending real funds. Use a dedicated TRON testnet and a
separate test token / test database for end-to-end tests; the RedotPay mainnet
address is not a testnet address.

This is a starter implementation, not a legal, tax, custody, or payment-provider
approval. Confirm applicable laws and RedotPay terms before collecting public
contributions.
