import { create } from 'zustand';
import { saveTokens, saveHouseholdId, loadTokens, clearTokens } from './authPersist';
import {
  clearSignupProgress,
  loadSignupProgress,
} from './signupProgress';
import apiClient from '../api/client';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  householdId: null,
  signupProgress: null,

  setAuth: (user, accessToken, refreshToken) => {
    set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
    saveTokens(accessToken, refreshToken, user).catch(() => {});
  },

  setAuthPending: (user, accessToken, refreshToken) => {
    set({ user, accessToken, refreshToken, isAuthenticated: false, isLoading: false });
    // Persist so kill-app mid-setup can resume
    saveTokens(accessToken, refreshToken, user).catch(() => {});
  },

  setUser: (user) => {
    set({ user });
    const { accessToken, refreshToken } = get();
    if (accessToken && refreshToken) {
      saveTokens(accessToken, refreshToken, user).catch(() => {});
    }
  },

  setLoading: (isLoading) => set({ isLoading }),

  setHousehold: (householdId) => {
    set({ householdId });
    saveHouseholdId(householdId).catch(() => {});
  },

  setSignupProgress: (signupProgress) => set({ signupProgress }),

  logout: () => {
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      householdId: null,
      signupProgress: null,
    });
    clearTokens().catch(() => {});
    clearSignupProgress().catch(() => {});
  },

  completeSetup: () => {
    const { accessToken, refreshToken, user } = get();
    set({ isAuthenticated: true, isLoading: false, signupProgress: null });
    clearSignupProgress().catch(() => {});
    if (accessToken && refreshToken && user) {
      saveTokens(accessToken, refreshToken, user).catch(() => {});
    }
  },

  restoreSession: async () => {
    try {
      const [{ accessToken, refreshToken, user, householdId }, progress] = await Promise.all([
        loadTokens(),
        loadSignupProgress(),
      ]);

      const incomplete =
        !!progress &&
        !progress.setupComplete &&
        progress.step !== 'done';

      // Incomplete signup must not sticky-resume across restarts/rebuilds.
      // SecureStore survives rebuilds; clearing avoids opening mid-wizard (e.g. step 1).
      // In-session wizard navigation still works via navigation.replace.
      if (incomplete) {
        await Promise.all([clearTokens(), clearSignupProgress()]);
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          householdId: null,
          signupProgress: null,
        });
        return;
      }

      if (accessToken && refreshToken && user) {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          householdId: householdId ?? null,
          signupProgress: null,
        });

        apiClient
          .get('/households')
          .then((r) => {
            if (r.data.data.length > 0) {
              const id = r.data.data[0].id;
              set({ householdId: id });
              saveHouseholdId(id).catch(() => {});
            }
          })
          .catch(() => {});
      } else {
        set({ isLoading: false, signupProgress: null });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
