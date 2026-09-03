import {
  uploadDocument,
  listDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  hardDeleteDocument,
  getStorageUsage,
  storeUserKey,
  getUserKey,
} from '../service';
import { NotFoundError, ForbiddenError } from '../../../shared/utils/errors';
import fs from 'node:fs';
import path from 'node:path';

const userId = '550e8400-e29b-41d4-a716-446655440001';
const otherUserId = '660e8400-e29b-41d4-a716-446655440002';
const adminUserId = '770e8400-e29b-41d4-a716-446655440003';
const householdId = '880e8400-e29b-41d4-a716-446655440004';
const documentId = '990e8400-e29b-41d4-a716-446655440005';

// ── Model Mocks (factory must be inline for jest.mock hoisting) ──

jest.mock('../../../database/models', () => {
  const mockModel = (name: string) => {
    const cls: any = jest.fn().mockName(name);
    cls.create = jest.fn();
    cls.findAll = jest.fn();
    cls.findOne = jest.fn();
    cls.findByPk = jest.fn();
    cls.destroy = jest.fn();
    cls.upsert = jest.fn();
    cls.sum = jest.fn();
    return cls;
  };
  return {
    sequelize: {
      transaction: jest.fn(async (cb) => cb({})),
    },
    VaultDocument: mockModel('VaultDocument'),
    VaultDocumentKey: mockModel('VaultDocumentKey'),
    VaultKey: mockModel('VaultKey'),
    User: mockModel('User'),
    HouseholdMember: mockModel('HouseholdMember'),
  };
});

jest.mock('../../../shared/utils/s3', () => ({
  uploadBuffer: jest.fn(),
  deleteObject: jest.fn(),
  getSignedUrl: jest.fn((key: string | null) => Promise.resolve(key ? `https://signed.example.com/${key}` : null)),
}));

import { VaultDocument, VaultDocumentKey, VaultKey, HouseholdMember } from '../../../database/models';
import { uploadBuffer, deleteObject } from '../../../shared/utils/s3';

const mockDoc = (overrides: any = {}) => ({
  id: documentId,
  householdId,
  name: 'Test Doc',
  mimeType: 'image/jpeg',
  sizeBytes: 1024,
  encryptedKey: 'enc-key-123',
  iv: 'iv-123',
  s3Key: 'vault/test-s3-key',
  uploadedBy: userId,
  createdAt: new Date('2026-07-12T10:00:00Z'),
  updatedAt: new Date('2026-07-12T10:00:00Z'),
  get: (key: string) => {
    if (key === 'uploader') {
      return { id: userId, displayName: 'Test User', avatarUrl: null, avatarEmoji: null };
    }
    return null;
  },
  save: jest.fn(),
  destroy: jest.fn(),
  ...overrides,
});

const mockVaultKey = (overrides: any = {}) => ({
  userId,
  householdId,
  publicKey: 'pub-key-123',
  privateKeyEncrypted: 'enc-priv-key',
  createdAt: new Date('2026-07-12T10:00:00Z'),
  get: () => null,
  ...overrides,
});

describe('Vault Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: everyone belongs to the household; only adminUserId holds
    // the admin role — used both by getUserHousehold (userId-only lookup)
    // and the DB-backed isCurrentHouseholdAdmin check (F-06).
    (HouseholdMember.findOne as jest.Mock).mockImplementation(({ where }: any) =>
      Promise.resolve({ householdId, userId: where.userId, role: where.userId === adminUserId ? 'admin' : 'member' }),
    );
  });

  // ─── uploadDocument ───

  describe('uploadDocument', () => {
    const uploadBody = {
      name: 'Test Doc',
      mimeType: 'image/jpeg',
      sizeBytes: 1024,
      encryptedKey: 'enc-key-123',
      iv: 'iv-123',
    };

    it('should upload a document and return response', async () => {
      const fileBuffer = Buffer.from('test');
      (uploadBuffer as jest.Mock).mockResolvedValue({ key: 'vault/test-s3-key' });
      const createdDoc = mockDoc();
      (VaultDocument.create as jest.Mock).mockResolvedValue(createdDoc);
      (VaultDocumentKey.create as jest.Mock).mockResolvedValue({ documentId, userId, wrappedKey: 'enc-key-123' });
      (VaultDocument.findByPk as jest.Mock).mockResolvedValue(createdDoc);

      const result = await uploadDocument(userId, uploadBody, fileBuffer);

      expect(uploadBuffer).toHaveBeenCalled();
      expect(VaultDocument.create).toHaveBeenCalled();
      expect(VaultDocumentKey.create).toHaveBeenCalled();
      expect(result.id).toBe(documentId);
      expect(result.name).toBe('Test Doc');
    });

    it('should reject files over 20MB', async () => {
      await expect(
        uploadDocument(userId, { ...uploadBody, sizeBytes: 21 * 1024 * 1024 }, Buffer.from('test'))
      ).rejects.toThrow(ForbiddenError);
    });

    it('should reject uploads exceeding household quota', async () => {
      (uploadBuffer as jest.Mock).mockResolvedValue({ key: 'vault/test-s3-key' });
      (VaultDocument.sum as jest.Mock).mockResolvedValue(2 * 1024 * 1024 * 1024); // already at 2GB

      await expect(
        uploadDocument(userId, uploadBody, Buffer.from('test'))
      ).rejects.toThrow(ForbiddenError);
    });
  });

  // ─── listDocuments ───

  describe('listDocuments', () => {
    it('should return paginated documents', async () => {
      const docs = [mockDoc({ id: 'doc1' }), mockDoc({ id: 'doc2' })];
      (VaultDocument.findAll as jest.Mock).mockResolvedValue(docs);

      const result = await listDocuments(userId, { limit: 20 });

      expect(result.documents).toHaveLength(2);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });
  });

  // ─── getDocumentById ───

  describe('getDocumentById', () => {
    it('should return a document by ID', async () => {
      (VaultDocument.findOne as jest.Mock).mockResolvedValue(mockDoc());

      const result = await getDocumentById(documentId, userId);

      expect(result.id).toBe(documentId);
      expect(result.name).toBe('Test Doc');
    });

    it('should throw NotFoundError for non-existent document', async () => {
      (VaultDocument.findOne as jest.Mock).mockResolvedValue(null);

      await expect(getDocumentById(documentId, userId)).rejects.toThrow(NotFoundError);
    });
  });

  // ─── updateDocument ───

  describe('updateDocument', () => {
    it('should allow the uploader to rename', async () => {
      const doc = mockDoc();
      (VaultDocument.findOne as jest.Mock).mockResolvedValue(doc);
      (VaultDocument.findByPk as jest.Mock).mockResolvedValue(mockDoc({ name: 'Renamed' }));

      const result = await updateDocument(documentId, userId, 'member', { name: 'Renamed' });

      expect(result.name).toBe('Renamed');
      expect(doc.save).toHaveBeenCalled();
    });

    it('should allow an admin to rename someone else\'s document', async () => {
      const doc = mockDoc({ uploadedBy: otherUserId });
      (VaultDocument.findOne as jest.Mock).mockResolvedValue(doc);
      (VaultDocument.findByPk as jest.Mock).mockResolvedValue(mockDoc({ name: 'Admin Renamed', uploadedBy: otherUserId }));

      const result = await updateDocument(documentId, adminUserId, 'admin', { name: 'Admin Renamed' });

      expect(result.name).toBe('Admin Renamed');
      expect(doc.save).toHaveBeenCalled();
    });

    it('should reject non-uploader non-admin', async () => {
      const doc = mockDoc({ uploadedBy: otherUserId });
      (VaultDocument.findOne as jest.Mock).mockResolvedValue(doc);

      await expect(
        updateDocument(documentId, userId, 'member', { name: 'Hacked' })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  // ─── deleteDocument ───

  describe('deleteDocument', () => {
    it('should allow the uploader to delete', async () => {
      const doc = mockDoc({
        destroy: jest.fn().mockResolvedValue(undefined),
      });
      (VaultDocument.findOne as jest.Mock).mockResolvedValue(doc);

      await deleteDocument(documentId, userId, 'member');

      expect(deleteObject).toHaveBeenCalledWith(doc.s3Key);
      expect(doc.destroy).toHaveBeenCalledWith({ force: true, transaction: expect.anything() });
      expect(VaultDocumentKey.destroy).toHaveBeenCalledWith({ where: { documentId }, transaction: expect.anything() });
    });

    it('should allow an admin to delete', async () => {
      const doc = mockDoc({
        uploadedBy: otherUserId,
        destroy: jest.fn().mockResolvedValue(undefined),
      });
      (VaultDocument.findOne as jest.Mock).mockResolvedValue(doc);

      await deleteDocument(documentId, adminUserId, 'admin');

      expect(deleteObject).toHaveBeenCalled();
      expect(doc.destroy).toHaveBeenCalled();
    });

    it('should reject non-uploader non-admin', async () => {
      const doc = mockDoc({ uploadedBy: otherUserId });
      (VaultDocument.findOne as jest.Mock).mockResolvedValue(doc);

      await expect(
        deleteDocument(documentId, userId, 'member')
      ).rejects.toThrow(ForbiddenError);
    });
  });

  // ─── hardDeleteDocument ───

  describe('hardDeleteDocument', () => {
    it('should allow an admin to hard-delete', async () => {
      const doc = mockDoc({
        destroy: jest.fn().mockResolvedValue(undefined),
      });
      (VaultDocument.findOne as jest.Mock).mockResolvedValue(doc);

      await hardDeleteDocument(documentId, adminUserId, 'admin');

      expect(deleteObject).toHaveBeenCalled();
      expect(doc.destroy).toHaveBeenCalledWith({ force: true, transaction: expect.anything() });
    });

    it('should reject non-admin user', async () => {
      await expect(
        hardDeleteDocument(documentId, userId, 'member')
      ).rejects.toThrow(ForbiddenError);
    });
  });

  // ─── getStorageUsage ───

  describe('getStorageUsage', () => {
    it('should return storage usage', async () => {
      const docs = [
        { sizeBytes: 500 },
        { sizeBytes: 1500 },
      ];
      (VaultDocument.findAll as jest.Mock).mockResolvedValue(docs);

      const result = await getStorageUsage(userId);

      expect(result.usedBytes).toBe(2000);
      expect(result.limitBytes).toBe(2 * 1024 * 1024 * 1024);
      expect(result.documentCount).toBe(2);
    });
  });

  // ─── Key Management ───

  describe('storeUserKey', () => {
    it('should upsert a user key', async () => {
      const key = mockVaultKey();
      (VaultKey.upsert as jest.Mock).mockResolvedValue([key, true]);
      (VaultKey.findByPk as jest.Mock).mockResolvedValue(key);

      const result = await storeUserKey(userId, {
        publicKey: 'pub-key-123',
        privateKeyEncrypted: 'enc-priv-key',
      });

      expect(result.userId).toBe(userId);
      expect(result.publicKey).toBe('pub-key-123');
    });
  });

  describe('getUserKey', () => {
    it('should return user key if it exists', async () => {
      (VaultKey.findByPk as jest.Mock).mockResolvedValue(mockVaultKey());

      const result = await getUserKey(userId);

      expect(result).not.toBeNull();
      expect(result!.publicKey).toBe('pub-key-123');
    });

    it('should return null if no key exists', async () => {
      (VaultKey.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await getUserKey(userId);

      expect(result).toBeNull();
    });
  });

});

// ─── ADVERSARIAL SECURITY TESTS ──────────────────────────────────────────────
//
// These tests assert cryptographic security invariants that must hold at all
// times, regardless of test-environment state. They run outside the main
// describe block intentionally so they cannot be influenced by beforeEach
// mock resets.

describe('ADVERSARIAL: Server-side crypto absence', () => {
  it('vault service.ts contains zero decryption routines or crypto imports', () => {
    const servicePath = path.resolve(__dirname, '../service.ts');
    const source = fs.readFileSync(servicePath, 'utf-8');

    // The server service must never import or invoke any cryptographic
    // decryption functions. If any of these strings appear in implementation
    // code, it means the server has gained decryption capability — a critical
    // security regression.
    const forbidden = [
      /\bsubtle\b/,
      /\bcrypto\.subtle\b/,
      /AES-GCM/,
      /RSA-OAEP/,
      /\.decrypt\b/,
      /unwrapKey/,
      /importKey/,
      /deriveKey/,
      /createCipheriv/,
      /createDecipheriv/,
      /from 'crypto'/,
      /require\(['"]crypto['"]\)/,
      /from 'node:crypto'/,
    ];

    for (const pattern of forbidden) {
      // Allow the pattern in comments (lines starting with //)
      const nonCommentLines = source.split('\n').filter((line) => !line.trimStart().startsWith('//'));
      const nonCommentSource = nonCommentLines.join('\n');
      expect(nonCommentSource).not.toMatch(pattern);
    }
  });
});

describe('ADVERSARIAL: Revoked member loses document key access', () => {
  const revokedId = 'dd0e8400-e29b-41d4-a716-000000000002';

  beforeEach(() => {
    jest.clearAllMocks();
    (HouseholdMember.findOne as jest.Mock).mockResolvedValue({ householdId });
  });

  it('getDocumentKey returns NotFoundError for a revoked member who no longer has a key record', async () => {
    // Simulate that revokeAndRekeyMember already deleted the revoked user's VaultDocumentKey
    (VaultDocument.findOne as jest.Mock).mockResolvedValue(mockDoc());
    (VaultDocumentKey.findOne as jest.Mock).mockResolvedValue(null); // key was deleted

    // Revoked member tries to fetch their document key
    (HouseholdMember.findOne as jest.Mock).mockResolvedValue({ householdId });

    await expect(
      // getDocumentKey called with the revoked user's userId
      import('../service').then((s) => s.getDocumentKey(documentId, revokedId))
    ).rejects.toThrow(NotFoundError);
  });
});

