import type { Transporter } from 'nodemailer';
declare let isConfigured: boolean;
/**
 * Get a shared nodemailer transport.
 * Returns null if SMTP is not configured (dev mode).
 * The transport is lazily created on first call and cached thereafter.
 */
export declare function getMailer(): Transporter | null;
export { isConfigured };
//# sourceMappingURL=mailer.d.ts.map