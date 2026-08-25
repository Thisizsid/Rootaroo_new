import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { JournalEntry, JournalMedia, HouseholdMember } from '../../database/models';
import { NotFoundError, ForbiddenError } from '../../shared/utils/errors';
import { getSignedUrl } from '../../shared/utils/s3';
import type {
  CreateEntryBody,
  UpdateEntryBody,
  JournalEntryResponse,
  JournalMediaResponse,
  JournalEntryQuery,
  PaginatedJournalResponse,
} from './types';

/**
 * Look up the user's current household membership.
 * Throws 403 if the user does not belong to any household.
 */
async function getUserHousehold(userId: string): Promise<string> {
  const membership = await HouseholdMember.findOne({ where: { userId } });
  if (!membership) {
    throw new ForbiddenError('You must belong to a household to use the journal');
  }
  return membership.householdId;
}

async function toMediaResponse(items: JournalMedia[]): Promise<JournalMediaResponse[]> {
  return Promise.all(items.map(async (m) => ({
    id: m.id,
    mediaUrl: (await getSignedUrl(m.mediaUrl))!,
    mediaType: m.mediaType,
    thumbnailUrl: await getSignedUrl(m.thumbnailUrl),
    fileSizeBytes: m.fileSizeBytes,
  })));
}

async function toEntryResponse(entry: JournalEntry): Promise<JournalEntryResponse> {
  const media = (entry.get('media') as JournalMedia[]) || [];
  return {
    id: entry.id,
    content: entry.content,
    media: await toMediaResponse(media),
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

/**
 * Journal entries are private to the author — every query here filters by
 * BOTH householdId and userId, on reads as well as writes, with no
 * admin-override escape hatch anywhere (unlike Feed/Vault). A record that
 * isn't the caller's own simply doesn't exist as far as any query is
 * concerned, so a wrong id 404s rather than 403s — the same
 * don't-leak-existence pattern Vault uses for its owner-scoped reads.
 */
export async function createEntry(
  userId: string,
  body: CreateEntryBody,
): Promise<JournalEntryResponse> {
  const householdId = await getUserHousehold(userId);

  const entry = await JournalEntry.create({
    id: uuidv4(),
    householdId,
    userId,
    content: body.content || null,
  });

  if (body.media && body.media.length > 0) {
    await JournalMedia.bulkCreate(
      body.media.map((m) => ({
        id: uuidv4(),
        entryId: entry.id,
        mediaUrl: m.mediaUrl,
        mediaType: m.mediaType,
        thumbnailUrl: m.thumbnailUrl || null,
        fileSizeBytes: m.fileSizeBytes || null,
      })),
    );
  }

  const fullEntry = await JournalEntry.findByPk(entry.id, {
    include: [{ model: JournalMedia, as: 'media' }],
  });
  if (!fullEntry) throw new Error('Failed to load created journal entry');

  return await toEntryResponse(fullEntry);
}

export async function listEntries(
  userId: string,
  options: JournalEntryQuery,
): Promise<PaginatedJournalResponse> {
  const householdId = await getUserHousehold(userId);
  const limit = options.limit || 20;
  const where: any = { householdId, userId };

  if (options.cursor) {
    const cursorEntry = await JournalEntry.findOne({
      where: { id: options.cursor, householdId, userId },
      attributes: ['createdAt'],
      paranoid: false,
    });
    if (cursorEntry) {
      where.createdAt = { [Op.lt]: cursorEntry.createdAt };
    }
  }

  const entries = await JournalEntry.findAll({
    where,
    include: [{ model: JournalMedia, as: 'media' }],
    order: [['createdAt', 'DESC']],
    limit: limit + 1,
  });

  const hasMore = entries.length > limit;
  const pageEntries = entries.slice(0, limit);

  return {
    entries: await Promise.all(pageEntries.map(toEntryResponse)),
    nextCursor: hasMore ? pageEntries[pageEntries.length - 1].id : null,
    hasMore,
  };
}

export async function getEntryById(
  userId: string,
  entryId: string,
): Promise<JournalEntryResponse> {
  const householdId = await getUserHousehold(userId);

  const entry = await JournalEntry.findOne({
    where: { id: entryId, householdId, userId },
    include: [{ model: JournalMedia, as: 'media' }],
  });
  if (!entry) throw new NotFoundError('Journal entry');

  return await toEntryResponse(entry);
}

export async function updateEntry(
  userId: string,
  entryId: string,
  body: UpdateEntryBody,
): Promise<JournalEntryResponse> {
  const householdId = await getUserHousehold(userId);

  const entry = await JournalEntry.findOne({
    where: { id: entryId, householdId, userId },
  });
  if (!entry) throw new NotFoundError('Journal entry');

  await entry.update({ content: body.content });

  const fullEntry = await JournalEntry.findByPk(entry.id, {
    include: [{ model: JournalMedia, as: 'media' }],
  });
  if (!fullEntry) throw new Error('Failed to load updated journal entry');

  return await toEntryResponse(fullEntry);
}

export async function deleteEntry(userId: string, entryId: string): Promise<void> {
  const householdId = await getUserHousehold(userId);

  const entry = await JournalEntry.findOne({
    where: { id: entryId, householdId, userId },
  });
  if (!entry) throw new NotFoundError('Journal entry');

  await entry.destroy();
}
