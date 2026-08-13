"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const service_1 = require("../service");
const errors_1 = require("../../../shared/utils/errors");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const userId = '550e8400-e29b-41d4-a716-446655440001';
const otherUserId = '660e8400-e29b-41d4-a716-446655440002';
const adminUserId = '770e8400-e29b-41d4-a716-446655440003';
const householdId = '880e8400-e29b-41d4-a716-446655440004';
const documentId = '990e8400-e29b-41d4-a716-446655440005';
// ── Model Mocks (factory must be inline for jest.mock hoisting) ──
jest.mock('../../../database/models', () => {
    const mockModel = (name) => {
        const cls = jest.fn().mockName(name);
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
jest.mock('../../../shared/utils/cloudinary', () => ({
    uploadBuffer: jest.fn(),
    deleteResource: jest.fn(),
}));
const models_1 = require("../../../database/models");
const cloudinary_1 = require("../../../shared/utils/cloudinary");
const mockDoc = (overrides = {}) => ({
    id: documentId,
    householdId,
    name: 'Test Doc',
    mimeType: 'image/jpeg',
    sizeBytes: 1024,
    encryptedKey: 'enc-key-123',
    iv: 'iv-123',
    cloudinaryPublicId: 'vault/test-public-id',
    cloudinarySecureUrl: 'https://cloudinary.com/test.jpg',
    uploadedBy: userId,
    createdAt: new Date('2026-07-12T10:00:00Z'),
    updatedAt: new Date('2026-07-12T10:00:00Z'),
    get: (key) => {
        if (key === 'uploader') {
            return { id: userId, displayName: 'Test User', avatarUrl: null, avatarEmoji: null };
        }
        return null;
    },
    save: jest.fn(),
    destroy: jest.fn(),
    ...overrides,
});
const mockVaultKey = (overrides = {}) => ({
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
        // Default: user belongs to household
        models_1.HouseholdMember.findOne.mockResolvedValue({ householdId });
    });
    // ─── uploadDocument ───
    describe('uploadDocument', () => {
        const uploadBody = {
            name: 'Test Doc',
            mimeType: 'image/jpeg',
            sizeBytes: 1024,
            encryptedKey: 'enc-key-123',
            iv: 'iv-123',
            cloudinaryPublicId: 'vault/test',
            cloudinarySecureUrl: 'https://cloudinary.com/test.jpg',
        };
        it('should upload a document and return response', async () => {
            const fileBuffer = Buffer.from('test');
            cloudinary_1.uploadBuffer.mockResolvedValue({
                public_id: 'vault/test-public-id',
                secure_url: 'https://cloudinary.com/test.jpg',
            });
            const createdDoc = mockDoc();
            models_1.VaultDocument.create.mockResolvedValue(createdDoc);
            models_1.VaultDocumentKey.create.mockResolvedValue({ documentId, userId, wrappedKey: 'enc-key-123' });
            models_1.VaultDocument.findByPk.mockResolvedValue(createdDoc);
            const result = await (0, service_1.uploadDocument)(userId, uploadBody, fileBuffer);
            expect(cloudinary_1.uploadBuffer).toHaveBeenCalled();
            expect(models_1.VaultDocument.create).toHaveBeenCalled();
            expect(models_1.VaultDocumentKey.create).toHaveBeenCalled();
            expect(result.id).toBe(documentId);
            expect(result.name).toBe('Test Doc');
        });
        it('should reject files over 20MB', async () => {
            await expect((0, service_1.uploadDocument)(userId, { ...uploadBody, sizeBytes: 21 * 1024 * 1024 }, Buffer.from('test'))).rejects.toThrow(errors_1.ForbiddenError);
        });
        it('should reject uploads exceeding household quota', async () => {
            cloudinary_1.uploadBuffer.mockResolvedValue({
                public_id: 'vault/test',
                secure_url: 'https://cloudinary.com/test.jpg',
            });
            models_1.VaultDocument.sum.mockResolvedValue(2 * 1024 * 1024 * 1024); // already at 2GB
            await expect((0, service_1.uploadDocument)(userId, uploadBody, Buffer.from('test'))).rejects.toThrow(errors_1.ForbiddenError);
        });
    });
    // ─── listDocuments ───
    describe('listDocuments', () => {
        it('should return paginated documents', async () => {
            const docs = [mockDoc({ id: 'doc1' }), mockDoc({ id: 'doc2' })];
            models_1.VaultDocument.findAll.mockResolvedValue(docs);
            const result = await (0, service_1.listDocuments)(userId, { limit: 20 });
            expect(result.documents).toHaveLength(2);
            expect(result.hasMore).toBe(false);
            expect(result.nextCursor).toBeNull();
        });
    });
    // ─── getDocumentById ───
    describe('getDocumentById', () => {
        it('should return a document by ID', async () => {
            models_1.VaultDocument.findOne.mockResolvedValue(mockDoc());
            const result = await (0, service_1.getDocumentById)(documentId, userId);
            expect(result.id).toBe(documentId);
            expect(result.name).toBe('Test Doc');
        });
        it('should throw NotFoundError for non-existent document', async () => {
            models_1.VaultDocument.findOne.mockResolvedValue(null);
            await expect((0, service_1.getDocumentById)(documentId, userId)).rejects.toThrow(errors_1.NotFoundError);
        });
    });
    // ─── updateDocument ───
    describe('updateDocument', () => {
        it('should allow the uploader to rename', async () => {
            const doc = mockDoc();
            models_1.VaultDocument.findOne.mockResolvedValue(doc);
            models_1.VaultDocument.findByPk.mockResolvedValue(mockDoc({ name: 'Renamed' }));
            const result = await (0, service_1.updateDocument)(documentId, userId, 'member', { name: 'Renamed' });
            expect(result.name).toBe('Renamed');
            expect(doc.save).toHaveBeenCalled();
        });
        it('should allow an admin to rename someone else\'s document', async () => {
            const doc = mockDoc({ uploadedBy: otherUserId });
            models_1.VaultDocument.findOne.mockResolvedValue(doc);
            models_1.VaultDocument.findByPk.mockResolvedValue(mockDoc({ name: 'Admin Renamed', uploadedBy: otherUserId }));
            const result = await (0, service_1.updateDocument)(documentId, adminUserId, 'admin', { name: 'Admin Renamed' });
            expect(result.name).toBe('Admin Renamed');
            expect(doc.save).toHaveBeenCalled();
        });
        it('should reject non-uploader non-admin', async () => {
            const doc = mockDoc({ uploadedBy: otherUserId });
            models_1.VaultDocument.findOne.mockResolvedValue(doc);
            await expect((0, service_1.updateDocument)(documentId, userId, 'member', { name: 'Hacked' })).rejects.toThrow(errors_1.ForbiddenError);
        });
    });
    // ─── deleteDocument ───
    describe('deleteDocument', () => {
        it('should allow the uploader to delete', async () => {
            const doc = mockDoc({
                destroy: jest.fn().mockResolvedValue(undefined),
            });
            models_1.VaultDocument.findOne.mockResolvedValue(doc);
            await (0, service_1.deleteDocument)(documentId, userId, 'member');
            expect(cloudinary_1.deleteResource).toHaveBeenCalledWith(doc.cloudinaryPublicId);
            expect(doc.destroy).toHaveBeenCalledWith({ force: true, transaction: expect.anything() });
            expect(models_1.VaultDocumentKey.destroy).toHaveBeenCalledWith({ where: { documentId }, transaction: expect.anything() });
        });
        it('should allow an admin to delete', async () => {
            const doc = mockDoc({
                uploadedBy: otherUserId,
                destroy: jest.fn().mockResolvedValue(undefined),
            });
            models_1.VaultDocument.findOne.mockResolvedValue(doc);
            await (0, service_1.deleteDocument)(documentId, adminUserId, 'admin');
            expect(cloudinary_1.deleteResource).toHaveBeenCalled();
            expect(doc.destroy).toHaveBeenCalled();
        });
        it('should reject non-uploader non-admin', async () => {
            const doc = mockDoc({ uploadedBy: otherUserId });
            models_1.VaultDocument.findOne.mockResolvedValue(doc);
            await expect((0, service_1.deleteDocument)(documentId, userId, 'member')).rejects.toThrow(errors_1.ForbiddenError);
        });
    });
    // ─── hardDeleteDocument ───
    describe('hardDeleteDocument', () => {
        it('should allow an admin to hard-delete', async () => {
            const doc = mockDoc({
                destroy: jest.fn().mockResolvedValue(undefined),
            });
            models_1.VaultDocument.findOne.mockResolvedValue(doc);
            await (0, service_1.hardDeleteDocument)(documentId, adminUserId, 'admin');
            expect(cloudinary_1.deleteResource).toHaveBeenCalled();
            expect(doc.destroy).toHaveBeenCalledWith({ force: true, transaction: expect.anything() });
        });
        it('should reject non-admin user', async () => {
            await expect((0, service_1.hardDeleteDocument)(documentId, userId, 'member')).rejects.toThrow(errors_1.ForbiddenError);
        });
    });
    // ─── getStorageUsage ───
    describe('getStorageUsage', () => {
        it('should return storage usage', async () => {
            const docs = [
                { sizeBytes: 500 },
                { sizeBytes: 1500 },
            ];
            models_1.VaultDocument.findAll.mockResolvedValue(docs);
            const result = await (0, service_1.getStorageUsage)(userId);
            expect(result.usedBytes).toBe(2000);
            expect(result.limitBytes).toBe(2 * 1024 * 1024 * 1024);
            expect(result.documentCount).toBe(2);
        });
    });
    // ─── Key Management ───
    describe('storeUserKey', () => {
        it('should upsert a user key', async () => {
            const key = mockVaultKey();
            models_1.VaultKey.upsert.mockResolvedValue([key, true]);
            const result = await (0, service_1.storeUserKey)(userId, {
                publicKey: 'pub-key-123',
                privateKeyEncrypted: 'enc-priv-key',
            });
            expect(result.userId).toBe(userId);
            expect(result.publicKey).toBe('pub-key-123');
        });
    });
    describe('getUserKey', () => {
        it('should return user key if it exists', async () => {
            models_1.VaultKey.findByPk.mockResolvedValue(mockVaultKey());
            const result = await (0, service_1.getUserKey)(userId);
            expect(result).not.toBeNull();
            expect(result.publicKey).toBe('pub-key-123');
        });
        it('should return null if no key exists', async () => {
            models_1.VaultKey.findByPk.mockResolvedValue(null);
            const result = await (0, service_1.getUserKey)(userId);
            expect(result).toBeNull();
        });
    });
    describe('getHouseholdPublicKeys', () => {
        it('should return keys of members who have them', async () => {
            const memberWithKey = {
                userId,
                get: (key) => key === 'vaultKey' ? mockVaultKey() : null,
            };
            const memberWithoutKey = {
                userId: otherUserId,
                get: () => null,
            };
            models_1.HouseholdMember.findAll.mockResolvedValue([memberWithKey, memberWithoutKey]);
            const result = await (0, service_1.getHouseholdPublicKeys)(householdId);
            expect(result).toHaveLength(1);
            expect(result[0].userId).toBe(userId);
        });
    });
    // ─── performKeyCeremony ───
    describe('performKeyCeremony', () => {
        it('should return encrypted keys for members', async () => {
            const doc = mockDoc();
            models_1.VaultDocument.findOne.mockResolvedValue(doc);
            models_1.VaultDocumentKey.findOne.mockResolvedValue({ documentId, userId, wrappedKey: 'my-wrapped-key' });
            const memberWithKey = {
                userId: 'member1',
                get: (key) => key === 'vaultKey' ? mockVaultKey({ userId: 'member1' }) : null,
            };
            models_1.HouseholdMember.findAll.mockResolvedValue([memberWithKey]);
            models_1.VaultDocumentKey.upsert.mockResolvedValue([{}, true]);
            const result = await (0, service_1.performKeyCeremony)(documentId, userId, {
                wrappedKeys: [{ userId: 'member1', wrappedKey: 'wrapped-key-for-member1' }],
            });
            expect(result.keysStored).toBe(1);
            expect(result.documentId).toBe(documentId);
        });
    });
    // ─── rotateVaultKey ───
    describe('rotateVaultKey', () => {
        it('should return re-wrapped keys for all members', async () => {
            models_1.VaultDocument.findAll.mockResolvedValue([{ id: documentId }]);
            const member1 = {
                userId: 'member1',
                get: (k) => k === 'vaultKey' ? mockVaultKey({ userId: 'member1' }) : null,
            };
            const member2 = {
                userId: 'member2',
                get: (k) => k === 'vaultKey' ? mockVaultKey({ userId: 'member2', publicKey: 'pub-key-2' }) : null,
            };
            models_1.HouseholdMember.findAll.mockResolvedValue([member1, member2]);
            models_1.VaultDocumentKey.destroy.mockResolvedValue(1);
            models_1.VaultDocumentKey.create.mockResolvedValue({});
            const result = await (0, service_1.rotateVaultKey)(userId, {
                documents: [
                    {
                        documentId,
                        wrappedKeys: [
                            { userId: 'member1', wrappedKey: 'wrapped-1' },
                            { userId: 'member2', wrappedKey: 'wrapped-2' },
                        ],
                    },
                ],
            });
            expect(result.documentsRotated).toBe(1);
            expect(result.totalKeysStored).toBe(2);
        });
        it('should reject members without existing keys', async () => {
            models_1.VaultDocument.findAll.mockResolvedValue([{ id: documentId }]);
            const memberWithoutKey = { userId: 'member1', get: () => null };
            models_1.HouseholdMember.findAll.mockResolvedValue([memberWithoutKey]);
            await expect((0, service_1.rotateVaultKey)(userId, {
                documents: [
                    {
                        documentId,
                        wrappedKeys: [{ userId: 'member1', wrappedKey: 'wrapped-1' }],
                    },
                ],
            })).rejects.toThrow(errors_1.ForbiddenError);
        });
    });
    // ─── getHouseholdKeyStatus ───
    describe('getHouseholdKeyStatus', () => {
        it('should return key status for the household', async () => {
            const memberWithKey = { userId, get: (k) => k === 'vaultKey' ? { userId: userId } : null };
            const memberWithoutKey = { userId: otherUserId, get: () => null };
            models_1.HouseholdMember.findAll.mockResolvedValue([memberWithKey, memberWithoutKey]);
            const result = await (0, service_1.getHouseholdKeyStatus)(userId);
            expect(result.hasKey).toBe(true);
            expect(result.membersWithKeys).toBe(1);
            expect(result.totalMembers).toBe(2);
        });
    });
    // ─── revokeAndRekeyMember ───
    describe('revokeAndRekeyMember', () => {
        const revokedUserId = 'bb0e8400-e29b-41d4-a716-446655440010';
        it('should revoke member access and store re-wrapped keys for remaining members', async () => {
            // Revoked member is in the household
            models_1.HouseholdMember.findOne
                .mockResolvedValueOnce({ householdId }) // requester's household lookup
                .mockResolvedValueOnce({ userId: revokedUserId, householdId }); // revoked member check
            models_1.VaultDocument.findAll.mockResolvedValue([{ id: documentId }]);
            // getHouseholdPublicKeys is called BEFORE deletion — both members are still present.
            // remainingKeyMap.size = 2 → expectedKeyCount = 2 - 1 = 1 (one key for the surviving member).
            const memberWithKey = {
                userId,
                get: (k) => k === 'vaultKey' ? mockVaultKey({ userId }) : null,
            };
            const revokedMemberWithKey = {
                userId: revokedUserId,
                get: (k) => k === 'vaultKey' ? mockVaultKey({ userId: revokedUserId }) : null,
            };
            models_1.HouseholdMember.findAll.mockResolvedValue([memberWithKey, revokedMemberWithKey]);
            const result = await (0, service_1.revokeAndRekeyMember)(adminUserId, 'admin', {
                revokedUserId,
                documents: [
                    {
                        documentId,
                        wrappedKeys: [{ userId, wrappedKey: 're-wrapped-for-remaining-member' }],
                    },
                ],
            });
            expect(result.revokedUserId).toBe(revokedUserId);
            expect(result.documentsRekeyed).toBe(1);
            // Revoked user's keys should be purged
            expect(models_1.VaultDocumentKey.destroy).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: revokedUserId } }));
            // Revoked user's VaultKey should be deleted
            expect(models_1.VaultKey.destroy).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: revokedUserId } }));
        });
        it('should reject non-admin callers', async () => {
            await expect((0, service_1.revokeAndRekeyMember)(userId, 'member', {
                revokedUserId,
                documents: [{ documentId, wrappedKeys: [{ userId, wrappedKey: 'x' }] }],
            })).rejects.toThrow(errors_1.ForbiddenError);
        });
        it('should prevent self-revocation', async () => {
            models_1.HouseholdMember.findOne
                .mockResolvedValueOnce({ householdId })
                .mockResolvedValueOnce({ userId: adminUserId, householdId });
            await expect((0, service_1.revokeAndRekeyMember)(adminUserId, 'admin', {
                revokedUserId: adminUserId, // attempting to revoke self
                documents: [{ documentId, wrappedKeys: [{ userId: adminUserId, wrappedKey: 'x' }] }],
            })).rejects.toThrow(errors_1.ForbiddenError);
        });
        it('silently skips a wrapped key submitted for the revoked user and still counts correctly', async () => {
            models_1.HouseholdMember.findOne
                .mockResolvedValueOnce({ householdId })
                .mockResolvedValueOnce({ userId: revokedUserId, householdId });
            models_1.VaultDocument.findAll.mockResolvedValue([{ id: documentId }]);
            // Pre-deletion state: both members still have VaultKey records.
            // remainingKeyMap.size = 2 → expectedKeyCount = 1.
            const memberWithKey = {
                userId,
                get: (k) => k === 'vaultKey' ? mockVaultKey({ userId }) : null,
            };
            const revokedMemberWithKey = {
                userId: revokedUserId,
                get: (k) => k === 'vaultKey' ? mockVaultKey({ userId: revokedUserId }) : null,
            };
            models_1.HouseholdMember.findAll.mockResolvedValue([memberWithKey, revokedMemberWithKey]);
            // Client submits one key for the remaining member + one for the revoked user.
            // After filtering the revoked entry: nonRevokedEntries.length = 1 = expectedKeyCount → passes.
            const result = await (0, service_1.revokeAndRekeyMember)(adminUserId, 'admin', {
                revokedUserId,
                documents: [
                    {
                        documentId,
                        wrappedKeys: [
                            { userId, wrappedKey: 're-wrapped-for-member' },
                            { userId: revokedUserId, wrappedKey: 'should-be-ignored' },
                        ],
                    },
                ],
            });
            // totalKeysStored should NOT count the revoked user's entry
            expect(result.totalKeysStored).toBe(1);
        });
        it('should reject a re-key that omits a remaining member', async () => {
            const secondMemberId = 'ee0e8400-e29b-41d4-a716-446655440020';
            models_1.HouseholdMember.findOne
                .mockResolvedValueOnce({ householdId }) // requester household
                .mockResolvedValueOnce({ userId: revokedUserId, householdId }); // revoked member check
            models_1.VaultDocument.findAll.mockResolvedValue([{ id: documentId }]);
            // Pre-deletion state: 3 members in DB (userId + secondMemberId + revokedUserId).
            // remainingKeyMap.size = 3 → expectedKeyCount = 3 - 1 = 2.
            // Client submits only 1 key (for userId), omitting secondMemberId → rejected.
            const member1 = { userId, get: (k) => k === 'vaultKey' ? mockVaultKey({ userId }) : null };
            const member2 = { userId: secondMemberId, get: (k) => k === 'vaultKey' ? mockVaultKey({ userId: secondMemberId }) : null };
            const revokedMember = { userId: revokedUserId, get: (k) => k === 'vaultKey' ? mockVaultKey({ userId: revokedUserId }) : null };
            models_1.HouseholdMember.findAll.mockResolvedValue([member1, member2, revokedMember]);
            // Client only submits a key for userId, omitting secondMemberId
            await expect((0, service_1.revokeAndRekeyMember)(adminUserId, 'admin', {
                revokedUserId,
                documents: [
                    {
                        documentId,
                        wrappedKeys: [
                            { userId, wrappedKey: 're-wrapped-for-member-1' },
                            // secondMemberId intentionally omitted — server must reject
                        ],
                    },
                ],
            })).rejects.toThrow(errors_1.ForbiddenError);
            // No VaultDocumentKey records should have been written (check happens pre-transaction)
            expect(models_1.VaultDocumentKey.create).not.toHaveBeenCalled();
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
        const servicePath = node_path_1.default.resolve(__dirname, '../service.ts');
        const source = node_fs_1.default.readFileSync(servicePath, 'utf-8');
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
describe('ADVERSARIAL: Key substitution blocked by ceremony', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        models_1.HouseholdMember.findOne.mockResolvedValue({ householdId });
    });
    it('rejects a key ceremony where the submitter provides a key for a non-member (unregistered userId)', async () => {
        const doc = mockDoc();
        models_1.VaultDocument.findOne.mockResolvedValue(doc);
        models_1.VaultDocumentKey.findOne.mockResolvedValue({
            documentId,
            userId,
            wrappedKey: 'my-key',
        });
        // Only the legitimate member (userId) has a vault key
        const legitimateMember = {
            userId,
            get: (k) => k === 'vaultKey' ? mockVaultKey({ userId }) : null,
        };
        models_1.HouseholdMember.findAll.mockResolvedValue([legitimateMember]);
        // Attacker userId is NOT in the household public key list
        const attackerUserId = 'cc0e8400-e29b-41d4-a716-000000000001';
        await expect((0, service_1.performKeyCeremony)(documentId, userId, {
            wrappedKeys: [
                { userId, wrappedKey: 'legitimate-wrapped-key' },
                { userId: attackerUserId, wrappedKey: 'attacker-key-for-attacker-user' },
            ],
        })).rejects.toThrow(errors_1.ForbiddenError);
        // The attacker's wrapped key must NOT have been stored
        expect(models_1.VaultDocumentKey.upsert).not.toHaveBeenCalledWith(expect.objectContaining({ userId: attackerUserId }), expect.anything());
    });
});
describe('ADVERSARIAL: Revoked member loses document key access', () => {
    const revokedId = 'dd0e8400-e29b-41d4-a716-000000000002';
    beforeEach(() => {
        jest.clearAllMocks();
        models_1.HouseholdMember.findOne.mockResolvedValue({ householdId });
    });
    it('getDocumentKey returns NotFoundError for a revoked member who no longer has a key record', async () => {
        // Simulate that revokeAndRekeyMember already deleted the revoked user's VaultDocumentKey
        models_1.VaultDocument.findOne.mockResolvedValue(mockDoc());
        models_1.VaultDocumentKey.findOne.mockResolvedValue(null); // key was deleted
        // Revoked member tries to fetch their document key
        models_1.HouseholdMember.findOne.mockResolvedValue({ householdId });
        await expect(
        // getDocumentKey called with the revoked user's userId
        Promise.resolve().then(() => __importStar(require('../service'))).then((s) => s.getDocumentKey(documentId, revokedId))).rejects.toThrow(errors_1.NotFoundError);
    });
});
//# sourceMappingURL=vault.service.test.js.map