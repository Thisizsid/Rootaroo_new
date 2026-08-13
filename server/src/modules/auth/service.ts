import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomInt } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { env } from '../../config/env';
import { User, RefreshToken, EmailVerification, PasswordReset, PhoneVerification } from '../../database/models';
import { getMailer } from '../../shared/utils/mailer';
import { UnauthorizedError, ConflictError, NotFoundError, AppError } from '../../shared/utils/errors';
import type {
  RegisterBody, LoginBody, AuthResponse, AuthTokens, UserResponse, UpdateProfileBody, GoogleAuthBody,
  VerifyEmailBody, ForgotPasswordBody, ResetPasswordBody, ScheduleDeletionBody,
  SendPhoneOtpBody, VerifyPhoneOtpBody, RegisterPhoneBody,
} from './types';

// ── Helpers ──

function toUserResponse(user: User): UserResponse {
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

function generateAccessToken(user: User): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiry as any },
  );
}

async function generateRefreshToken(userId: string): Promise<string> {
  const token = uuidv4();
  // Clean up old tokens for this user (keep last 5)
  const count = await RefreshToken.count({ where: { userId } });
  if (count >= 5) {
    const oldest = await RefreshToken.findAll({
      where: { userId },
      order: [['createdAt', 'ASC']],
      limit: count - 4,
    });
    await RefreshToken.destroy({
      where: { id: { [Op.in]: oldest.map((t) => t.id) } },
    });
  }

  await RefreshToken.create({
    id: uuidv4(),
    userId,
    token,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });
  return token;
}

async function rotateRefreshToken(oldToken: string): Promise<AuthTokens> {
  const record = await RefreshToken.findOne({
    where: { token: oldToken },
    include: [{ model: User, as: 'user' }],
  });

  if (!record || !record.user) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  if (record.expiresAt < new Date()) {
    await record.destroy();
    throw new UnauthorizedError('Refresh token expired — please log in again');
  }

  // Rotate: delete old, issue new
  await record.destroy();
  const user = record.user;
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);

  return { accessToken, refreshToken };
}

// ── Public Service Methods ──

export async function register(body: RegisterBody): Promise<AuthResponse> {
  const { email, password } = body;
  const displayName = body.displayName?.trim() || email.split('@')[0];

  const existing = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    id: uuidv4(),
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

export async function login(body: LoginBody): Promise<AuthResponse> {
  const { email, password } = body;

  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);

  return { user: toUserResponse(user), tokens: { accessToken, refreshToken } };
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  return rotateRefreshToken(refreshToken);
}

export async function logout(refreshToken: string): Promise<void> {
  await RefreshToken.destroy({ where: { token: refreshToken } });
}

export async function getProfile(userId: string): Promise<UserResponse> {
  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError('User');
  return toUserResponse(user);
}

export async function updateProfile(
  userId: string,
  body: UpdateProfileBody,
): Promise<UserResponse> {
  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError('User');

  if (body.displayName !== undefined) user.displayName = body.displayName;
  if (body.avatarUrl !== undefined) user.avatarUrl = body.avatarUrl;
  if (body.avatarEmoji !== undefined) user.avatarEmoji = body.avatarEmoji;
  if (body.avatarPresetId !== undefined) user.avatarPresetId = body.avatarPresetId;
  if (body.dateOfBirth !== undefined) user.dateOfBirth = body.dateOfBirth;
  if (body.homeAddress !== undefined) user.homeAddress = body.homeAddress;
  if (body.phone !== undefined) user.phone = body.phone;
  if (body.addToCalendar !== undefined) user.addToCalendar = body.addToCalendar;
  if (body.notifyHousehold !== undefined) user.notifyHousehold = body.notifyHousehold;

  await user.save();
  return toUserResponse(user);
}

// ── Google OAuth ──

export async function googleAuth(body: GoogleAuthBody): Promise<AuthResponse> {
  const { code, redirectUri } = body;

  // Exchange auth code for Google tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.google.clientId,
      client_secret: env.google.clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    throw new AppError(401, `Google token exchange failed: ${errorBody}`);
  }

  const tokenData = await tokenResponse.json() as { id_token: string };
  const idToken = tokenData.id_token;

  if (!idToken) {
    throw new AppError(401, 'No ID token returned from Google');
  }

  // Verify ID token via Google's tokeninfo endpoint (POST — body, not query)
  const verifyResponse = await fetch('https://www.googleapis.com/oauth2/v3/tokeninfo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ id_token: idToken }),
  });

  if (!verifyResponse.ok) {
    throw new AppError(401, 'Google ID token verification failed');
  }

  const profile = await verifyResponse.json() as {
    sub: string; email: string; name?: string; picture?: string;
  };

  const googleId = profile.sub;
  const email = profile.email.toLowerCase();
  const displayName = profile.name || email.split('@')[0];
  const avatarUrl = profile.picture;

  // Find existing user by googleId or email
  let user = await User.findOne({
    where: { [Op.or]: [{ googleId }, { email }] },
  });

  if (user) {
    // Link googleId if user exists with this email but no googleId
    if (!user.googleId) {
      user.googleId = googleId;
    }
    user.lastLoginAt = new Date();
    await user.save();
  } else {
    // Create new user
    user = await User.create({
      id: uuidv4(),
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

export async function sendVerification(userId: string): Promise<string | undefined> {
  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError('User');
  if (user.isVerified) throw new ConflictError('Email already verified');

  // Invalidate any existing unverified codes
  await EmailVerification.update(
    { verifiedAt: new Date() },
    { where: { userId, verifiedAt: null } },
  );

  // Generate 6-digit code (cryptographically secure)
  const code = randomInt(100000, 1000000).toString();

  await EmailVerification.create({
    id: uuidv4(),
    userId,
    token: code,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
  });

  // Send email using shared mailer singleton
  const transporter = getMailer();

  // If SMTP is not configured, return the code for dev-mode display
  if (!transporter) {
    console.warn(`[DEV] Email verification code for ${user.email}: ${code}`);
    return code;
  }

  await transporter.sendMail({
    from: env.smtp.from,
    to: user.email,
    subject: 'Verify your Rootaroo email',
    text: `Your verification code is: ${code}\n\nThis code expires in 15 minutes.`,
  });

  return undefined;
}

export async function verifyEmail(userId: string, body: VerifyEmailBody): Promise<void> {
  const verification = await EmailVerification.findOne({
    where: {
      userId,
      token: body.code,
      verifiedAt: null,
      expiresAt: { [Op.gt]: new Date() },
    },
  });

  if (!verification) {
    throw new AppError(400, 'Invalid or expired verification code');
  }

  verification.verifiedAt = new Date();
  await verification.save();

  await User.update({ isVerified: true }, { where: { id: userId } });
}

// ── Password Reset ──

export async function forgotPassword(body: ForgotPasswordBody): Promise<void> {
  const user = await User.findOne({ where: { email: body.email.toLowerCase() } });
  // Return silently to prevent email enumeration
  if (!user) return;

  // Invalidate any existing unused codes
  await PasswordReset.update(
    { usedAt: new Date() },
    { where: { userId: user.id, usedAt: null } },
  );

  // Generate 6-digit code
  const code = randomInt(100000, 1000000).toString();

  await PasswordReset.create({
    id: uuidv4(),
    userId: user.id,
    token: code,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });

  // Send email or dev-log using shared mailer singleton
  const transporter = getMailer();

  if (!transporter) {
    console.warn(`[DEV] Password reset code for ${user.email}: ${code}`);
    return;
  }

  await transporter.sendMail({
    from: env.smtp.from,
    to: user.email,
    subject: 'Reset your Rootaroo password',
    text: `Your password reset code is: ${code}\n\nThis code expires in 15 minutes.`,
  });
}

export async function resetPassword(body: ResetPasswordBody): Promise<void> {
  const record = await PasswordReset.findOne({
    where: {
      token: body.code,
      usedAt: null,
      expiresAt: { [Op.gt]: new Date() },
    },
  });

  if (!record) {
    throw new AppError(400, 'Invalid or expired reset code');
  }

  const passwordHash = await bcrypt.hash(body.password, 12);
  await User.update({ passwordHash }, { where: { id: record.userId } });
  await record.update({ usedAt: new Date() });
}

// ── Account Deletion ──

export async function scheduleDeletion(userId: string, body: ScheduleDeletionBody): Promise<void> {
  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError('User');

  // Verify password for email users; Google users (empty hash) skip check
  if (user.passwordHash) {
    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) throw new AppError(400, 'Invalid password');
  }

  user.scheduledDeletionAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await user.save();
}

export async function cancelDeletion(userId: string): Promise<void> {
  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError('User');

  user.scheduledDeletionAt = null;
  await user.save();
}

export async function confirmDeletion(userId: string, body: ScheduleDeletionBody): Promise<void> {
  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError('User');

  const valid = await bcrypt.compare(body.password, user.passwordHash || '');
  if (!user.passwordHash || !valid) {
    if (user.passwordHash) throw new AppError(400, 'Invalid password');
  }

  // Revoke all refresh tokens
  await RefreshToken.destroy({ where: { userId } });

  // Soft-delete the user (paranoid)
  await user.destroy();
}

// ── Cancel pending registration ──

export async function cancelPendingRegistration(userId: string): Promise<void> {
  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError('User');

  // Only allow cancel for unverified, no-household pending accounts
  if (user.isPhoneVerified || user.isVerified) {
    throw new AppError(400, 'Cannot cancel — account is already verified');
  }

  // Revoke all refresh tokens
  await RefreshToken.destroy({ where: { userId } });

  // Hard-delete (not soft — no trace needed for pending accounts)
  await user.destroy({ force: true });
}

// ── Phone OTP (delivered and verified via Auth0 Passwordless SMS) ──

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

async function sendPhoneOtpViaAuth0(phone: string): Promise<void> {
  const response = await fetch(`https://${env.auth0.domain}/passwordless/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.auth0.smsClientId,
      client_secret: env.auth0.smsClientSecret,
      connection: 'sms',
      phone_number: phone,
      send: 'code',
    }),
  });

  if (!response.ok) {
    throw new AppError(400, 'Failed to send verification code');
  }
}

async function verifyPhoneOtpViaAuth0(phone: string, code: string): Promise<void> {
  const response = await fetch(`https://${env.auth0.domain}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'http://auth0.com/oauth/grant-type/passwordless/otp',
      client_id: env.auth0.smsClientId,
      client_secret: env.auth0.smsClientSecret,
      username: phone,
      otp: code,
      realm: 'sms',
    }),
  });

  if (!response.ok) {
    throw new AppError(400, 'Invalid or expired verification code');
  }
}

async function issuePhoneOtp(phone: string, userId: string | null): Promise<void> {
  const normalized = normalizePhone(phone);

  await PhoneVerification.update(
    { verifiedAt: new Date() },
    { where: { phone: normalized, verifiedAt: null } },
  );

  await sendPhoneOtpViaAuth0(normalized);

  // Placeholder record — Auth0 owns the code itself; this row just tracks
  // the pending attempt so verifyPhoneOtp() can resolve phone -> userId.
  await PhoneVerification.create({
    id: uuidv4(),
    phone: normalized,
    userId,
    token: 'auth0',
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });
}

/** Create/login phone user with profile draft, send OTP, return pending tokens. */
export async function registerPhone(body: RegisterPhoneBody): Promise<AuthResponse> {
  const phone = normalizePhone(body.phone);
  if (phone.length < 8) throw new AppError(400, 'Invalid phone number');

  let user = await User.findOne({ where: { phone } });
  if (user && user.isPhoneVerified) {
    throw new ConflictError('An account with this phone number already exists. Please sign in.');
  }

  if (!user) {
    // Synthetic email so unique email constraint is satisfied
    const email = `phone_${phone.replace(/\D/g, '')}@phone.rootaroo.local`;
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) user = existingEmail;
    else {
      user = await User.create({
        id: uuidv4(),
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
  } else {
    user.displayName = body.displayName;
    if (body.dateOfBirth !== undefined) user.dateOfBirth = body.dateOfBirth || null;
    if (body.homeAddress !== undefined) user.homeAddress = body.homeAddress || null;
    if (body.addToCalendar !== undefined) user.addToCalendar = body.addToCalendar;
    if (body.notifyHousehold !== undefined) user.notifyHousehold = body.notifyHousehold;
    if (body.avatarUrl !== undefined) user.avatarUrl = body.avatarUrl;
    if (body.avatarPresetId !== undefined) user.avatarPresetId = body.avatarPresetId;
    if (body.avatarEmoji !== undefined) user.avatarEmoji = body.avatarEmoji;
    await user.save();
  }

  await issuePhoneOtp(phone, user.id);
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);

  return {
    user: toUserResponse(user),
    tokens: { accessToken, refreshToken },
  };
}

export async function sendPhoneOtp(body: SendPhoneOtpBody, userId?: string): Promise<void> {
  const phone = normalizePhone(body.phone);
  const user = userId
    ? await User.findByPk(userId)
    : await User.findOne({ where: { phone } });

  if (userId && user && user.phone && normalizePhone(user.phone) !== phone) {
    throw new AppError(400, 'Phone does not match your account');
  }

  await issuePhoneOtp(phone, user?.id || null);
}

export async function verifyPhoneOtp(body: VerifyPhoneOtpBody, userId?: string): Promise<AuthResponse> {
  const phone = normalizePhone(body.phone);

  await verifyPhoneOtpViaAuth0(phone, body.code);

  const record = await PhoneVerification.findOne({
    where: { phone, verifiedAt: null },
    order: [['createdAt', 'DESC']],
  });
  if (record) {
    record.verifiedAt = new Date();
    await record.save();
  }

  let user: User | null = null;
  if (userId) {
    user = await User.findByPk(userId);
  } else if (record?.userId) {
    user = await User.findByPk(record.userId);
  } else {
    user = await User.findOne({ where: { phone } });
  }

  if (!user) throw new NotFoundError('User');

  user.phone = phone;
  user.isPhoneVerified = true;
  await user.save();

  // Issue auth tokens for login flow (unauthenticated) or refresh for authenticated
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);

  return { user: toUserResponse(user), tokens: { accessToken, refreshToken } };
}
