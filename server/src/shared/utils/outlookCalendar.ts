import crypto from 'crypto';

/** Opaque token embedded in a user's public Outlook ICS feed URL. */
export function generateOutlookFeedToken(): string {
  return crypto.randomBytes(24).toString('hex');
}
