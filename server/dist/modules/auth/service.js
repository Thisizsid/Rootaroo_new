"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
exports.googleAuth = googleAuth;
exports.sendVerification = sendVerification;
exports.verifyEmail = verifyEmail;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.scheduleDeletion = scheduleDeletion;
exports.cancelDeletion = cancelDeletion;
exports.confirmDeletion = confirmDeletion;
exports.cancelPendingRegistration = cancelPendingRegistration;
exports.registerPhone = registerPhone;
exports.sendPhoneOtp = sendPhoneOtp;
exports.verifyPhoneOtp = verifyPhoneOtp;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = require("crypto");
const uuid_1 = require("uuid");
const sequelize_1 = require("sequelize");
const env_1 = require("../../config/env");
const models_1 = require("../../database/models");
const mailer_1 = require("../../shared/utils/mailer");
const errors_1 = require("../../shared/utils/errors");
// ── Helpers ──
function toUserResponse(user) {
    return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        avatarEmoji: user.avatarEmoji,
        avatarPresetId: user.avatarPresetId,
        dateOfBirth: user.dateOfBirth,
        homeAddress: user.homeAddress,
        phone: user.phone,
        isPhoneVerified: user.isPhoneVerified,
        addToCalendar: user.addToCalendar,
        notifyHousehold: user.notifyHousehold,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt.toISOString(),
    };
}
function generateAccessToken(user) {
    return jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, env_1.env.jwt.accessSecret, { expiresIn: env_1.env.jwt.accessExpiry });
}
async function generateRefreshToken(userId) {
    const token = (0, uuid_1.v4)();
    // Clean up old tokens for this user (keep last 5)
    const count = await models_1.RefreshToken.count({ where: { userId } });
    if (count >= 5) {
        const oldest = await models_1.RefreshToken.findAll({
            where: { userId },
            order: [['createdAt', 'ASC']],
            limit: count - 4,
        });
        await models_1.RefreshToken.destroy({
            where: { id: { [sequelize_1.Op.in]: oldest.map((t) => t.id) } },
        });
    }
    await models_1.RefreshToken.create({
        id: (0, uuid_1.v4)(),
        userId,
        token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
    return token;
}
async function rotateRefreshToken(oldToken) {
    const record = await models_1.RefreshToken.findOne({
        where: { token: oldToken },
        include: [{ model: models_1.User, as: 'user' }],
    });
    if (!record || !record.user) {
        throw new errors_1.UnauthorizedError('Invalid refresh token');
    }
    if (record.expiresAt < new Date()) {
        await record.destroy();
        throw new errors_1.UnauthorizedError('Refresh token expired — please log in again');
    }
    // Rotate: delete old, issue new
    await record.destroy();
    const user = record.user;
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);
    return { accessToken, refreshToken };
}
// ── Public Service Methods ──
async function register(body) {
    const { email, password } = body;
    const displayName = body.displayName?.trim() || email.split('@')[0];
    const existing = await models_1.User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
        throw new errors_1.ConflictError('An account with this email already exists');
    }
    const passwordHash = await bcrypt_1.default.hash(password, 12);
    const user = await models_1.User.create({
        id: (0, uuid_1.v4)(),
        email: email.toLowerCase(),
        passwordHash,
        displayName,
        role: 'member',
        isVerified: false,
    });
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);
    // Auto-send verification code for new registrations
    const code = await sendVerification(user.id);
    return { user: toUserResponse(user), tokens: { accessToken, refreshToken }, verificationCode: code };
}
async function login(body) {
    const { email, password } = body;
    const user = await models_1.User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
        throw new errors_1.UnauthorizedError('Invalid email or password');
    }
    const valid = await bcrypt_1.default.compare(password, user.passwordHash);
    if (!valid) {
        throw new errors_1.UnauthorizedError('Invalid email or password');
    }
    // Update last login
    user.lastLoginAt = new Date();
    await user.save();
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);
    return { user: toUserResponse(user), tokens: { accessToken, refreshToken } };
}
async function refresh(refreshToken) {
    return rotateRefreshToken(refreshToken);
}
async function logout(refreshToken) {
    await models_1.RefreshToken.destroy({ where: { token: refreshToken } });
}
async function getProfile(userId) {
    const user = await models_1.User.findByPk(userId);
    if (!user)
        throw new errors_1.NotFoundError('User');
    return toUserResponse(user);
}
async function updateProfile(userId, body) {
    const user = await models_1.User.findByPk(userId);
    if (!user)
        throw new errors_1.NotFoundError('User');
    if (body.displayName !== undefined)
        user.displayName = body.displayName;
    if (body.avatarUrl !== undefined)
        user.avatarUrl = body.avatarUrl;
    if (body.avatarEmoji !== undefined)
        user.avatarEmoji = body.avatarEmoji;
    if (body.avatarPresetId !== undefined)
        user.avatarPresetId = body.avatarPresetId;
    if (body.dateOfBirth !== undefined)
        user.dateOfBirth = body.dateOfBirth;
    if (body.homeAddress !== undefined)
        user.homeAddress = body.homeAddress;
    if (body.phone !== undefined)
        user.phone = body.phone;
    if (body.addToCalendar !== undefined)
        user.addToCalendar = body.addToCalendar;
    if (body.notifyHousehold !== undefined)
        user.notifyHousehold = body.notifyHousehold;
    await user.save();
    return toUserResponse(user);
}
// ── Google OAuth ──
async function googleAuth(body) {
    const { code, redirectUri } = body;
    // Exchange auth code for Google tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: env_1.env.google.clientId,
            client_secret: env_1.env.google.clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        }),
    });
    if (!tokenResponse.ok) {
        const errorBody = await tokenResponse.text();
        throw new errors_1.AppError(401, `Google token exchange failed: ${errorBody}`);
    }
    const tokenData = await tokenResponse.json();
    const idToken = tokenData.id_token;
    if (!idToken) {
        throw new errors_1.AppError(401, 'No ID token returned from Google');
    }
    // Verify ID token via Google's tokeninfo endpoint (POST — body, not query)
    const verifyResponse = await fetch('https://www.googleapis.com/oauth2/v3/tokeninfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ id_token: idToken }),
    });
    if (!verifyResponse.ok) {
        throw new errors_1.AppError(401, 'Google ID token verification failed');
    }
    const profile = await verifyResponse.json();
    const googleId = profile.sub;
    const email = profile.email.toLowerCase();
    const displayName = profile.name || email.split('@')[0];
    const avatarUrl = profile.picture;
    // Find existing user by googleId or email
    let user = await models_1.User.findOne({
        where: { [sequelize_1.Op.or]: [{ googleId }, { email }] },
    });
    if (user) {
        // Link googleId if user exists with this email but no googleId
        if (!user.googleId) {
            user.googleId = googleId;
        }
        user.lastLoginAt = new Date();
        await user.save();
    }
    else {
        // Create new user
        user = await models_1.User.create({
            id: (0, uuid_1.v4)(),
            email,
            passwordHash: '',
            displayName,
            avatarUrl: avatarUrl || null,
            role: 'member',
            isVerified: true,
            googleId,
        });
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);
    return { user: toUserResponse(user), tokens: { accessToken, refreshToken } };
}
// ── Email Verification ──
async function sendVerification(userId) {
    const user = await models_1.User.findByPk(userId);
    if (!user)
        throw new errors_1.NotFoundError('User');
    if (user.isVerified)
        throw new errors_1.ConflictError('Email already verified');
    // Invalidate any existing unverified codes
    await models_1.EmailVerification.update({ verifiedAt: new Date() }, { where: { userId, verifiedAt: null } });
    // Generate 6-digit code (cryptographically secure)
    const code = (0, crypto_1.randomInt)(100000, 1000000).toString();
    await models_1.EmailVerification.create({
        id: (0, uuid_1.v4)(),
        userId,
        token: code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
    });
    // Send email using shared mailer singleton
    const transporter = (0, mailer_1.getMailer)();
    // If SMTP is not configured, return the code for dev-mode display
    if (!transporter) {
        console.warn(`[DEV] Email verification code for ${user.email}: ${code}`);
        return code;
    }
    await transporter.sendMail({
        from: env_1.env.smtp.from,
        to: user.email,
        subject: 'Verify your Rootaroo email',
        text: `Your verification code is: ${code}\n\nThis code expires in 15 minutes.`,
    });
    return undefined;
}
async function verifyEmail(userId, body) {
    const verification = await models_1.EmailVerification.findOne({
        where: {
            userId,
            token: body.code,
            verifiedAt: null,
            expiresAt: { [sequelize_1.Op.gt]: new Date() },
        },
    });
    if (!verification) {
        throw new errors_1.AppError(400, 'Invalid or expired verification code');
    }
    verification.verifiedAt = new Date();
    await verification.save();
    await models_1.User.update({ isVerified: true }, { where: { id: userId } });
}
// ── Password Reset ──
async function forgotPassword(body) {
    const user = await models_1.User.findOne({ where: { email: body.email.toLowerCase() } });
    // Return silently to prevent email enumeration
    if (!user)
        return;
    // Invalidate any existing unused codes
    await models_1.PasswordReset.update({ usedAt: new Date() }, { where: { userId: user.id, usedAt: null } });
    // Generate 6-digit code
    const code = (0, crypto_1.randomInt)(100000, 1000000).toString();
    await models_1.PasswordReset.create({
        id: (0, uuid_1.v4)(),
        userId: user.id,
        token: code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });
    // Send email or dev-log using shared mailer singleton
    const transporter = (0, mailer_1.getMailer)();
    if (!transporter) {
        console.warn(`[DEV] Password reset code for ${user.email}: ${code}`);
        return;
    }
    await transporter.sendMail({
        from: env_1.env.smtp.from,
        to: user.email,
        subject: 'Reset your Rootaroo password',
        text: `Your password reset code is: ${code}\n\nThis code expires in 15 minutes.`,
    });
}
async function resetPassword(body) {
    const record = await models_1.PasswordReset.findOne({
        where: {
            token: body.code,
            usedAt: null,
            expiresAt: { [sequelize_1.Op.gt]: new Date() },
        },
    });
    if (!record) {
        throw new errors_1.AppError(400, 'Invalid or expired reset code');
    }
    const passwordHash = await bcrypt_1.default.hash(body.password, 12);
    await models_1.User.update({ passwordHash }, { where: { id: record.userId } });
    await record.update({ usedAt: new Date() });
}
// ── Account Deletion ──
async function scheduleDeletion(userId, body) {
    const user = await models_1.User.findByPk(userId);
    if (!user)
        throw new errors_1.NotFoundError('User');
    // Verify password for email users; Google users (empty hash) skip check
    if (user.passwordHash) {
        const valid = await bcrypt_1.default.compare(body.password, user.passwordHash);
        if (!valid)
            throw new errors_1.AppError(400, 'Invalid password');
    }
    user.scheduledDeletionAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await user.save();
}
async function cancelDeletion(userId) {
    const user = await models_1.User.findByPk(userId);
    if (!user)
        throw new errors_1.NotFoundError('User');
    user.scheduledDeletionAt = null;
    await user.save();
}
async function confirmDeletion(userId, body) {
    const user = await models_1.User.findByPk(userId);
    if (!user)
        throw new errors_1.NotFoundError('User');
    const valid = await bcrypt_1.default.compare(body.password, user.passwordHash || '');
    if (!user.passwordHash || !valid) {
        if (user.passwordHash)
            throw new errors_1.AppError(400, 'Invalid password');
    }
    // Revoke all refresh tokens
    await models_1.RefreshToken.destroy({ where: { userId } });
    // Soft-delete the user (paranoid)
    await user.destroy();
}
// ── Cancel pending registration ──
async function cancelPendingRegistration(userId) {
    const user = await models_1.User.findByPk(userId);
    if (!user)
        throw new errors_1.NotFoundError('User');
    // Only allow cancel for unverified, no-household pending accounts
    if (user.isPhoneVerified || user.isVerified) {
        throw new errors_1.AppError(400, 'Cannot cancel — account is already verified');
    }
    // Revoke all refresh tokens
    await models_1.RefreshToken.destroy({ where: { userId } });
    // Hard-delete (not soft — no trace needed for pending accounts)
    await user.destroy({ force: true });
}
// ── Phone OTP ──
function normalizePhone(phone) {
    return phone.replace(/[^\d+]/g, '');
}
async function issuePhoneOtp(phone, userId) {
    const normalized = normalizePhone(phone);
    await models_1.PhoneVerification.update({ verifiedAt: new Date() }, { where: { phone: normalized, verifiedAt: null } });
    const code = (0, crypto_1.randomInt)(100000, 1000000).toString();
    await models_1.PhoneVerification.create({
        id: (0, uuid_1.v4)(),
        phone: normalized,
        userId,
        token: code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });
    console.warn(`[DEV] Phone OTP for ${normalized}: ${code}`);
    return code;
}
/** Create/login phone user with profile draft, send OTP, return pending tokens. */
async function registerPhone(body) {
    const phone = normalizePhone(body.phone);
    if (phone.length < 8)
        throw new errors_1.AppError(400, 'Invalid phone number');
    let user = await models_1.User.findOne({ where: { phone } });
    if (user && user.isPhoneVerified) {
        throw new errors_1.ConflictError('An account with this phone number already exists. Please sign in.');
    }
    if (!user) {
        // Synthetic email so unique email constraint is satisfied
        const email = `phone_${phone.replace(/\D/g, '')}@phone.rootaroo.local`;
        const existingEmail = await models_1.User.findOne({ where: { email } });
        if (existingEmail)
            user = existingEmail;
        else {
            user = await models_1.User.create({
                id: (0, uuid_1.v4)(),
                email,
                passwordHash: '',
                displayName: body.displayName,
                phone,
                isPhoneVerified: false,
                isVerified: false,
                dateOfBirth: body.dateOfBirth || null,
                homeAddress: body.homeAddress || null,
                addToCalendar: body.addToCalendar ?? true,
                notifyHousehold: body.notifyHousehold ?? true,
                avatarUrl: body.avatarUrl ?? null,
                avatarPresetId: body.avatarPresetId ?? null,
                avatarEmoji: body.avatarEmoji ?? null,
                role: 'member',
            });
        }
    }
    else {
        user.displayName = body.displayName;
        if (body.dateOfBirth !== undefined)
            user.dateOfBirth = body.dateOfBirth || null;
        if (body.homeAddress !== undefined)
            user.homeAddress = body.homeAddress || null;
        if (body.addToCalendar !== undefined)
            user.addToCalendar = body.addToCalendar;
        if (body.notifyHousehold !== undefined)
            user.notifyHousehold = body.notifyHousehold;
        if (body.avatarUrl !== undefined)
            user.avatarUrl = body.avatarUrl;
        if (body.avatarPresetId !== undefined)
            user.avatarPresetId = body.avatarPresetId;
        if (body.avatarEmoji !== undefined)
            user.avatarEmoji = body.avatarEmoji;
        await user.save();
    }
    const code = await issuePhoneOtp(phone, user.id);
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);
    return {
        user: toUserResponse(user),
        tokens: { accessToken, refreshToken },
        verificationCode: code,
    };
}
async function sendPhoneOtp(body, userId) {
    const phone = normalizePhone(body.phone);
    const user = userId
        ? await models_1.User.findByPk(userId)
        : await models_1.User.findOne({ where: { phone } });
    if (userId && user && user.phone && normalizePhone(user.phone) !== phone) {
        throw new errors_1.AppError(400, 'Phone does not match your account');
    }
    const code = await issuePhoneOtp(phone, user?.id || null);
    return code;
}
async function verifyPhoneOtp(body, userId) {
    const phone = normalizePhone(body.phone);
    const record = await models_1.PhoneVerification.findOne({
        where: {
            phone,
            token: body.code,
            verifiedAt: null,
            expiresAt: { [sequelize_1.Op.gt]: new Date() },
        },
    });
    if (!record) {
        throw new errors_1.AppError(400, 'Invalid or expired verification code');
    }
    record.verifiedAt = new Date();
    await record.save();
    let user = null;
    if (userId) {
        user = await models_1.User.findByPk(userId);
    }
    else if (record.userId) {
        user = await models_1.User.findByPk(record.userId);
    }
    else {
        user = await models_1.User.findOne({ where: { phone } });
    }
    if (!user)
        throw new errors_1.NotFoundError('User');
    user.phone = phone;
    user.isPhoneVerified = true;
    await user.save();
    // Issue auth tokens for login flow (unauthenticated) or refresh for authenticated
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);
    return { user: toUserResponse(user), tokens: { accessToken, refreshToken } };
}
//# sourceMappingURL=service.js.map