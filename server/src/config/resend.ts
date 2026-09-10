import { Resend } from 'resend';
import { env } from './env';

let client: Resend | null = null;

/**
 * Lazily-constructed singleton, mirroring config/twilio.ts's
 * getTwilioClient() pattern. Resend's constructor throws synchronously
 * if no API key is available (its own or process.env.RESEND_API_KEY) —
 * it must not run at module-import time (server boot), only once email
 * is actually configured and used, so an unconfigured Resend doesn't
 * crash the whole app on startup.
 */
export function getResendClient(): Resend | null {
  if (!env.resend.apiKey) {
    return null;
  }
  if (!client) {
    client = new Resend(env.resend.apiKey);
  }
  return client;
}
