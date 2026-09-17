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

  getOutlookSyncStatus: () =>
    apiClient
      .get('/events/outlook/status')
      .then((r) => r.data.data),

  connectOutlookCalendar: () =>
    apiClient
      .post('/events/outlook/connect')
      .then((r) => r.data.data),

  disconnectOutlookCalendar: () =>
    apiClient.post('/events/outlook/disconnect'),

  getAppleSyncStatus: () =>
    apiClient
      .get('/events/apple/status')
      .then((r) => r.data.data),

  connectAppleCalendar: (data) =>
    apiClient
      .post('/events/apple/connect', data)
      .then((r) => r.data.data),

  disconnectAppleCalendar: () =>
    apiClient.post('/events/apple/disconnect'),
};
