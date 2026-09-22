import type {
  ApplicationStatus,
  JobStatus,
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
  /** The wallet has never been funded, so it does not exist on the network yet. */
  StellarAccountNotFound: 'STELLAR_ACCOUNT_NOT_FOUND',
  /** The wallet has to trust USDC before it can receive or send it. */
  UsdcTrustlineRequired: 'USDC_TRUSTLINE_REQUIRED',
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

// ---------------------------------------------------------------------------
// Jobs: startups post them, specialists apply
// ---------------------------------------------------------------------------

/** POST /jobs. Budget is in USDC. */
export interface JobInput {
  title: string;
  description: string;
  category: ServiceCategory;
  /** What the startup expects to receive at the end. */
  deliverables: string;
  budget: number;
  /** Calendar date, YYYY-MM-DD. */
  deadline: string;
}

export interface Job {
  id: string;
  startupId: string;
  title: string;
  description: string;
  category: ServiceCategory;
  deliverables: string;
  /** USDC, serialized as a string to keep decimal precision. */
  budget: string;
  deadline: IsoDate;
  status: JobStatus;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}

/** A job as listed on the board, with who posted it. */
export interface JobListing extends Job {
  startup: { companyName: string; logoUrl?: string | null } | null;
  applicationCount: number;
}

/** GET /jobs */
export interface JobBoard {
  items: JobListing[];
  total: number;
  limit: number;
  offset: number;
}

/** POST /jobs/:id/applications. Price is in USDC and may differ from the budget. */
export interface ApplicationInput {
  proposal: string;
  price: number;
  estimatedDays: number;
}

export interface Application {
  id: string;
  jobId: string;
  specialistId: string;
  proposal: string;
  /** USDC, serialized as a string to keep decimal precision. */
  price: string;
  estimatedDays: number;
  status: ApplicationStatus;
  decidedAt?: IsoDate | null;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}

/** GET /jobs/:id/applications: what the startup sees about each applicant. */
export interface Applicant extends Application {
  specialist: Pick<SpecialistProfile, 'displayName' | 'headline' | 'avatarUrl'> | null;
}

/** GET /applications/mine: the specialist's applications with their job. */
export interface MyApplication extends Application {
  job: Pick<Job, 'id' | 'title' | 'category' | 'budget' | 'deadline' | 'status'>;
}
