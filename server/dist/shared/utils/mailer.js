"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isConfigured = void 0;
exports.getMailer = getMailer;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../../config/env");
let transporter = null;
let isConfigured = false;
exports.isConfigured = isConfigured;
/**
 * Get a shared nodemailer transport.
 * Returns null if SMTP is not configured (dev mode).
 * The transport is lazily created on first call and cached thereafter.
 */
function getMailer() {
    if (!env_1.env.smtp.host) {
        return null;
    }
    if (!transporter) {
        transporter = nodemailer_1.default.createTransport({
            host: env_1.env.smtp.host,
            port: env_1.env.smtp.port,
            auth: env_1.env.smtp.user ? { user: env_1.env.smtp.user, pass: env_1.env.smtp.pass } : undefined,
        });
        exports.isConfigured = isConfigured = true;
    }
    return transporter;
}
//# sourceMappingURL=mailer.js.map