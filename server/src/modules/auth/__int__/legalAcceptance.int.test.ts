import request from 'supertest';
import app from '../../../app';
import { setupAssociations, LegalAcceptance } from '../../../database/models';
import { LEGAL_VERSIONS } from '../../../config/legal';
import { resetDb, closeIntResources } from '../../../test/int/db';

beforeAll(() => setupAssociations());
beforeEach(() => resetDb());
afterAll(() => closeIntResources());

const PHONE = { 'X-Device-Id': '11111111-2222-4333-8444-555555555555', 'X-Device-Name': 'Pixel', 'X-Platform': 'android', 'X-App-Version': '1.0.0' };

async function newAccount() {
  const res = await request(app).post('/api/v1/auth/register').set(PHONE)
    .send({ email: 'asha@example.test', password: 'correct horse battery', displayName: 'Asha' });
  expect(res.status).toBe(201);
  return { userId: res.body.data.user.id as string, token: res.body.data.tokens.accessToken as string };
}

describe('legal acceptance log (real database)', () => {
  it('stores one row per document with versions, both times, IP and app version', async () => {
    const { userId, token } = await newAccount();
    const agreedAt = new Date(Date.now() - 60_000).toISOString();

    const res = await request(app).post('/api/v1/auth/legal/accept').set(PHONE)
      .set('Authorization', `Bearer ${token}`).send({ method: 'signup_checkbox', agreedAt });
    expect(res.status).toBe(201);
    expect(res.body.data.versions).toEqual(LEGAL_VERSIONS);

    const rows = await LegalAcceptance.findAll({ where: { userId }, order: [['document', 'ASC']] });
    expect(rows.map((r) => [r.document, r.version, r.method])).toEqual([
      ['privacy', LEGAL_VERSIONS.privacy, 'signup_checkbox'],
      ['terms', LEGAL_VERSIONS.terms, 'signup_checkbox'],
    ]);
    for (const r of rows) {
      expect(r.agreedAtClient.toISOString().slice(0, 19)).toBe(agreedAt.slice(0, 19));
      expect(Math.abs(r.acceptedAt.getTime() - Date.now())).toBeLessThan(60_000);
      expect(r.ip).toBeTruthy();
      expect(r.appVersion).toBe('1.0.0');
      expect(r.platform).toBe('android');
    }
  });

  it('needs a signed-in user and a valid body', async () => {
    const noAuth = await request(app).post('/api/v1/auth/legal/accept')
      .send({ method: 'signup_checkbox', agreedAt: new Date().toISOString() });
    expect(noAuth.status).toBe(401);

    const { token } = await newAccount();
    const badMethod = await request(app).post('/api/v1/auth/legal/accept').set('Authorization', `Bearer ${token}`)
      .send({ method: 'just_because', agreedAt: new Date().toISOString() });
    expect(badMethod.status).toBe(400);
    expect(await LegalAcceptance.count()).toBe(0);
  });
});
