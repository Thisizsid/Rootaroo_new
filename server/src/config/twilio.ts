import twilio from 'twilio';
import type { Twilio } from 'twilio';
import { env } from './env';

let client: Twilio | null = null;

/**
 * Lazily-constructed singleton, mirroring shared/utils/mailer.ts's
 * getMailer() pattern. Twilio's client constructor validates its
 * credentials immediately and throws on an invalid/empty accountSid — it
 * must not run at module-import time (server boot), only once phone auth
 * is actually configured and used, so an unconfigured Twilio doesn't
 * crash the whole app on startup.
 */
export function getTwilioClient(): Twilio | null {
  if (!env.twilio.accountSid || !env.twilio.authToken) {
    return null;
  }
  if (!client) {
    client = twilio(env.twilio.accountSid, env.twilio.authToken);
  }
  return client;
}
