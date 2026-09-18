import type { UserRole } from '@prisma/client';

/** Claims carried by Pocket access tokens. */
export interface JwtPayload {
  sub: string;
  role: UserRole;
  stellarAddress: string;
}

/** The authenticated user attached to each request by the JWT guard. */
export type AuthUser = JwtPayload;
