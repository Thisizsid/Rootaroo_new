import apiClient from './client';

export const expenseApi = {
  create: (data) =>
    apiClient
      .post('/expenses', data)
      .then((r) => r.data.data),

  list: (params) =>
    apiClient
      .get('/expenses', { params })
      .then((r) => r.data.data),

  getById: (id) =>
    apiClient
      .get(`/expenses/${id}`)
      .then((r) => r.data.data),

  update: (id, data) =>
    apiClient
      .patch(`/expenses/${id}`, data)
      .then((r) => r.data.data),

  remove: (id) =>
    apiClient.delete(`/expenses/${id}`).then((r) => r.data),

  markSettled: (id) =>
    apiClient
      .post(`/expenses/${id}/settle`)
      .then((r) => r.data.data),

  sendReminder: (id) =>
    apiClient
      .post(`/expenses/${id}/remind`)
      .then((r) => r.data.data),

  getSummary: () =>
    apiClient
      .get('/expenses/summary')
      .then((r) => r.data.data),

  getLedger: () =>
    apiClient
      .get('/expenses/ledger')
      .then((r) => r.data.data),

  recordSettlement: (data) =>
    apiClient
      .post('/expenses/settle', data)
      .then((r) => r.data.data),

  listSettlements: (params) =>
    apiClient
      .get('/expenses/settlements', { params })
      .then((r) => r.data.data),
};
