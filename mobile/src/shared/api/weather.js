import apiClient from './client';

/** Current weather API (Open-Meteo, via the server — no client-side key). */
export const weatherApi = {
  get: (lat, lon) =>
    apiClient
      .get('/weather', {
        params: {
          lat,
          lon,
        },
      })
      .then((r) => r.data.data),
};
