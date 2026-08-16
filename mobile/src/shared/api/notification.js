import apiClient from './client';

export const notificationApi = {
  registerToken: (token, platform) =>
    apiClient.post('/notifications/tokens', { token, platform }),

  unregisterToken: (token) =>
    apiClient.delete(`/notifications/tokens/${encodeURIComponent(token)}`),

  getHistory: (params) =>
    apiClient.get('/notifications/history', { params })
      .then((r) => r.data.data),

  markAsRead: (id) =>
    apiClient.post(`/notifications/history/${id}/read`),

  markAllAsRead: () =>
    apiClient.post('/notifications/history/read-all'),

  getUnreadCount: () =>
    apiClient.get('/notifications/unread-count')
      .then((r) => r.data.data.count),

  getPreferences: () =>
    apiClient.get('/notifications/preferences')
      .then((r) => r.data.data),

  updatePreferences: (data) =>
    apiClient.patch('/notifications/preferences', data)
      .then((r) => r.data.data),
};
