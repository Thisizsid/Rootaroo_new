import { updateProfileSchema, registerPhoneSchema } from '../validation';

// The app sends back the signed photo link it was shown; CloudFront links run past 500 characters.
describe('auth validation: avatarUrl', () => {
  const signed = `https://d123.cloudfront.net/avatars/u1/p.jpg?Expires=1791700000&Signature=${'A'.repeat(600)}&Key-Pair-Id=K2`;

  it.each([
    ['updateProfileSchema', updateProfileSchema],
  ])('%s accepts a signed photo link longer than 500 characters', (_name, schema) => {
    expect(schema.body!.safeParse({ avatarUrl: signed }).success).toBe(true);
  });

  it('registerPhoneSchema accepts it too', () => {
    expect(registerPhoneSchema.body!.safeParse({ phone: '5550100192', displayName: 'Asha', avatarUrl: signed }).success).toBe(true);
  });

  it('still caps the length', () => {
    expect(updateProfileSchema.body!.safeParse({ avatarUrl: 'x'.repeat(2049) }).success).toBe(false);
  });
});
