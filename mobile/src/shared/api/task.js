import apiClient from './client';

export const taskApi = {
  create: (data) =>
    apiClient.post('/tasks', data).then((r) => r.data.data),

  list: (params) =>
    apiClient
      .get('/tasks', { params })
      .then((r) => r.data.data),

  getById: (id) =>
    apiClient.get(`/tasks/${id}`).then((r) => r.data.data),

  update: (id, data) =>
    apiClient.patch(`/tasks/${id}`, data).then((r) => r.data.data),

  delete: (id) =>
    apiClient.delete(`/tasks/${id}`),

  complete: (id) =>
    apiClient.post(`/tasks/${id}/complete`).then((r) => r.data.data),

  reopen: (id) =>
    apiClient.post(`/tasks/${id}/reopen`).then((r) => r.data.data),

  summary: () =>
    apiClient.get('/tasks/summary').then((r) => r.data.data),
};
