/**
 * Domain enums shared by the API and the web client.
 * Values are stored as-is in the database, so never rename an existing value.
 */

/** Who a user is on the platform. Managers are Pocket's internal team. */
export const UserRole = {
  Startup: 'startup',
  Specialist: 'specialist',
  Manager: 'manager',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/**
 * Manual verification (lightweight KYC/KYB) lifecycle.
 * Nobody operates on the marketplace until a manager approves them.
 */
export const VerificationStatus = {
  NotSubmitted: 'not_submitted',
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
} as const;
export type VerificationStatus =
  (typeof VerificationStatus)[keyof typeof VerificationStatus];
