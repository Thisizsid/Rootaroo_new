import apiClient from './client';

/**
 * Location check-in API (FR-160 → FR-168).
 * Location is optional — a check-in without coords is a timestamp-only
 * "I'm safe" ping (FR-168). Permission is requested on tap only (FR-166),
 * never at app launch; no background tracking (FR-167).
 */
export const checkInApi = {
  create: (data) =>
    apiClient
      .post('/checkins', data)
      .then((r) => r.data.data),

  list: (params) =>
    apiClient
      .get('/checkins', { params })
      .then((r) => r.data.data),

  listByMember: (userId, days = 7) =>
    apiClient
      .get(`/checkins/members/${userId}`, {
        params: { days },
      })
      .then((r) => r.data.data),
};
