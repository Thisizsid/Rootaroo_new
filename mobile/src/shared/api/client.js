import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';

// Expo's dev client already knows a reachable host for this machine — it just
// downloaded the JS bundle from it. Deriving the API host from it means a
// changed LAN IP (Wi-Fi reconnect, DHCP renewal) doesn't require hand-editing
// .env and rebuilding; the app just follows wherever Metro currently is.
function getDevServerHost() {
  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.43:8081"
  if (!hostUri) return null;
  return hostUri.split(':')[0] || null;
}

const devHost = getDevServerHost();

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiBaseUrl ||
  (devHost ? `http://${devHost}:3000/api/v1` : null) ||
  (Platform.OS === 'android' && !Constants.isDevice
    ? 'http://10.0.2.2:3000/api/v1'
    : 'http://localhost:3000/api/v1');

if (__DEV__) {
  console.log('[apiClient] BASE_URL:', BASE_URL);
}

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    // Prevent Express ETag 304 responses (axios treats 304 as a non-2xx error,
    // which silently breaks vault key lookups and document listing).
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
  validateStatus: (status) => status >= 200 && status < 400, // accept 304
});

// ── Refresh-token mutex ──
let isRefreshing = false;
let refreshQueue = [];

function onRefreshed(newToken) {
  refreshQueue.forEach((q) => q.resolve(newToken));
  refreshQueue = [];
}

function onRefreshFailed(error) {
  refreshQueue.forEach((q) => q.reject(error));
  refreshQueue = [];
}

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // Another request is already refreshing — queue this one
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (newToken) => {
              if (original.headers) {
                original.headers.Authorization = `Bearer ${newToken}`;
              }
              resolve(apiClient(original));
            },
            reject,
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          useAuthStore.getState().logout();
          return Promise.reject(error);
        }
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;
        useAuthStore.getState().setAuth(useAuthStore.getState().user, accessToken, newRefresh);
        if (original.headers) original.headers.Authorization = `Bearer ${accessToken}`;
        onRefreshed(accessToken);
        return apiClient(original);
      } catch (refreshError) {
        onRefreshFailed(refreshError);
        useAuthStore.getState().logout();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
