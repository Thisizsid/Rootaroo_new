// The Terms acceptance saved before the account existed is sent as soon as tokens arrive (issue #15).
const mockSend = jest.fn(async () => true);
const mockClear = jest.fn(async () => {});
jest.mock('../../legal/pendingAgreement', () => ({
  sendPendingAgreement: (...a) => mockSend(...a),
  clearPendingAgreement: (...a) => mockClear(...a),
}));
jest.mock('../authPersist', () => ({
  saveTokens: jest.fn().mockResolvedValue(), saveHouseholdId: jest.fn(), clearTokens: jest.fn().mockResolvedValue(),
  loadTokens: jest.fn(),
}));
jest.mock('../signupProgress', () => ({ clearSignupProgress: jest.fn().mockResolvedValue(), loadSignupProgress: jest.fn().mockResolvedValue(null) }));
jest.mock('../../api/client', () => ({ __esModule: true, default: { get: jest.fn().mockResolvedValue({ data: { data: [] } }) }, requestTokenRefresh: jest.fn() }));
jest.mock('../../cache/screenCache', () => ({ warmScreenCache: jest.fn().mockResolvedValue(), clearScreenCache: jest.fn(), clearSharedRequests: jest.fn() }));
jest.mock('../../cache/homePrefetch', () => ({ prefetchHome: jest.fn() }));
jest.mock('../feedStore', () => ({ useFeedStore: { getState: () => ({ reset: jest.fn() }), setState: jest.fn() } }));
jest.mock('../../pushNotifications', () => ({ unregisterPushNotificationsAsync: jest.fn() }));
jest.mock('../../device/deviceInfo', () => ({ loadDeviceId: jest.fn().mockResolvedValue() }));

const { useAuthStore } = require('../authStore');
const user = { id: 'u1', email: 'a@example.test' };

beforeEach(() => { mockSend.mockClear(); mockClear.mockClear(); });

describe('auth store and the Terms acceptance log', () => {
  it('sends it when a new account gets its first tokens (sign-up, Google, Apple, phone)', () => {
    useAuthStore.getState().setAuthPending(user, 'access', 'refresh');
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('sends it on a direct sign-in too', () => {
    useAuthStore.getState().setAuth(user, 'access', 'refresh');
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('retries an unsent one when the app opens signed in', async () => {
    require('../authPersist').loadTokens.mockResolvedValue({ accessToken: 'header.eyJleHAiOjQxMDI0NDQ4MDB9.sig', refreshToken: 'r', user, householdId: 'h1' });
    await useAuthStore.getState().restoreSession();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(mockSend).toHaveBeenCalled();
  });

  it('signing out drops an unsent one, so it is never filed under the next account', () => {
    useAuthStore.getState().logout();
    expect(mockClear).toHaveBeenCalled();
  });
});
