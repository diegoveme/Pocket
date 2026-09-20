import type {
  ServiceCategory,
  StartupStage,
  UserRole,
  VerificationStatus,
} from './enums';

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

// ---------------------------------------------------------------------------
// Verification: the manual KYC/KYB review every user goes through
// ---------------------------------------------------------------------------

/** What a user submits for review. Company fields only apply to startups. */
export interface VerificationSubmission {
  /** Legal name of the person submitting the request. */
  fullName: string;
  contactEmail: string;
  /** ISO 3166-1 alpha-2 country code. */
  country: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  /** Startups: registered company name. */
  companyName?: string;
  /** Startups: company registration or tax id, when they have one. */
  companyRegistrationId?: string;
  /** Anything else the user wants the manager to know. */
  note?: string;
}

export interface VerificationRequest extends VerificationSubmission {
  id: string;
  userId: string;
  status: Exclude<VerificationStatus, 'not_submitted'>;
  reviewNote?: string | null;
  reviewedAt?: IsoDate | null;
  submittedAt: IsoDate;
}

/** Manager's decision on a request. A rejection must say why. */
export interface VerificationReview {
  note?: string;
}

// ---------------------------------------------------------------------------
// Profiles: the fixed templates both sides fill in
// ---------------------------------------------------------------------------

export interface StartupProfile {
  id: string;
  userId: string;
  companyName: string;
  oneLiner: string;
  sector: string;
  stage: StartupStage;
  lookingFor: string;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  location?: string | null;
  updatedAt: IsoDate;
}

export interface SpecialistProfile {
  id: string;
  userId: string;
  displayName: string;
  headline: string;
  bio: string;
  categories: ServiceCategory[];
  skills: string[];
  caseStudies: string[];
  /** Rates are in USDC. Serialized as strings to keep decimal precision. */
  hourlyRate?: string | null;
  minProjectBudget?: string | null;
  portfolioUrl?: string | null;
  linkedinUrl?: string | null;
  avatarUrl?: string | null;
  location?: string | null;
  updatedAt: IsoDate;
}

/** GET /profiles/:userId */
export interface PublicProfile {
  userId: string;
  role: UserRole;
  stellarAddress: string;
  memberSince: IsoDate;
  profile: StartupProfile | SpecialistProfile;
}

/** GET /profiles/specialists */
export interface SpecialistDirectory {
  items: SpecialistProfile[];
  total: number;
  limit: number;
  offset: number;
}
