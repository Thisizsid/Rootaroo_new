const mockStore = new Map();
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(async (k, v) => { mockStore.set(k, v); }),
  getItemAsync: jest.fn(async (k) => mockStore.get(k) ?? null),
  deleteItemAsync: jest.fn(async (k) => { mockStore.delete(k); }),
}));

const { savePendingAgreement, sendPendingAgreement, clearPendingAgreement, METHODS } = require('../pendingAgreement');

const api = (impl) => ({ acceptLegal: jest.fn(impl ?? (async () => ({}))) });

beforeEach(() => mockStore.clear());

describe('pending Terms acceptance', () => {
  it('sends the saved method and tap time once, then forgets it', async () => {
    const tickedAt = new Date('2026-10-11T09:00:00Z');
    await savePendingAgreement(METHODS.SIGNUP_CHECKBOX, tickedAt);
    const a = api();
    expect(await sendPendingAgreement(a)).toBe(true);
    expect(a.acceptLegal).toHaveBeenCalledWith({ method: 'signup_checkbox', agreedAt: tickedAt.toISOString() });
    expect(await sendPendingAgreement(a)).toBe(false); // nothing left to send
    expect(a.acceptLegal).toHaveBeenCalledTimes(1);
  });

  it('keeps it for a retry when the send fails (offline, server down)', async () => {
    await savePendingAgreement(METHODS.SIGNIN_NOTICE);
    expect(await sendPendingAgreement(api(async () => { throw new Error('Network Error'); }))).toBe(false);
    const retry = api();
    expect(await sendPendingAgreement(retry)).toBe(true);
    expect(retry.acceptLegal).toHaveBeenCalledWith(expect.objectContaining({ method: 'signin_notice' }));
  });

  it('drops it when the server rejects it for good, so it is not retried forever', async () => {
    await savePendingAgreement(METHODS.SIGNUP_CHECKBOX, new Date('2020-01-01T00:00:00Z'));
    const rejected = Object.assign(new Error('too old'), { response: { status: 400 } });
    expect(await sendPendingAgreement(api(async () => { throw rejected; }))).toBe(false);
    const later = api();
    expect(await sendPendingAgreement(later)).toBe(false);
    expect(later.acceptLegal).not.toHaveBeenCalled();
  });

  it('two sends at once (sign-in and app start) record it only once', async () => {
    await savePendingAgreement(METHODS.SIGNUP_CHECKBOX);
    const a = api();
    await Promise.all([sendPendingAgreement(a), sendPendingAgreement(a)]);
    expect(a.acceptLegal).toHaveBeenCalledTimes(1);
  });

  it('clear removes an unsent one', async () => {
    await savePendingAgreement(METHODS.SIGNUP_CHECKBOX);
    await clearPendingAgreement();
    const a = api();
    expect(await sendPendingAgreement(a)).toBe(false);
    expect(a.acceptLegal).not.toHaveBeenCalled();
  });
});
