import apiClient from './client';

/**
 * Saved-places API — Home/Office/School/custom location bookmarks, shared
 * across the household, editable only by whoever created them.
 */
export const placeApi = {
  create: (data) =>
    apiClient
      .post('/places', data)
      .then((r) => r.data.data),

  list: () =>
    apiClient
      .get('/places')
      .then((r) => r.data.data),

  update: (id, data) =>
    apiClient
      .patch(`/places/${id}`, data)
      .then((r) => r.data.data),

  remove: (id) =>
    apiClient.delete(`/places/${id}`),
};
