import { createHash } from 'crypto';

/**
 * One-way hash for short-lived numeric codes (password reset, phone OTP)
 * stored at rest — never store the raw code, only this digest, so a DB
 * read/dump doesn't hand out live, usable codes.
 */
export function hashOtpCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

export const MAX_OTP_ATTEMPTS = 5;
