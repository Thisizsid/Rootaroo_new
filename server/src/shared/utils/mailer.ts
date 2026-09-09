import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../../config/env';

let transporter: Transporter | null = null;
let isConfigured = false;

/**
 * Get a shared nodemailer transport.
 * Returns null if SMTP is not configured (dev mode).
 * The transport is lazily created on first call and cached thereafter.
 */
export function getMailer(): Transporter | null {
  if (!env.smtp.host) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
      // Some hosts (e.g. Railway) block or heavily delay outbound SMTP —
      // without these, a blocked connection hangs on nodemailer's ~2min
      // default, and callers that await sendMail() (e.g. register()) hang
      // the whole HTTP request with it. Fail fast instead; callers already
      // treat email delivery as best-effort.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
    });
    isConfigured = true;
  }

  return transporter;
}

export { isConfigured };

/**
 * Alert Rootaroo's own admin inbox (env.adminEmail) — used for the
 * household leave/delete action-request flow, where a member action needs
 * a human at Rootaroo to review it. Null-safe like every other mailer call
 * site: falls back to a console log if SMTP or ADMIN_EMAIL isn't
 * configured, so the request row is still created either way.
 */
export async function sendAdminAlertEmail(subject: string, text: string): Promise<void> {
  if (!env.adminEmail) {
    console.warn(`[DEV] ADMIN_EMAIL not configured — admin alert not sent: ${subject}\n${text}`);
    return;
  }

  const transporter = getMailer();
  if (!transporter) {
    console.warn(`[DEV] SMTP not configured — admin alert for ${env.adminEmail}: ${subject}\n${text}`);
    return;
  }

  await transporter.sendMail({
    from: env.smtp.from,
    to: env.adminEmail,
    subject,
    text,
  });
}