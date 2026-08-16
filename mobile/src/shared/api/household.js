import { useAuthStore } from '../store/authStore';
import apiClient from './client';

export const householdApi = {
  create: (name) =>
    apiClient.post('/households', { name }).then((r) => r.data.data),

  join: (code) =>
    apiClient.post('/households/join', { code }).then((r) => r.data.data),

  generateInvite: (householdId) =>
    apiClient.post(`/households/${householdId}/invitations`).then((r) => r.data.data),

  listMyHouseholds: () =>
    apiClient.get('/households').then((r) => r.data.data),

  getMembers: (householdId) =>
    apiClient.get(`/households/${householdId}/members`).then((r) => r.data.data),

  removeMember: (householdId, userId) =>
    apiClient.delete(`/households/${householdId}/members/${userId}`).then((r) => r.data.data),

  changeRole: (householdId, userId, role) =>
    apiClient.patch(`/households/${householdId}/members/${userId}/role`, { role }).then((r) => r.data.data),

  leave: (householdId) =>
    apiClient.post(`/households/${householdId}/leave`).then((r) => r.data.data),

  transferAdmin: (householdId, newAdminId) =>
    apiClient.post(`/households/${householdId}/transfer`, { newAdminId }).then((r) => r.data.data),

  getHousehold: (householdId) =>
    apiClient.get(`/households/${householdId}`).then((r) => r.data.data),

  uploadCoverPhoto: (householdId, fileUri) => {
    const formData = new FormData();
    formData.append('cover', {
      uri: fileUri,
      type: 'image/jpeg',
      name: 'cover.jpg',
    });
    return apiClient
      .post(`/households/${householdId}/cover-photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data);
  },

  removeCoverPhoto: (householdId) =>
    apiClient.delete(`/households/${householdId}/cover-photo`).then((r) => r.data.data),

  scheduleDeletion: (householdId, password) =>
    apiClient.post(`/households/${householdId}/schedule-deletion`, { password }).then((r) => r.data.data),

  cancelDeletion: (householdId) =>
    apiClient.post(`/households/${householdId}/cancel-deletion`).then((r) => r.data.data),

  confirmDeletion: (householdId, password) =>
    apiClient.post(`/households/${householdId}/confirm-deletion`, { password }).then((r) => r.data.data),
};

export async function loadMyHousehold() {
  try {
    const households = await householdApi.listMyHouseholds();
    if (households.length > 0) {
      useAuthStore.getState().setHousehold(households[0].id);
    }
  } catch {
    // User may not be in a household yet — that's fine
  }
}
