import {
  createEntry,
  listEntries,
  getEntryById,
  updateEntry,
  deleteEntry,
} from '../service';
import * as models from '../../../database/models';
import { ForbiddenError, NotFoundError } from '../../../shared/utils/errors';

const userId = '550e8400-e29b-41d4-a716-446655440001';
const otherUserId = '660e8400-e29b-41d4-a716-446655440002';
const householdId = '880e8400-e29b-41d4-a716-446655440004';
const entryId = '990e8400-e29b-41d4-a716-446655440005';

jest.mock('../../../database/models', () => {
  const mockModel = (name: string) => {
    const cls: any = jest.fn().mockName(name);
    cls.create = jest.fn();
    cls.findAll = jest.fn();
    cls.findOne = jest.fn();
    cls.findByPk = jest.fn();
    cls.bulkCreate = jest.fn();
    return cls;
  };
  return {
    JournalEntry: mockModel('JournalEntry'),
    JournalMedia: mockModel('JournalMedia'),
    HouseholdMember: mockModel('HouseholdMember'),
  };
});

const modelsMock = models as any;

function mockEntry(overrides: any = {}) {
  const entry: any = {
    id: entryId,
    householdId,
    userId,
    content: 'Today was a good day',
    createdAt: new Date('2026-07-10T10:00:00Z'),
    updatedAt: new Date('2026-07-10T10:00:00Z'),
    destroy: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockImplementation(function (this: any, data: any) {
      Object.assign(this, data);
      return Promise.resolve(this);
    }),
    get: jest.fn(),
    ...overrides,
  };
  entry.get.mockImplementation((key: string) => (key === 'media' ? overrides.media || [] : entry[key]));
  return entry;
}

describe('Journal Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    modelsMock.HouseholdMember.findOne.mockResolvedValue({ householdId, userId });
  });

  describe('createEntry', () => {
    it('should create a text-only entry', async () => {
      const entry = mockEntry();
      modelsMock.JournalEntry.create.mockResolvedValue(entry);
      modelsMock.JournalEntry.findByPk.mockResolvedValue(entry);

      const result = await createEntry(userId, { content: 'Today was a good day' });

      expect(modelsMock.JournalEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({ householdId, userId, content: 'Today was a good day' }),
      );
      expect(modelsMock.JournalMedia.bulkCreate).not.toHaveBeenCalled();
      expect(result.content).toBe('Today was a good day');
    });

    it('should create an entry with media', async () => {
      const media = [{ id: 'm1', mediaUrl: 'https://cloudinary.com/photo.jpg', mediaType: 'photo', thumbnailUrl: null, fileSizeBytes: 1000 }];
      const entry = mockEntry({ content: null, media });
      modelsMock.JournalEntry.create.mockResolvedValue(entry);
      modelsMock.JournalEntry.findByPk.mockResolvedValue(entry);

      const result = await createEntry(userId, {
        media: [{ mediaUrl: 'https://cloudinary.com/photo.jpg', mediaType: 'photo', fileSizeBytes: 1000 }],
      });

      expect(modelsMock.JournalMedia.bulkCreate).toHaveBeenCalledWith([
        expect.objectContaining({ entryId, mediaUrl: 'https://cloudinary.com/photo.jpg', mediaType: 'photo' }),
      ]);
      expect(result.media).toHaveLength(1);
    });

    it('should throw ForbiddenError if user is not a household member', async () => {
      modelsMock.HouseholdMember.findOne.mockResolvedValue(null);

      await expect(createEntry(userId, { content: 'Hi' })).rejects.toThrow(ForbiddenError);
    });
  });

  describe('listEntries', () => {
    it('should only query entries scoped to the caller (householdId + userId)', async () => {
      modelsMock.JournalEntry.findAll.mockResolvedValue([mockEntry()]);

      await listEntries(userId, { limit: 20 });

      expect(modelsMock.JournalEntry.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { householdId, userId },
        }),
      );
    });

    it('should indicate hasMore when more rows than limit are returned', async () => {
      modelsMock.JournalEntry.findAll.mockResolvedValue([mockEntry(), mockEntry({ id: 'e2' })]);

      const result = await listEntries(userId, { limit: 1 });

      expect(result.entries).toHaveLength(1);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe(entryId);
    });
  });

  describe('getEntryById', () => {
    it('should return the entry when it belongs to the caller', async () => {
      modelsMock.JournalEntry.findOne.mockResolvedValue(mockEntry());

      const result = await getEntryById(userId, entryId);

      expect(modelsMock.JournalEntry.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: entryId, householdId, userId } }),
      );
      expect(result.id).toBe(entryId);
    });

    it('should throw NotFoundError (not ForbiddenError) for another user\'s entry', async () => {
      // Simulates another user's entry: the owner-scoped where clause matches nothing.
      modelsMock.JournalEntry.findOne.mockResolvedValue(null);

      await expect(getEntryById(otherUserId, entryId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateEntry', () => {
    it('should update the content of the caller\'s own entry', async () => {
      const entry = mockEntry();
      modelsMock.JournalEntry.findOne.mockResolvedValue(entry);
      modelsMock.JournalEntry.findByPk.mockResolvedValue(mockEntry({ content: 'Updated' }));

      const result = await updateEntry(userId, entryId, { content: 'Updated' });

      expect(entry.update).toHaveBeenCalledWith({ content: 'Updated' });
      expect(result.content).toBe('Updated');
    });

    it('should throw NotFoundError for an entry that is not the caller\'s own', async () => {
      modelsMock.JournalEntry.findOne.mockResolvedValue(null);

      await expect(updateEntry(otherUserId, entryId, { content: 'Nope' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteEntry', () => {
    it('should delete the caller\'s own entry', async () => {
      const entry = mockEntry();
      modelsMock.JournalEntry.findOne.mockResolvedValue(entry);

      await deleteEntry(userId, entryId);

      expect(entry.destroy).toHaveBeenCalled();
    });

    it('should throw NotFoundError for an entry that is not the caller\'s own', async () => {
      modelsMock.JournalEntry.findOne.mockResolvedValue(null);

      await expect(deleteEntry(otherUserId, entryId)).rejects.toThrow(NotFoundError);
    });
  });
});
