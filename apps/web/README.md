# Pocket web

The Pocket web app: Next.js 16, Tailwind CSS 4 and shadcn/ui, with Stellar Wallets Kit for the wallets. Everything talks to the Pocket API.

```bash
cp .env.example .env.local   # API URL and Stellar network
bun run dev                  # http://localhost:3001
```

The API must allow this origin in `CORS_ORIGINS` (it does by default).

## How money steps work

Every step that needs a wallet (sign-in, enabling USDC, funding, approving, opening a dispute) follows the same loop in `lib/wallet.ts`: the API prepares the transaction, the wallet signs it, and the API broadcasts it and checks the result on chain. The Trustless Work API key never reaches the browser.

## Trustless Work Blocks

`components/tw-blocks` holds the parts of the [Trustless Work Blocks SDK](https://docs.trustlesswork.com/trustless-work/escrow-blocks-sdk/getting-started) Pocket uses: the wallet kit, the React Query and wallet providers, helpers and error handling. Add more with `bunx trustless-work add <block> --no-install` and install the dependencies it lists with bun: the CLI only detects bun through a `bun.lockb` in this folder, so without `--no-install` it would use npm.

The Blocks providers that call Trustless Work directly from the browser (`TrustlessWorkProvider` and the escrow context providers) are left out on purpose: in Pocket those calls go through the API, which enforces the marketplace rules.
