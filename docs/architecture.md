# Architecture

Pocket is a marketplace web application with an integration layer to Trustless Work for everything that moves money. It does not run its own blockchain: escrow logic lives in audited Soroban contracts operated by Trustless Work, and Pocket orchestrates them.

## Guiding principle

Build the marketplace and its rules; buy everything else. Identity checks start as a manual review by managers, wallets belong to the users, and escrow is provided as a service.

## Components

```
┌──────────────┐    REST + JWT    ┌──────────────┐    Prisma    ┌──────────────┐
│  Web client  │ ───────────────▶ │   Pocket API │ ───────────▶ │   Postgres   │
│  (Next.js)   │                  │   (NestJS)   │              │  (Supabase)  │
└──────┬───────┘                  └──────┬───────┘              └──────────────┘
       │ signs XDR                       │ REST
       ▼                                 ▼
┌──────────────┐   submits signed  ┌──────────────┐   Soroban   ┌──────────────┐
│ User wallet  │ ───── XDR ──────▶ │Trustless Work│ ──────────▶ │   Stellar    │
│    (SWK)     │                   │     API      │             │   network    │
└──────────────┘                   └──────────────┘             └──────────────┘
```

| Component          | Responsibility                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **Web client**     | Marketplace UI, profiles, hiring flow, manager panel and wallet connection through Stellar Wallets Kit.                         |
| **Pocket API**     | Users, roles, verification, profiles, hiring state and escrow orchestration. Source of truth for off-chain state.               |
| **Postgres**       | Relational state. On-chain references (escrow contract ids, transaction hashes) are stored next to the entities they belong to. |
| **Trustless Work** | Deploys and operates the escrow contracts. Write endpoints return unsigned XDR.                                                 |
| **User wallet**    | Signs every operation that belongs to its owner: sign-in challenges, funding and approvals.                                     |

## Non-custodial by design

Pocket never holds user funds or keys. When an operation needs a user's authority (for example, funding an escrow), the API asks Trustless Work for the unsigned transaction, the web client has the user's own wallet sign it, and the signed XDR is submitted. Pocket's own Stellar account only fills the platform roles of the escrow (platform address and dispute resolver).

## API layout

```
apps/api/src/
├── common/        Guards, decorators and shared types
├── config/        Typed configuration and env validation
├── prisma/        Prisma client as a global Nest module
└── modules/
    ├── auth/      Wallet challenge and JWT sign-in
    └── users/     The signed-in user
```

Every route requires a bearer token unless it is marked `@Public()`. Routes can be restricted to roles with `@Roles()`.

## Shared contracts

`packages/shared` holds the enums and request/response types used by both the API and the web client, so the two sides cannot drift apart. Enum values are stored as-is in the database and must never be renamed.
