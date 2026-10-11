import { acceptLegal } from '../legalService';
import * as models from '../../../database/models';
import { LEGAL_VERSIONS } from '../../../config/legal';
import { ValidationError } from '../../../shared/utils/errors';

jest.mock('../../../database/models', () => ({
  LegalAcceptance: { bulkCreate: jest.fn(async (rows: unknown[]) => rows) },
  sequelize: { transaction: jest.fn(async (fn: (t: unknown) => unknown) => fn({ id: 'tx' })) },
}));

const modelsMock = models as any;
const userId = '550e8400-e29b-41d4-a716-446655440001';
const NOW = new Date('2026-10-11T10:00:00Z');
const device = { deviceKey: null, name: 'Pixel', platform: 'android' as const, appVersion: '1.0.0' };

describe('acceptLegal', () => {
  beforeEach(() => jest.clearAllMocks());

  it('logs the terms and the privacy policy, each with its version, both times, IP and app version', async () => {
    const agreedAt = '2026-10-11T09:59:30.000Z';
    const result = await acceptLegal(userId, { method: 'signup_checkbox', agreedAt }, { ip: '152.233.68.98', device }, NOW);

    const [rows, options] = modelsMock.LegalAcceptance.bulkCreate.mock.calls[0];
    expect(options).toEqual({ transaction: { id: 'tx' } });
    expect(rows).toEqual([
      expect.objectContaining({ userId, document: 'terms', version: LEGAL_VERSIONS.terms }),
      expect.objectContaining({ userId, document: 'privacy', version: LEGAL_VERSIONS.privacy }),
    ]);
    for (const row of rows) {
      expect(row).toEqual(expect.objectContaining({
        method: 'signup_checkbox',
        agreedAtClient: new Date(agreedAt),
        acceptedAt: NOW, // the server's own time, not the phone's
        ip: '152.233.68.98',
        appVersion: '1.0.0',
        platform: 'android',
      }));
    }
    expect(result).toEqual({ versions: LEGAL_VERSIONS, acceptedAt: NOW.toISOString() });
  });

  it('records the Sign In notice as its own method, and works without device details', async () => {
    const none = { deviceKey: null, name: null, platform: null, appVersion: null };
    await acceptLegal(userId, { method: 'signin_notice', agreedAt: NOW.toISOString() }, { ip: null, device: none }, NOW);
    const [rows] = modelsMock.LegalAcceptance.bulkCreate.mock.calls[0];
    expect(rows[0]).toEqual(expect.objectContaining({ method: 'signin_notice', ip: null, appVersion: null, platform: null }));
  });

  it.each([
    ['in the future beyond a day', '2026-10-12T10:00:01Z'],
    ['older than 30 days', '2026-09-11T09:59:59Z'],
    ['not a time', 'yesterday'],
  ])('rejects a tap time %s and writes nothing', async (_label, agreedAt) => {
    await expect(acceptLegal(userId, { method: 'signup_checkbox', agreedAt }, { ip: null, device }, NOW))
      .rejects.toBeInstanceOf(ValidationError);
    expect(modelsMock.LegalAcceptance.bulkCreate).not.toHaveBeenCalled();
  });

  it('accepts a phone clock that runs a little fast, and a send retried weeks later', async () => {
    await acceptLegal(userId, { method: 'signup_checkbox', agreedAt: '2026-10-11T12:00:00Z' }, { ip: null, device }, NOW);
    await acceptLegal(userId, { method: 'signup_checkbox', agreedAt: '2026-09-20T10:00:00Z' }, { ip: null, device }, NOW);
    expect(modelsMock.LegalAcceptance.bulkCreate).toHaveBeenCalledTimes(2);
  });
});
