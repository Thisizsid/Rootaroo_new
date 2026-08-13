import apiClient from './client';

export const dashboardApi = {
  get: () =>
    apiClient.get('/dashboard').then((r) => r.data.data),
  quickNotify: (action, memberIds, message) =>
    apiClient.post('/dashboard/quick-notify', { action, memberIds, message }),
};
