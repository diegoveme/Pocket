import { SetMetadata } from '@nestjs/common';

export const VERIFIED_KEY = 'requiresVerifiedUser';

/**
 * Restrict a route to users a manager has approved. Verification status can
 * change after a token is issued, so the guard reads it from the database.
 */
export const Verified = () => SetMetadata(VERIFIED_KEY, true);
