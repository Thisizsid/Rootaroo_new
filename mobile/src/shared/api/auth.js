import apiClient from './client';
import { useAuthStore } from '../store/authStore';

function toStoreUser(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.displayName,
    role: u.role,
    householdId: undefined,
    avatarUrl: u.avatarUrl,
    avatarEmoji: u.avatarEmoji,
    avatarPresetId: u.avatarPresetId,
    dateOfBirth: u.dateOfBirth,
    homeAddress: u.homeAddress,
    phone: u.phone,
    isVerified: u.isVerified,
    isPhoneVerified: u.isPhoneVerified,
  };
}

export const authApi = {
  register: (data) =>
    apiClient.post('/auth/register', data).then((r) => r.data.data),

  login: (data) =>
    apiClient.post('/auth/login', data).then((r) => r.data.data),

  forgotPassword: (email) =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (data) =>
    apiClient.post('/auth/reset-password', data),

  checkResetCode: (code) =>
    apiClient.post('/auth/check-reset-code', { code }),

  updateProfile: (data) =>
    apiClient.patch('/auth/profile', data).then((r) => r.data.data),

  getMe: () =>
    apiClient.get('/auth/me').then((r) => r.data.data),

  googleAuth: (data) =>
    apiClient.post('/auth/google', data).then((r) => r.data.data),

  appleAuth: (data) =>
    apiClient.post('/auth/apple', data).then((r) => r.data.data),

  verifyEmail: (code) =>
    apiClient.post('/auth/verify-email', { code }),

  sendVerification: () =>
    apiClient.post('/auth/send-verification'),

  registerPhone: (data) =>
    apiClient
      .post('/auth/phone/register', data)
      .then((r) => r.data.data),

  sendPhoneOtp: (phone) =>
    apiClient
      .post('/auth/phone/send-otp', { phone })
      .then((r) => r.data.data),

  verifyPhoneOtp: (data) =>
    apiClient
      .post('/auth/phone/verify-otp', data)
      .then((r) => r.data.data),

  cancelPendingRegistration: () =>
    apiClient.post('/auth/account/cancel-pending'),

  scheduleDeletion: (password) =>
    apiClient.post('/auth/account/schedule-deletion', { password }),

  cancelDeletion: () =>
    apiClient.post('/auth/account/cancel-deletion'),

  confirmDeletion: (password) =>
    apiClient.post('/auth/account/confirm-deletion', { password }),

  uploadAvatar: (fileUri) => {
    const formData = new FormData();
    formData.append('avatar', {
      uri: fileUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    });
    return apiClient
      .post(
        '/auth/avatar',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      .then((r) => r.data.data);
  },
};

export function storeAuthResponse(resp) {
  useAuthStore.getState().setAuth(toStoreUser(resp.user), resp.tokens.accessToken, resp.tokens.refreshToken);
}

export function storePendingAuthResponse(resp) {
  useAuthStore
    .getState()
    .setAuthPending(toStoreUser(resp.user), resp.tokens.accessToken, resp.tokens.refreshToken);
}

export { toStoreUser };
