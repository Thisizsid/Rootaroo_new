import apiClient from './client';

/**
 * The journal is private to its author — every one of these endpoints is
 * scoped server-side to the caller's own entries, so there is no
 * `userId`/`householdId` to pass from here.
 */
export const journalApi = {
  /**
   * `files` is a FormData of `files` parts. The response's `fileName` is the
   * durable S3 key to persist as `mediaUrl`; its `url` is a signed preview
   * link that expires and must never be sent back to the server.
   */
  uploadMedia: (files) =>
    apiClient.post('/journal/media/upload', files, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data),

  create: (data) =>
    apiClient.post('/journal', data).then((r) => r.data.data),

  list: (params) =>
    apiClient.get('/journal', { params }).then((r) => r.data.data),

  getById: (id) =>
    apiClient.get(`/journal/${id}`).then((r) => r.data.data),

  update: (id, data) =>
    apiClient.patch(`/journal/${id}`, data).then((r) => r.data.data),

  delete: (id) =>
    apiClient.delete(`/journal/${id}`),

  /** Streak, month totals, the 7-day strip and today's prompt. */
  stats: () =>
    apiClient.get('/journal/stats').then((r) => r.data.data),

  /** `month` is `YYYY-MM`; omitted means the current month. */
  history: (month) =>
    apiClient.get('/journal/history', { params: month ? { month } : undefined })
      .then((r) => r.data.data),

  /** Past years' entries sharing `date`'s month/day (`YYYY-MM-DD`). */
  onThisDay: (date) =>
    apiClient.get('/journal/on-this-day', { params: date ? { date } : undefined })
      .then((r) => r.data.data),
};
