import apiClient from './client';

export const groceryApi = {
  create: (data) =>
    apiClient.post('/groceries', data).then((r) => r.data.data),

  list: () =>
    apiClient.get('/groceries').then((r) => r.data.data),

  update: (id, data) =>
    apiClient.patch(`/groceries/${id}`, data).then((r) => r.data.data),

  delete: (id) =>
    apiClient.delete(`/groceries/${id}`),

  toggle: (id) =>
    apiClient.post(`/groceries/${id}/toggle`).then((r) => r.data.data),

  archive: (id) =>
    apiClient.post(`/groceries/${id}/archive`).then((r) => r.data.data),

  summary: () =>
    apiClient.get('/groceries/summary').then((r) => r.data.data),
};
