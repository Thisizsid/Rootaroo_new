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
    });
    isConfigured = true;
  }

  return transporter;
}

export { isConfigured };