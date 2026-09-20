# Verification

Nobody operates on Pocket without being reviewed by a manager. This is the lightweight KYC/KYB of the MVP: a form plus a human decision, instead of an expensive identity provider.

## States

A user carries one verification status, shown in `GET /users/me`.

| Status          | Meaning                                                     |
| --------------- | ----------------------------------------------------------- |
| `not_submitted` | The account exists but has never been sent for review.      |
| `pending`       | Waiting for a manager.                                      |
| `approved`      | Can fill in a profile and operate on the marketplace.       |
| `rejected`      | Turned down. The user can fix the details and submit again. |

## Flow

```
Startup / Specialist                 Manager
        │ POST /verification            │
        │ status: not_submitted         │
        │      → pending                │
        │                               │ GET /manager/verifications
        │                               │ (queue, oldest first)
        │                               │
        │                               │ POST .../:id/approve
        │                               │ POST .../:id/reject  { note }
        │ ◀── status: approved or rejected
```

## What the user submits

Links, not file uploads. A manager opens them and decides.

| Field                   | Who                                                  | Required                 |
| ----------------------- | ---------------------------------------------------- | ------------------------ |
| `fullName`              | Everyone                                             | Yes                      |
| `contactEmail`          | Everyone                                             | Yes                      |
| `country`               | Everyone                                             | Yes (ISO 3166-1 alpha-2) |
| `linkedinUrl`           | Everyone                                             | No                       |
| `websiteUrl`            | Company site for startups, portfolio for specialists | No                       |
| `companyName`           | Startups                                             | Yes for startups         |
| `companyRegistrationId` | Startups                                             | No                       |
| `note`                  | Everyone                                             | No                       |

Every submission is stored as its own row, so a user keeps the history of their attempts and a manager can see what changed between them.

## Rules

- A user with a `pending` or `approved` status cannot submit again.
- A rejected user can submit again, which is why a rejection must carry a note explaining what to fix.
- Managers never go through verification: their accounts are created already approved by the seed script.
- A request can only be reviewed once. Reviewing a request that is not `pending` fails.

## Effect on the rest of the API

Routes marked `@Verified()` are refused until a manager approves the account, with a message saying which step is missing. Filling in a profile is one of those routes, so the marketplace only ever shows profiles of reviewed users. The public directory and public profiles also hide anyone who is not approved.
