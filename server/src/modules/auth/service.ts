import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomInt } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { env } from '../../config/env';
import { User, RefreshToken, EmailVerification, PasswordReset, PhoneVerification } from '../../database/models';
import { getMailer } from '../../shared/utils/mailer';
import { getSignedUrl } from '../../shared/utils/s3';
import { sendSms } from '../../shared/utils/sns';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { hashOtpCode, MAX_OTP_ATTEMPTS } from '../../shared/utils/otp';
import { UnauthorizedError, ConflictError, NotFoundError, AppError } from '../../shared/utils/errors';
import type {
  RegisterBody, LoginBody, AuthResponse, AuthTokens, UserResponse, UpdateProfileBody, GoogleAuthBody,
  AppleAuthBody,
  VerifyEmailBody, ForgotPasswordBody, ResetPasswordBody, CheckResetCodeBody, ScheduleDeletionBody,
  SendPhoneOtpBody, VerifyPhoneOtpBody, RegisterPhoneBody,
} from './types';

// ── Helpers ──

async function toUserResponse(user: User): Promise<UserResponse> {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: await getSignedUrl(user.avatarUrl),
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

  let phone: string | undefined;
  if (body.phone) {
    phone = normalizePhone(body.phone);
    const existingPhone = await User.findOne({ where: { phone } });
    if (existingPhone) {
      throw new ConflictError('An account with this phone number already exists');
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    id: uuidv4(),
    email: email.toLowerCase(),
    passwordHash,
    displayName,
    phone: phone || null,
    role: 'member',
    isVerified: false,
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);

  // Auto-send verification code for new registrations
  const code = await sendVerification(user.id);

  return { user: await toUserResponse(user), tokens: { accessToken, refreshToken }, verificationCode: code };
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

  return { user: await toUserResponse(user), tokens: { accessToken, refreshToken } };
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
  return await toUserResponse(user);
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
  if (body.phone !== undefined) {
    const normalized = body.phone ? normalizePhone(body.phone) : null;
    if (normalized && normalized !== user.phone) {
      const existingPhone = await User.findOne({ where: { phone: normalized } });
      if (existingPhone && existingPhone.id !== user.id) {
        throw new ConflictError('An account with this phone number already exists');
      }
    }
    user.phone = normalized;
  }
  if (body.addToCalendar !== undefined) user.addToCalendar = body.addToCalendar;
  if (body.notifyHousehold !== undefined) user.notifyHousehold = body.notifyHousehold;

  await user.save();
  return await toUserResponse(user);
}

// ── Google OAuth ──

export async function googleAuth(body: GoogleAuthBody): Promise<AuthResponse> {
  const { idToken } = body;

  // The mobile client obtains this ID token directly from Google's native
  // Sign-In SDK (@react-native-google-signin/google-signin), configured
  // with our Web Client ID as the audience — there's no server-side code
  // exchange anymore. Verify it via Google's tokeninfo endpoint exactly as
  // before, but since we no longer control which client requested the
  // token ourselves, we MUST check the `aud` claim matches our own client —
  // otherwise anyone could hand us a valid Google ID token issued to a
  // completely different app and log in as that Google user.
  const verifyResponse = await fetch('https://www.googleapis.com/oauth2/v3/tokeninfo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ id_token: idToken }),
  });

  if (!verifyResponse.ok) {
    throw new AppError(401, 'Google ID token verification failed');
  }

  const profile = await verifyResponse.json() as {
    sub: string; email: string; name?: string; picture?: string; aud?: string;
  };

  if (profile.aud !== env.google.clientId) {
    throw new AppError(401, 'Google ID token was not issued for this app');
  }

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

  return { user: await toUserResponse(user), tokens: { accessToken, refreshToken } };
}

// ── Apple OAuth ──

const APPLE_JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

export async function appleAuth(body: AppleAuthBody): Promise<AuthResponse> {
  const { idToken, displayName: providedName } = body;

  // The mobile client obtains this identity token directly from Apple's
  // native Sign In SDK — unlike Google there's no tokeninfo REST endpoint,
  // so verification means checking the JWT's signature against Apple's own
  // public keys (JWKS) plus its issuer/audience claims ourselves.
  let payload;
  try {
    const result = await jwtVerify(idToken, APPLE_JWKS, {
      issuer: 'https://appleid.apple.com',
      audience: env.apple.bundleId,
    });
    payload = result.payload;
  } catch {
    throw new AppError(401, 'Apple ID token verification failed');
  }

  const appleId = payload.sub as string;
  const email = (payload.email as string | undefined)?.toLowerCase();
  if (!email) {
    throw new AppError(400, 'Apple did not provide an email for this account');
  }

  // Find existing user by appleId or email
  let user = await User.findOne({
    where: { [Op.or]: [{ appleId }, { email }] },
  });

  if (user) {
    // Link appleId if user exists with this email but no appleId
    if (!user.appleId) {
      user.appleId = appleId;
    }
    user.lastLoginAt = new Date();
    await user.save();
  } else {
    // Apple only returns a display name on the user's very first sign-in
    // for this app (via the native SDK response, not the JWT) — fall back
    // to deriving one from the email on every later sign-in.
    user = await User.create({
      id: uuidv4(),
      email,
      passwordHash: '',
      displayName: providedName || email.split('@')[0],
      role: 'member',
      isVerified: true,
      appleId,
    });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);

  return { user: await toUserResponse(user), tokens: { accessToken, refreshToken } };
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

  // If SMTP is not configured, return the code for dev-mode display only —
  // never in production, where a missing SMTP config should be a delivery
  // failure, not a JSON-response leak of a live verification code.
  if (!transporter) {
    if (env.nodeEnv !== 'production') {
      console.warn(`[DEV] Email verification code for ${user.email}: ${code}`);
      return code;
    }
    console.error(`SMTP is not configured — unable to deliver email verification code for user ${userId}`);
    return undefined;
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

  // Generate 6-digit code — only the hash is ever persisted; the raw code
  // exists only for delivery (email/dev-log), never stored at rest.
  const code = randomInt(100000, 1000000).toString();

  await PasswordReset.create({
    id: uuidv4(),
    userId: user.id,
    token: hashOtpCode(code),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });

  // Send email or dev-log using shared mailer singleton
  const transporter = getMailer();

  if (!transporter) {
    if (env.nodeEnv !== 'production') {
      console.warn(`[DEV] Password reset code for ${user.email}: ${code}`);
    } else {
      console.error(`SMTP is not configured — unable to deliver password reset code for user ${user.id}`);
    }
    return;
  }

  await transporter.sendMail({
    from: env.smtp.from,
    to: user.email,
    subject: 'Reset your Rootaroo password',
    text: `Your password reset code is: ${code}\n\nThis code expires in 15 minutes.`,
  });
}

// Looks up the most recent active reset request for the given email and
// verifies the code against it. Scoping by email (not just the code alone)
// closes the account-enumeration-by-code-guessing gap: knowing/guessing a
// valid 6-digit code is no longer sufficient by itself, since it must also
// match the specific account it claims to be for. Failed attempts increment
// a per-record counter and lock the record out after MAX_OTP_ATTEMPTS,
// independent of the IP-based auth rate limiter.
async function findActivePasswordReset(email: string, code: string) {
  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user) return null;

  const record = await PasswordReset.findOne({
    where: { userId: user.id, usedAt: null, expiresAt: { [Op.gt]: new Date() } },
    order: [['createdAt', 'DESC']],
  });
  if (!record) return null;
  if (record.attempts >= MAX_OTP_ATTEMPTS) return null;

  if (record.token !== hashOtpCode(code)) {
    record.attempts += 1;
    await record.save();
    return null;
  }

  return record;
}

export async function checkResetCode(body: CheckResetCodeBody): Promise<void> {
  const record = await findActivePasswordReset(body.email, body.code);
  if (!record) {
    throw new AppError(400, 'Invalid or expired reset code');
  }
}

export async function resetPassword(body: ResetPasswordBody): Promise<void> {
  const record = await findActivePasswordReset(body.email, body.code);

  if (!record) {
    throw new AppError(400, 'Invalid or expired reset code');
  }

  const passwordHash = await bcrypt.hash(body.password, 12);
  await User.update({ passwordHash }, { where: { id: record.userId } });
  await record.update({ usedAt: new Date() });

  // Kill any existing sessions — a reset is often prompted by suspected
  // account compromise, so a stale refresh token must not survive it.
  await RefreshToken.destroy({ where: { userId: record.userId } });
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

  // Free up the unique identifiers (email/phone/googleId) before soft-deleting —
  // paranoid deletes leave the row physically in the table, so without this a
  // later signup or Google/phone login reusing the same email, phone, or
  // Google account hits a unique-constraint violation instead of just working,
  // since the lookup (paranoid-aware) can't see the deleted row to reuse it.
  await user.update({
    email: `deleted-${user.id}@deleted.rootaroo.local`,
    phone: null,
    googleId: null,
  });

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

// ── Phone OTP (generated, stored, and verified in-app; delivered via AWS SNS) ──

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Generates and stores a 6-digit code (same pattern as sendVerification's
 * email code), then sends it via SNS — or, if SNS isn't configured, logs it
 * and returns it for a dev-mode passthrough, matching sendVerification's
 * SMTP fallback.
 */
async function issuePhoneOtp(phone: string, userId: string | null): Promise<string | undefined> {
  const normalized = normalizePhone(phone);

  // Invalidate any existing unverified codes for this phone
  await PhoneVerification.update(
    { verifiedAt: new Date() },
    { where: { phone: normalized, verifiedAt: null } },
  );

  const code = randomInt(100000, 1000000).toString();
  await PhoneVerification.create({
    id: uuidv4(),
    phone: normalized,
    userId,
    token: hashOtpCode(code),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });

  if (!env.sns.accessKeyId) {
    if (env.nodeEnv !== 'production') {
      console.warn(`[DEV] Phone OTP for ${normalized}: ${code}`);
      return code;
    }
    console.error(`AWS SNS is not configured — unable to deliver phone OTP for ${normalized}`);
    return undefined;
  }

  await sendSms(normalized, `Your Rootaroo verification code is: ${code}. It expires in 15 minutes.`);
  return undefined;
}

/**
 * Create/login phone user with profile draft, return pending tokens. Does
 * NOT send an OTP itself — the wizard sends one explicitly, right before
 * showing the verify screen, via sendPhoneOtp(). Sending one here too would
 * be wasted (no verify screen is shown at this point) and would invalidate
 * itself the moment the real send happens later.
 */
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

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);

  return {
    user: await toUserResponse(user),
    tokens: { accessToken, refreshToken },
  };
}

export async function sendPhoneOtp(body: SendPhoneOtpBody, userId?: string): Promise<string | undefined> {
  const phone = normalizePhone(body.phone);
  let user = userId
    ? await User.findByPk(userId)
    : await User.findOne({ where: { phone } });

  if (userId && user && user.phone && normalizePhone(user.phone) !== phone) {
    throw new AppError(400, 'Phone does not match your account');
  }

  // Unauthenticated call with no existing account for this phone — the
  // "Continue with phone number" entry on Sign In is shared by new and
  // returning users with no way to tell them apart up front, so create a
  // minimal placeholder account here (find-or-create) rather than sending a
  // code that verifyPhoneOtp() could never resolve to a user afterward.
  if (!userId && !user) {
    const email = `phone_${phone.replace(/\D/g, '')}@phone.rootaroo.local`;
    user = await User.findOne({ where: { email } });
    if (!user) {
      user = await User.create({
        id: uuidv4(),
        email,
        passwordHash: '',
        displayName: 'Member',
        phone,
        isPhoneVerified: false,
        isVerified: false,
        role: 'member',
      });
    }
  }

  return issuePhoneOtp(phone, user?.id || null);
}

export async function verifyPhoneOtp(body: VerifyPhoneOtpBody, userId?: string): Promise<AuthResponse> {
  const phone = normalizePhone(body.phone);

  const record = await PhoneVerification.findOne({
    where: {
      phone,
      verifiedAt: null,
      expiresAt: { [Op.gt]: new Date() },
    },
    order: [['createdAt', 'DESC']],
  });
  if (!record || record.attempts >= MAX_OTP_ATTEMPTS) {
    throw new AppError(400, 'Invalid or expired verification code');
  }
  if (record.token !== hashOtpCode(body.code)) {
    record.attempts += 1;
    await record.save();
    throw new AppError(400, 'Invalid or expired verification code');
  }
  record.verifiedAt = new Date();
  await record.save();

  let user: User | null = null;
  if (userId) {
    user = await User.findByPk(userId);
  } else if (record.userId) {
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

  return { user: await toUserResponse(user), tokens: { accessToken, refreshToken } };
}
