import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validate';
import { uploadAvatar } from '../../shared/middleware/upload';
import { registerSchema, loginSchema, refreshSchema, updateProfileSchema, googleAuthSchema, verifyEmailSchema, forgotPasswordSchema, resetPasswordSchema, logoutSchema, scheduleDeletionSchema, sendPhoneOtpSchema, verifyPhoneOtpSchema, registerPhoneSchema } from './validation';
import * as ctrl from './controller';

const router = Router();

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
router.post('/register', validate(registerSchema), ctrl.register);

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
router.post('/login', validate(loginSchema), ctrl.login);

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
router.post('/google', validate(googleAuthSchema), ctrl.googleAuth);

router.post('/refresh', validate(refreshSchema), ctrl.refresh);
router.post('/logout', validate(logoutSchema), ctrl.logout);

router.post('/phone/register', validate(registerPhoneSchema), ctrl.registerPhone);
router.post('/phone/send-otp', validate(sendPhoneOtpSchema), ctrl.sendPhoneOtp);
router.post('/phone/verify-otp', validate(verifyPhoneOtpSchema), ctrl.verifyPhoneOtp);

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
router.post('/forgot-password', validate(forgotPasswordSchema), ctrl.forgotPassword);

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
router.post('/reset-password', validate(resetPasswordSchema), ctrl.resetPassword);

// ── Protected Endpoints ──

router.get('/me', authenticate, ctrl.me);

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
router.patch('/profile', authenticate, validate(updateProfileSchema), ctrl.updateProfile);

router.post('/avatar', authenticate, uploadAvatar, ctrl.uploadAvatarCtrl);

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
router.post('/send-verification', authenticate, ctrl.sendVerification);

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
router.post('/verify-email', authenticate, validate(verifyEmailSchema), ctrl.verifyEmail);

router.post('/account/cancel-pending', authenticate, ctrl.cancelPendingRegistration);
router.post('/account/schedule-deletion', authenticate, validate(scheduleDeletionSchema), ctrl.scheduleDeletion);
router.post('/account/cancel-deletion', authenticate, ctrl.cancelDeletion);
router.post('/account/confirm-deletion', authenticate, validate(scheduleDeletionSchema), ctrl.confirmDeletion);

export default router;
