import apiClient from './client';

/** Calendar events API. */
export const eventApi = {
  list: (params) =>
    apiClient
      .get('/events', { params })
      .then((r) => r.data.data),

  create: (data) =>
    apiClient
      .post('/events', data)
      .then((r) => r.data.data),

  getGoogleSyncStatus: () =>
    apiClient
      .get('/events/google/status')
      .then((r) => r.data.data),

  connectGoogleCalendar: (data) =>
    apiClient
      .post('/events/google/connect', data)
      .then((r) => r.data.data),

  disconnectGoogleCalendar: () =>
    apiClient.post('/events/google/disconnect'),
};
