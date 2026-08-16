import { googleAuth, sendVerification, verifyEmail, forgotPassword, resetPassword, scheduleDeletion, cancelDeletion, confirmDeletion, registerPhone, sendPhoneOtp, verifyPhoneOtp } from '../service';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

jest.mock('../../../database/models', () => ({
  User: { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn(), update: jest.fn() },
  RefreshToken: { count: jest.fn(), findAll: jest.fn(), destroy: jest.fn(), create: jest.fn(), findOne: jest.fn() },
  EmailVerification: { findOne: jest.fn(), update: jest.fn(), create: jest.fn() },
  PasswordReset: { findOne: jest.fn(), update: jest.fn(), create: jest.fn() },
  PhoneVerification: { findOne: jest.fn(), update: jest.fn(), create: jest.fn() },
}));

import * as models from '../../../database/models';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockIdToken = ['e30', 'e30', 'e30'].join('.');
const googleBody = { code: 'auth-code-123', redirectUri: 'com.rootaroo://oauth/callback' };

function fakeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'test@user.com',
    displayName: 'Test User',
    avatarUrl: null,
    avatarEmoji: null,
    role: 'member',
    isVerified: true,
    googleId: 'google123',
    passwordHash: '',
    lastLoginAt: null,
    createdAt: new Date('2026-07-04'),
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function setupGoogleApi() {
  mockFetch
    .mockReset()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ id_token: mockIdToken }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sub: 'google123', email: 'test@user.com', name: 'Test User' }),
    });
}

describe('Auth Service — Google OAuth', () => {
  beforeEach(() => { jest.clearAllMocks(); mockFetch.mockReset(); });
  // ... existing google tests unchanged
  it('should create a new user from Google profile and return tokens', async () => {
    setupGoogleApi();
    (models.User.findOne as jest.Mock).mockResolvedValue(null);
    (models.User.create as jest.Mock).mockResolvedValue(fakeUser());
    const result = await googleAuth(googleBody);
    expect(result.user.email).toBe('test@user.com');
    expect(result.tokens.accessToken).toBeTruthy();
    expect(result.tokens.refreshToken).toBeTruthy();
  });

  it('should link googleId to existing user found by email', async () => {
    setupGoogleApi();
    const user = fakeUser({ googleId: null, save: jest.fn().mockResolvedValue(undefined) });
    (models.User.findOne as jest.Mock).mockResolvedValue(user);
    const result = await googleAuth(googleBody);
    expect(result.tokens.accessToken).toBeTruthy();
    expect(user.googleId).toBe('google123');
    expect(user.save).toHaveBeenCalled();
  });

  it('should authenticate existing googleId user', async () => {
    setupGoogleApi();
    const user = fakeUser({ save: jest.fn().mockResolvedValue(undefined) });
    (models.User.findOne as jest.Mock).mockResolvedValue(user);
    await googleAuth(googleBody);
    expect(user.save).toHaveBeenCalled();
  });

  it('should throw if token exchange fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, text: async () => 'invalid_grant' });
    await expect(googleAuth(googleBody)).rejects.toThrow('Google token exchange failed');
  });

  it('should throw if no ID token in response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'abc', expires_in: 3600 }) });
    await expect(googleAuth(googleBody)).rejects.toThrow('No ID token returned from Google');
  });

  it('should throw if ID token verification fails', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id_token: mockIdToken }) })
      .mockResolvedValueOnce({ ok: false, status: 400 });
    await expect(googleAuth(googleBody)).rejects.toThrow('Google ID token verification failed');
  });
});

describe('Auth Service — Email Verification', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe('sendVerification', () => {
    it('should generate a code, store it, and log it in dev mode', async () => {
      const user = fakeUser({ isVerified: false });
      (models.User.findByPk as jest.Mock).mockResolvedValue(user);

      await sendVerification(user.id);

      expect(models.EmailVerification.update).toHaveBeenCalled();
      expect(models.EmailVerification.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: user.id, token: expect.any(String) }),
      );
    });

    it('should throw NotFoundError if user does not exist', async () => {
      (models.User.findByPk as jest.Mock).mockResolvedValue(null);
      await expect(sendVerification('nonexistent')).rejects.toThrow('User');
    });

    it('should throw ConflictError if already verified', async () => {
      const user = fakeUser({ isVerified: true });
      (models.User.findByPk as jest.Mock).mockResolvedValue(user);
      await expect(sendVerification(user.id)).rejects.toThrow('Email already verified');
    });
  });

  describe('verifyEmail', () => {
    it('should mark verification as used and set user as verified', async () => {
      const verification = { verifiedAt: null, save: jest.fn().mockResolvedValue(undefined) };
      (models.EmailVerification.findOne as jest.Mock).mockResolvedValue(verification);

      await verifyEmail('user-id', { code: '123456' });

      expect(verification.verifiedAt).toBeInstanceOf(Date);
      expect(verification.save).toHaveBeenCalled();
      expect(models.User.update).toHaveBeenCalledWith(
        { isVerified: true },
        { where: { id: 'user-id' } },
      );
    });

    it('should throw if code is invalid or expired', async () => {
      (models.EmailVerification.findOne as jest.Mock).mockResolvedValue(null);
      await expect(verifyEmail('user-id', { code: 'wrong' }))
        .rejects.toThrow('Invalid or expired verification code');
    });
  });
});

describe('Auth Service — Password Reset', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe('forgotPassword', () => {
    it('should generate a code, store it, and log it in dev mode', async () => {
      (models.User.findOne as jest.Mock).mockResolvedValue({ id: 'u1', email: 'test@user.com' });
      await forgotPassword({ email: 'test@user.com' });
      expect(models.PasswordReset.update).toHaveBeenCalled();
      expect(models.PasswordReset.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u1', token: expect.any(String) }),
      );
    });

    it('should return silently if user not found (prevent email enumeration)', async () => {
      (models.User.findOne as jest.Mock).mockResolvedValue(null);
      await forgotPassword({ email: 'missing@user.com' });
      expect(models.PasswordReset.create).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should hash new password, update user, and mark code used', async () => {
      const record = { userId: 'u1', update: jest.fn().mockResolvedValue(undefined) };
      (models.PasswordReset.findOne as jest.Mock).mockResolvedValue(record);
      await resetPassword({ code: '123456', password: 'newpass123' });
      expect(models.User.update).toHaveBeenCalledWith(
        { passwordHash: expect.any(String) },
        { where: { id: 'u1' } },
      );
      expect(record.update).toHaveBeenCalledWith({ usedAt: expect.any(Date) });
    });

    it('should throw for invalid or expired code', async () => {
      (models.PasswordReset.findOne as jest.Mock).mockResolvedValue(null);
      await expect(resetPassword({ code: 'wrong', password: 'newpass123' }))
        .rejects.toThrow('Invalid or expired reset code');
    });
  });
});

describe('Auth Service — Account Deletion', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe('scheduleDeletion', () => {
    const hash = '$2b$04$bUCIhz76H.vDDixGSaXRt.vmZy8izCpNSiK4ZVGtmhtY1twdLD31W';

    it('should set scheduledDeletionAt to 30 days from now', async () => {
      const user = { id: 'u1', passwordHash: hash, scheduledDeletionAt: null, save: jest.fn() };
      (models.User.findByPk as jest.Mock).mockResolvedValue(user);
      await scheduleDeletion('u1', { password: 'password123' });
      expect(user.scheduledDeletionAt).toBeInstanceOf(Date);
      expect(user.save).toHaveBeenCalled();
    });

    it('should throw for wrong password', async () => {
      (models.User.findByPk as jest.Mock).mockResolvedValue({
        id: 'u1', passwordHash: hash, save: jest.fn(),
      });
      await expect(scheduleDeletion('u1', { password: 'wrong' }))
        .rejects.toThrow('Invalid password');
    });

    it('should throw if user not found', async () => {
      (models.User.findByPk as jest.Mock).mockResolvedValue(null);
      await expect(scheduleDeletion('missing', { password: 'x' }))
        .rejects.toThrow('User');
    });
  });

  describe('cancelDeletion', () => {
    it('should clear scheduledDeletionAt', async () => {
      const user = { id: 'u1', scheduledDeletionAt: new Date(), save: jest.fn() };
      (models.User.findByPk as jest.Mock).mockResolvedValue(user);
      await cancelDeletion('u1');
      expect(user.scheduledDeletionAt).toBeNull();
      expect(user.save).toHaveBeenCalled();
    });
  });

  describe('confirmDeletion', () => {
    const hash = '$2b$04$bUCIhz76H.vDDixGSaXRt.vmZy8izCpNSiK4ZVGtmhtY1twdLD31W';

    it('should revoke tokens and soft-delete user', async () => {
      const user = { id: 'u1', passwordHash: hash, destroy: jest.fn().mockResolvedValue(undefined) };
      (models.User.findByPk as jest.Mock).mockResolvedValue(user);
      await confirmDeletion('u1', { password: 'password123' });
      expect(models.RefreshToken.destroy).toHaveBeenCalledWith({ where: { userId: 'u1' } });
      expect(user.destroy).toHaveBeenCalled();
    });
  });
});

describe('Auth Service — Phone OTP (Auth0 Passwordless SMS)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    (models.PhoneVerification.update as jest.Mock).mockResolvedValue([0]);
    (models.PhoneVerification.create as jest.Mock).mockResolvedValue({ id: 'pv1' });
  });

  function fakePhoneUser(overrides: Record<string, unknown> = {}) {
    return {
      id: 'u1',
      phone: '+15551234567',
      isPhoneVerified: false,
      displayName: 'Phone User',
      createdAt: new Date('2026-07-04'),
      save: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    };
  }

  describe('registerPhone / sendPhoneOtp — /passwordless/start', () => {
    it('should send OTP successfully when Auth0 accepts the request', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      (models.User.findOne as jest.Mock).mockResolvedValue(null);
      (models.User.create as jest.Mock).mockResolvedValue(fakePhoneUser());

      const result = await registerPhone({ phone: '+15551234567', displayName: 'Phone User' });

      expect(result.tokens.accessToken).toBeTruthy();
      expect(result.tokens.refreshToken).toBeTruthy();
      expect(result.verificationCode).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/passwordless/start'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should throw if Auth0 rejects the send request', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 429 });
      (models.User.findByPk as jest.Mock).mockResolvedValue(fakePhoneUser());

      await expect(sendPhoneOtp({ phone: '+15551234567' }, 'u1'))
        .rejects.toThrow('Failed to send verification code');
    });
  });

  describe('verifyPhoneOtp — /oauth/token', () => {
    it('should mark the user verified and issue tokens when Auth0 confirms the code', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'auth0-token' }) });
      const record = { userId: 'u1', verifiedAt: null, save: jest.fn().mockResolvedValue(undefined) };
      (models.PhoneVerification.findOne as jest.Mock).mockResolvedValue(record);
      const user = fakePhoneUser();
      (models.User.findByPk as jest.Mock).mockResolvedValue(user);

      const result = await verifyPhoneOtp({ phone: '+15551234567', code: '123456' }, 'u1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/oauth/token'),
        expect.objectContaining({ method: 'POST' }),
      );
      expect(record.verifiedAt).toBeInstanceOf(Date);
      expect(user.isPhoneVerified).toBe(true);
      expect(result.tokens.accessToken).toBeTruthy();
    });

    it('should throw and leave the user unverified when Auth0 rejects the code', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });

      await expect(verifyPhoneOtp({ phone: '+15551234567', code: '000000' }, 'u1'))
        .rejects.toThrow('Invalid or expired verification code');
      expect(models.PhoneVerification.findOne).not.toHaveBeenCalled();
    });
  });
});
