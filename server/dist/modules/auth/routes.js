"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../shared/middleware/auth");
const validate_1 = require("../../shared/middleware/validate");
const upload_1 = require("../../shared/middleware/upload");
const validation_1 = require("./validation");
const ctrl = __importStar(require("./controller"));
const router = (0, express_1.Router)();
// ── Public Endpoints ──
/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               displayName: { type: string }
 *     responses:
 *       201:
 *         description: User created
 *       409:
 *         description: Email already exists
 */
router.post('/register', (0, validate_1.validate)(validation_1.registerSchema), ctrl.register);
/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', (0, validate_1.validate)(validation_1.loginSchema), ctrl.login);
/**
 * @openapi
 * /auth/google:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate with Google OAuth code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: string }
 *               redirectUri: { type: string, format: uri }
 *     responses:
 *       200:
 *         description: Authenticated
 */
router.post('/google', (0, validate_1.validate)(validation_1.googleAuthSchema), ctrl.googleAuth);
router.post('/refresh', (0, validate_1.validate)(validation_1.refreshSchema), ctrl.refresh);
router.post('/logout', (0, validate_1.validate)(validation_1.logoutSchema), ctrl.logout);
router.post('/phone/register', (0, validate_1.validate)(validation_1.registerPhoneSchema), ctrl.registerPhone);
router.post('/phone/send-otp', (0, validate_1.validate)(validation_1.sendPhoneOtpSchema), ctrl.sendPhoneOtp);
router.post('/phone/verify-otp', (0, validate_1.validate)(validation_1.verifyPhoneOtpSchema), ctrl.verifyPhoneOtp);
/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Code sent if email exists
 */
router.post('/forgot-password', (0, validate_1.validate)(validation_1.forgotPasswordSchema), ctrl.forgotPassword);
/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: string, minLength: 6, maxLength: 6 }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password reset
 *       400:
 *         description: Invalid or expired code
 */
router.post('/reset-password', (0, validate_1.validate)(validation_1.resetPasswordSchema), ctrl.resetPassword);
// ── Protected Endpoints ──
router.get('/me', auth_1.authenticate, ctrl.me);
/**
 * @openapi
 * /auth/profile:
 *   patch:
 *     tags: [Auth]
 *     summary: Update user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName: { type: string }
 *               avatarUrl: { type: string, format: uri, nullable: true }
 *               avatarEmoji: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.patch('/profile', auth_1.authenticate, (0, validate_1.validate)(validation_1.updateProfileSchema), ctrl.updateProfile);
router.post('/avatar', auth_1.authenticate, upload_1.uploadAvatar, ctrl.uploadAvatarCtrl);
/**
 * @openapi
 * /auth/send-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Send email verification code
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Code sent
 */
router.post('/send-verification', auth_1.authenticate, ctrl.sendVerification);
/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email with code
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: string, minLength: 6, maxLength: 6 }
 *     responses:
 *       200:
 *         description: Email verified
 *       400:
 *         description: Invalid or expired code
 */
router.post('/verify-email', auth_1.authenticate, (0, validate_1.validate)(validation_1.verifyEmailSchema), ctrl.verifyEmail);
router.post('/account/cancel-pending', auth_1.authenticate, ctrl.cancelPendingRegistration);
router.post('/account/schedule-deletion', auth_1.authenticate, (0, validate_1.validate)(validation_1.scheduleDeletionSchema), ctrl.scheduleDeletion);
router.post('/account/cancel-deletion', auth_1.authenticate, ctrl.cancelDeletion);
router.post('/account/confirm-deletion', auth_1.authenticate, (0, validate_1.validate)(validation_1.scheduleDeletionSchema), ctrl.confirmDeletion);
exports.default = router;
//# sourceMappingURL=routes.js.map