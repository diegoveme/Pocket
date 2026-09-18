# Authentication

Users sign in with their own Stellar wallet. There are no passwords and no custodial wallets: the wallet address is the account.

## Flow

```
Web client                         Pocket API                        Wallet (SWK)
    │  POST /auth/challenge             │                                  │
    │  { stellarAddress }               │                                  │
    │ ────────────────────────────────▶ │ store nonce (5 min TTL)          │
    │ ◀──────────────────────────────── │ { xdr, networkPassphrase }       │
    │                                   │                                  │
    │  signTransaction(xdr) ─────────────────────────────────────────────▶ │
    │ ◀───────────────────────────────────────────────────── signed xdr ── │
    │                                   │                                  │
    │  POST /auth/login                 │                                  │
    │  { stellarAddress, signedXdr,     │ verify nonce + signature         │
    │    role? }                        │ create user on first login       │
    │ ────────────────────────────────▶ │ delete challenge                 │
    │ ◀──────────────────────────────── │ { accessToken, user, isNewUser } │
```

## The challenge

The challenge is a Stellar transaction built in the style of [SEP-10](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md):

- Source account: the address signing in.
- One `manageData` operation named `Pocket auth` whose value is a random one-time nonce.
- Fee `0` and a 5 minute time bound.

It is never submitted to the network. The zero fee makes wallets show "0 XLM", and the network would reject it anyway. Signing it only proves control of the secret key behind the address.

The API accepts the signed transaction only if it is the exact challenge issued to that address: same source, a single `manageData` operation with the stored nonce, not expired, and signed by the address's key. Requesting a new challenge replaces the previous one.

## Sign-up

The first login creates the account, so it must include `role`: `startup` or `specialist`. Without it the API answers `400` with `code: "ROLE_REQUIRED"` and keeps the challenge, so the client can ask the user for a role and resend the same signed transaction without a second wallet prompt.

Managers cannot sign up. They are created by the seed script from `MANAGER_STELLAR_ADDRESSES`.

## Replay protection

The challenge is deleted as soon as a login succeeds, so a captured signed transaction cannot be used again. Challenges live in the `auth_challenges` table, which keeps them valid across restarts and multiple API instances.

## Access tokens

A successful login returns a JWT (default lifetime 7 days, `JWT_EXPIRES_IN`) with these claims:

| Claim            | Meaning                              |
| ---------------- | ------------------------------------ |
| `sub`            | User id                              |
| `role`           | `startup`, `specialist` or `manager` |
| `stellarAddress` | The wallet address                   |

Send it as `Authorization: Bearer <token>`. A global guard rejects requests without a valid token, except on routes marked `@Public()` (`/health`, `/auth/*`).

A new account starts with verification status `not_submitted`. Verification by a manager is required before a user can operate on the marketplace.
