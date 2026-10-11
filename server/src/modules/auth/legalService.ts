import { LegalAcceptance, sequelize } from '../../database/models';
import type { LegalAcceptanceMethod, LegalDocument } from '../../database/models/LegalAcceptance';
import { LEGAL_VERSIONS } from '../../config/legal';
import { ValidationError } from '../../shared/utils/errors';
import type { DeviceInfo } from '../device/types';

const DAY_MS = 24 * 60 * 60 * 1000;
/** A phone clock can run a little fast, and an unsent acceptance is retried later, but not forever. */
const MAX_FUTURE_MS = DAY_MS;
const MAX_AGE_MS = 30 * DAY_MS;

export interface AcceptLegalInput {
  method: LegalAcceptanceMethod;
  /** When the person ticked the box or tapped the button, from the phone (ISO time). */
  agreedAt: string;
}

export interface LegalAcceptanceResult {
  versions: typeof LEGAL_VERSIONS;
  acceptedAt: string;
}

/**
 * Records that the user accepted the current Terms of Service and Privacy Policy: one row
 * per document, stamped with the server's time, the versions in force, and the IP and app
 * version as proof. Rows are only ever added.
 */
export async function acceptLegal(
  userId: string,
  input: AcceptLegalInput,
  context: { ip: string | null; device: DeviceInfo },
  now: Date = new Date(),
): Promise<LegalAcceptanceResult> {
  const agreedAt = new Date(input.agreedAt);
  if (Number.isNaN(agreedAt.getTime())) throw new ValidationError('agreedAt must be a valid time');
  if (agreedAt.getTime() > now.getTime() + MAX_FUTURE_MS) throw new ValidationError('agreedAt is in the future');
  if (agreedAt.getTime() < now.getTime() - MAX_AGE_MS) throw new ValidationError('agreedAt is too old');

  const documents: LegalDocument[] = ['terms', 'privacy'];
  await sequelize.transaction(async (transaction) => {
    await LegalAcceptance.bulkCreate(
      documents.map((document) => ({
        userId,
        document,
        version: LEGAL_VERSIONS[document],
        method: input.method,
        agreedAtClient: agreedAt,
        acceptedAt: now,
        ip: context.ip ? context.ip.slice(0, 64) : null,
        appVersion: context.device.appVersion,
        platform: context.device.platform,
      })),
      { transaction },
    );
  });
  return { versions: LEGAL_VERSIONS, acceptedAt: now.toISOString() };
}
