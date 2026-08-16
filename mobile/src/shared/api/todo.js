import apiClient from './client';

export const todoApi = {
  create: (data) =>
    apiClient.post('/todos', data).then((r) => r.data.data),

  list: () =>
    apiClient.get('/todos').then((r) => r.data.data),

  update: (id, data) =>
    apiClient.patch(`/todos/${id}`, data).then((r) => r.data.data),

  delete: (id) =>
    apiClient.delete(`/todos/${id}`),

  toggle: (id) =>
    apiClient.post(`/todos/${id}/toggle`).then((r) => r.data.data),

  summary: () =>
    apiClient.get('/todos/summary').then((r) => r.data.data),
};
