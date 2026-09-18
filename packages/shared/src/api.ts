import type { UserRole, VerificationStatus } from './enums';

/** ISO-8601 timestamp as serialized by the API. */
export type IsoDate = string;

export interface User {
  id: string;
  stellarAddress: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}

// ---------------------------------------------------------------------------
// Auth: POST /auth/challenge, POST /auth/login
// ---------------------------------------------------------------------------

export interface ChallengeRequest {
  stellarAddress: string;
}

export interface ChallengeResponse {
  /** Unsigned transaction XDR for the wallet to sign. Never submitted. */
  xdr: string;
  networkPassphrase: string;
}

export type SignUpRole = Exclude<UserRole, 'manager'>;

export interface LoginRequest {
  stellarAddress: string;
  signedXdr: string;
  /** Required on the first login, when the account is created. */
  role?: SignUpRole;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
  isNewUser: boolean;
}

/** Error codes the API returns in the `code` field of a 4xx body. */
export const ApiErrorCode = {
  RoleRequired: 'ROLE_REQUIRED',
} as const;
export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];
