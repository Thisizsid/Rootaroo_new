import { getResendClient } from '../../config/resend';
import { env } from '../../config/env';

/**
 * Send an email via Resend. Throws if Resend isn't configured — mirrors
 * shared/utils/sms.ts's sendSms() contract exactly: the dev-mode
 * console-logged fallback lives one layer up, in the caller, not here.
 */
export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const client = getResendClient();
  if (!client) {
    throw new Error('Resend is not configured (RESEND_API_KEY missing)');
  }

  // Resend's SDK never throws for API-level failures (bad/unverified
  // domain, rate limit, invalid recipient, etc.) — it always resolves
  // with { data, error }, even for network errors. Must check `error`
  // explicitly and throw ourselves, or every failed send silently looks
  // like success to callers relying on try/catch (sendVerification,
  // forgotPassword).
  const { error } = await client.emails.send({
    from: env.emailFrom,
    to,
    subject,
    text,
  });
  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
}

/**
 * Alert Rootaroo's own admin inbox (env.adminEmail) — used for the
 * household leave/delete action-request flow, where a member action needs
 * a human at Rootaroo to review it. Null-safe like every other mailer call
 * site: falls back to a console log if Resend or ADMIN_EMAIL isn't
 * configured, so the request row is still created either way.
 */
export async function sendAdminAlertEmail(subject: string, text: string): Promise<void> {
  if (!env.adminEmail) {
    console.warn(`[DEV] ADMIN_EMAIL not configured — admin alert not sent: ${subject}\n${text}`);
    return;
  }

  if (!env.resend.apiKey) {
    console.warn(`[DEV] Resend not configured — admin alert for ${env.adminEmail}: ${subject}\n${text}`);
    return;
  }

  await sendEmail(env.adminEmail, subject, text);
}
