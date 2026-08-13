import { Op } from 'sequelize';
import {
  sequelize,
  VaultDocument,
  VaultDocumentKey,
  VaultKey,
  User,
  HouseholdMember,
} from '../../database/models';
import { NotFoundError, ForbiddenError } from '../../shared/utils/errors';
import { uploadBuffer, deleteResource } from '../../shared/utils/cloudinary';
import type {
  CreateVaultDocumentBody,
  UpdateVaultDocumentBody,
  VaultDocumentResponse,
  PaginatedVaultDocuments,
  VaultKeyResponse,
  VaultStorageUsageResponse,
  KeyCeremonyBody,
  KeyCeremonyResponse,
  KeyRotationBody,
  KeyRotationResponse,
  DocumentKeyResponse,
} from './types';

const MAX_STORAGE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function getUserHousehold(userId: string): Promise<string> {
  const membership = await HouseholdMember.findOne({ where: { userId } });
  if (!membership) {
    throw new ForbiddenError('You must belong to a household to use the vault');
  }
  return membership.householdId;
}

function toDocumentResponse(doc: VaultDocument): VaultDocumentResponse {
  return {
    id: doc.id,
    householdId: doc.householdId,
    name: doc.name,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    uploadedBy: {
      id: (doc.get('uploader') as User).id,
      displayName: (doc.get('uploader') as User).displayName,
      avatarUrl: (doc.get('uploader') as User).avatarUrl,
      avatarEmoji: (doc.get('uploader') as User).avatarEmoji,
    },
    uploadedAt: doc.createdAt.toISOString(),
    downloadUrl: doc.cloudinarySecureUrl,
    iv: doc.iv,
  };
}

function toKeyResponse(key: VaultKey): VaultKeyResponse {
  return {
    userId: key.userId,
    publicKey: key.publicKey,
    privateKeyEncrypted: key.privateKeyEncrypted,
    createdAt: key.createdAt.toISOString(),
  };
}

async function checkStorageQuota(householdId: string, additionalBytes: number): Promise<void> {
  const totalSize = await VaultDocument.sum('sizeBytes', {
    where: { householdId },
  }) || 0;

  if (totalSize + additionalBytes > MAX_STORAGE_BYTES) {
    throw new ForbiddenError(
      `Vault storage limit exceeded (${MAX_STORAGE_BYTES / (1024 * 1024 * 1024)}GB). Current: ${(totalSize / (1024 * 1024)).toFixed(1)}MB`
    );
  }
}

// ─── Upload Document ───

export async function uploadDocument(
  userId: string,
  body: CreateVaultDocumentBody,
  fileBuffer: Buffer
): Promise<VaultDocumentResponse> {
  const householdId = await getUserHousehold(userId);

  // Verify file size
  if (body.sizeBytes > MAX_FILE_SIZE) {
    throw new ForbiddenError(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
  }

  // Check storage quota
  await checkStorageQuota(householdId, body.sizeBytes);

  // Upload to Cloudinary
  const uploadResult = await uploadBuffer(fileBuffer, {
    folder: `rootaru/vault/${householdId}`,
    resource_type: 'raw',
    public_id: `vault-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  });

  // Create document + per-user wrapped key in a transaction
  const document = await sequelize.transaction(async (transaction) => {
    const doc = await VaultDocument.create({
      householdId,
      name: body.name,
      mimeType: body.mimeType,
      sizeBytes: body.sizeBytes,
      encryptedKey: body.encryptedKey,
      iv: body.iv,
      cloudinaryPublicId: uploadResult.public_id,
      cloudinarySecureUrl: uploadResult.secure_url,
      uploadedBy: userId,
    }, { transaction });

    // Store the uploader's wrapped AES key in the per-user junction table
    await VaultDocumentKey.create({
      documentId: doc.id,
      userId,
      wrappedKey: body.encryptedKey,
    }, { transaction });

    return doc;
  });

  // Load with uploader
  const fullDoc = await VaultDocument.findByPk(document.id, {
    include: [{ model: User, as: 'uploader' }],
  });

  if (!fullDoc) {
    throw new Error('Failed to load created document');
  }

  return toDocumentResponse(fullDoc);
}

// ─── List Documents ───

export async function listDocuments(
  userId: string,
  options: { cursor?: string; limit?: number }
): Promise<PaginatedVaultDocuments> {
  const householdId = await getUserHousehold(userId);
  const limit = Math.min(options.limit || 20, 50);

  const where: any = { householdId };
  if (options.cursor) {
    where.createdAt = { [Op.lt]: new Date(options.cursor) };
  }

  const documents = await VaultDocument.findAll({
    where,
    include: [{ model: User, as: 'uploader' }],
    order: [['createdAt', 'DESC']],
    limit: limit + 1,
  });

  const hasMore = documents.length > limit;
  const page = hasMore ? documents.slice(0, limit) : documents;
  const nextCursor = hasMore
    ? page[page.length - 1].createdAt.toISOString()
    : null;

  return {
    documents: page.map(toDocumentResponse),
    nextCursor,
    hasMore,
  };
}

// ─── Get Document By ID ───

export async function getDocumentById(
  documentId: string,
  userId: string
): Promise<VaultDocumentResponse> {
  const householdId = await getUserHousehold(userId);

  const document = await VaultDocument.findOne({
    where: { id: documentId, householdId },
    include: [{ model: User, as: 'uploader' }],
  });

  if (!document) {
    throw new NotFoundError('Document');
  }

  return toDocumentResponse(document);
}

// ─── Get User's Wrapped Key for a Document ───

export async function getDocumentKey(
  documentId: string,
  userId: string
): Promise<DocumentKeyResponse> {
  const householdId = await getUserHousehold(userId);

  // Verify document belongs to the user's household
  const document = await VaultDocument.findOne({
    where: { id: documentId, householdId },
    attributes: ['id'],
  });

  if (!document) {
    throw new NotFoundError('Document');
  }

  // Look up the per-user wrapped key
  const docKey = await VaultDocumentKey.findOne({
    where: { documentId, userId },
  });

  if (!docKey) {
    throw new NotFoundError(
      'No vault key found for this document. A key ceremony may be required.'
    );
  }

  return {
    documentId: docKey.documentId,
    userId: docKey.userId,
    wrappedKey: docKey.wrappedKey,
  };
}

// ─── Update Document ───

export async function updateDocument(
  documentId: string,
  userId: string,
  userRole: string,
  body: UpdateVaultDocumentBody
): Promise<VaultDocumentResponse> {
  const householdId = await getUserHousehold(userId);

  const document = await VaultDocument.findOne({
    where: { id: documentId, householdId },
    include: [{ model: User, as: 'uploader' }],
  });

  if (!document) {
    throw new NotFoundError('Document');
  }

  // Only uploader or admin can rename
  if (document.uploadedBy !== userId && userRole !== 'admin') {
    throw new ForbiddenError('Only the uploader or an admin can update this document');
  }

  if (body.name !== undefined) {
    document.name = body.name;
  }

  await document.save();

  const updated = await VaultDocument.findByPk(document.id, {
    include: [{ model: User, as: 'uploader' }],
  });

  if (!updated) {
    throw new Error('Failed to load updated document');
  }

  return toDocumentResponse(updated);
}

// ─── Delete Document ───

export async function deleteDocument(
  documentId: string,
  userId: string,
  userRole: string
): Promise<void> {
  const householdId = await getUserHousehold(userId);

  const document = await VaultDocument.findOne({
    where: { id: documentId, householdId },
  });

  if (!document) {
    throw new NotFoundError('Document');
  }

  // Only uploader or admin can delete
  if (document.uploadedBy !== userId && userRole !== 'admin') {
    throw new ForbiddenError('Only the uploader or an admin can delete this document');
  }

  // Delete from Cloudinary
  await deleteResource(document.cloudinaryPublicId);

  // Hard delete document + all per-user keys in a transaction
  await sequelize.transaction(async (transaction) => {
    await VaultDocumentKey.destroy({ where: { documentId }, transaction });
    await document.destroy({ force: true, transaction });
  });
}

// ─── Storage Usage ───

export async function getStorageUsage(userId: string): Promise<VaultStorageUsageResponse> {
  const householdId = await getUserHousehold(userId);

  const documents = await VaultDocument.findAll({
    where: { householdId },
    attributes: ['sizeBytes'],
  });

  const usedBytes = documents.reduce((sum, doc) => sum + doc.sizeBytes, 0);
  const documentCount = documents.length;

  return {
    usedBytes,
    limitBytes: MAX_STORAGE_BYTES,
    documentCount,
  };
}

// ─── Hard Delete (admin only, FR-130) ───

export async function hardDeleteDocument(
  documentId: string,
  userId: string,
  userRole: string
): Promise<void> {
  if (userRole !== 'admin') {
    throw new ForbiddenError('Only admins can permanently delete documents');
  }

  const householdId = await getUserHousehold(userId);

  const document = await VaultDocument.findOne({
    where: { id: documentId, householdId },
  });

  if (!document) {
    throw new NotFoundError('Document');
  }

  // Delete from Cloudinary
  await deleteResource(document.cloudinaryPublicId);

  // Permanently purge document + per-user keys
  await sequelize.transaction(async (transaction) => {
    await VaultDocumentKey.destroy({ where: { documentId }, transaction });
    await document.destroy({ force: true, transaction });
  });
}

// ─── Vault Key Management ───

export async function storeUserKey(
  userId: string,
  body: { publicKey: string; privateKeyEncrypted: string }
): Promise<VaultKeyResponse> {
  const householdId = await getUserHousehold(userId);

  await VaultKey.upsert({
    userId,
    householdId,
    publicKey: body.publicKey,
    privateKeyEncrypted: body.privateKeyEncrypted,
  });

  // MySQL upsert doesn't support RETURNING — Sequelize just echoes back the
  // input values, leaving DB-generated fields like createdAt undefined.
  // Re-fetch so the response reflects what's actually persisted.
  const key = await VaultKey.findByPk(userId);
  if (!key) throw new NotFoundError('VaultKey');

  return toKeyResponse(key);
}

export async function getUserKey(userId: string): Promise<VaultKeyResponse | null> {
  const key = await VaultKey.findByPk(userId);
  return key ? toKeyResponse(key) : null;
}

export async function getHouseholdPublicKeys(householdId: string): Promise<VaultKeyResponse[]> {
  const members = await HouseholdMember.findAll({
    where: { householdId },
    include: [{ model: VaultKey, as: 'vaultKey' }],
  });

  return members
    .filter((m): m is typeof m & { vaultKey: VaultKey } => m.get('vaultKey') !== null)
    .map((m) => toKeyResponse(m.get('vaultKey')!));
}

// ─── Key Ceremony (FR-132) ───
//
// The client performs the actual cryptographic work:
//   1. Unwraps the document's AES key using their RSA private key
//   2. Wraps the AES key with each target member's RSA public key
//   3. Sends the wrapped keys to the server for storage
//
// The server NEVER sees the raw AES key — only RSA-wrapped ciphertext.

export async function performKeyCeremony(
  documentId: string,
  userId: string,
  body: KeyCeremonyBody
): Promise<KeyCeremonyResponse> {
  const householdId = await getUserHousehold(userId);

  const document = await VaultDocument.findOne({
    where: { id: documentId, householdId },
  });

  if (!document) {
    throw new NotFoundError('Document');
  }

  // Verify the requesting user has access to this document's key
  const requesterKey = await VaultDocumentKey.findOne({
    where: { documentId, userId },
  });

  if (!requesterKey) {
    throw new ForbiddenError('You do not have a key for this document');
  }

  // Verify all target users are household members with vault keys
  const publicKeys = await getHouseholdPublicKeys(householdId);
  const keyMap = new Map(publicKeys.map((k) => [k.userId, k.publicKey]));

  for (const entry of body.wrappedKeys) {
    if (!keyMap.has(entry.userId)) {
      throw new ForbiddenError(`Member ${entry.userId} does not have a vault key`);
    }
  }

  // Store the client-provided wrapped keys
  await sequelize.transaction(async (transaction) => {
    for (const entry of body.wrappedKeys) {
      await VaultDocumentKey.upsert({
        documentId,
        userId: entry.userId,
        wrappedKey: entry.wrappedKey,
      }, { transaction });
    }
  });

  return {
    documentId,
    keysStored: body.wrappedKeys.length,
  };
}

// ─── Key Rotation ───
//
// Rotation re-wraps AES keys for multiple documents at once.
// The client generates a NEW AES key, re-encrypts the document, and wraps
// the new key for each member. The server stores the updated wrapped keys.

export async function rotateVaultKey(
  userId: string,
  body: KeyRotationBody
): Promise<KeyRotationResponse> {
  const householdId = await getUserHousehold(userId);

  // Verify all provided document IDs belong to the household
  const docIds = body.documents.map((d) => d.documentId);
  const documents = await VaultDocument.findAll({
    where: { id: { [Op.in]: docIds }, householdId },
    attributes: ['id'],
  });

  const validDocIds = new Set(documents.map((d) => d.id));
  for (const docId of docIds) {
    if (!validDocIds.has(docId)) {
      throw new NotFoundError(`Document ${docId} not found in your household`);
    }
  }

  // Verify all target users have vault keys
  const existingKeys = await getHouseholdPublicKeys(householdId);
  const existingKeyMap = new Map(existingKeys.map((k) => [k.userId, k.publicKey]));

  let totalKeysStored = 0;

  await sequelize.transaction(async (transaction) => {
    for (const doc of body.documents) {
      // Replace all existing wrapped keys for this document
      await VaultDocumentKey.destroy({
        where: { documentId: doc.documentId },
        transaction,
      });

      for (const entry of doc.wrappedKeys) {
        if (!existingKeyMap.has(entry.userId)) {
          throw new ForbiddenError(`Member ${entry.userId} does not have a vault key`);
        }

        await VaultDocumentKey.create({
          documentId: doc.documentId,
          userId: entry.userId,
          wrappedKey: entry.wrappedKey,
        }, { transaction });

        totalKeysStored++;
      }
    }
  });

  return {
    documentsRotated: body.documents.length,
    totalKeysStored,
  };
}

// ─── Household Key Management ───

export async function getHouseholdKeyStatus(userId: string): Promise<{
  hasKey: boolean;
  membersWithKeys: number;
  totalMembers: number;
}> {
  const householdId = await getUserHousehold(userId);

  const members = await HouseholdMember.findAll({
    where: { householdId },
    include: [{ model: VaultKey, as: 'vaultKey' }],
  });

  const totalMembers = members.length;
  const membersWithKeys = members.filter((m) => m.get('vaultKey')).length;
  const hasKey = members.some((m) => m.userId === userId && m.get('vaultKey'));

  return { hasKey, membersWithKeys, totalMembers };
}

// ─── Revoke & Rekey (Member Removal) ───
//
// When a member is removed from a household vault the following steps occur:
//   1. The requester must be an admin.
//   2. All VaultDocumentKey records for the revoked member are deleted — they
//      immediately lose the ability to fetch wrapped keys for any document.
//   3. The revoked member's VaultKey (public key + encrypted private key backup)
//      is deleted from the server.
//   4. The requester supplies re-wrapped AES keys (encrypted for each remaining
//      member's RSA public key) for all affected documents. The server stores
//      these as the new VaultDocumentKey records, replacing the old ones.
//
// Forward-secrecy note: the revoked member may have previously downloaded and
// decrypted documents. Rekeying prevents future decryption but does not
// retroactively revoke access to content the member already holds in memory
// or in screenshots. This is a known limitation of client-side E2EE and must
// be disclosed to users in the UI.

export async function revokeAndRekeyMember(
  requesterId: string,
  requesterRole: string,
  body: import('./types').RevokeAndRekeyBody
): Promise<import('./types').RevokeAndRekeyResponse> {
  if (requesterRole !== 'admin') {
    throw new ForbiddenError('Only admins can revoke vault access');
  }

  const householdId = await getUserHousehold(requesterId);

  // Verify the revoked user is in the same household
  const revokedMembership = await HouseholdMember.findOne({
    where: { userId: body.revokedUserId, householdId },
  });
  if (!revokedMembership) {
    throw new NotFoundError('Revoked user is not a member of this household');
  }

  // Verify the requester is not revoking themselves
  if (body.revokedUserId === requesterId) {
    throw new ForbiddenError('You cannot revoke your own vault access');
  }

  // Verify all document IDs belong to the household
  const docIds = body.documents.map((d) => d.documentId);
  const documents = await VaultDocument.findAll({
    where: { id: { [Op.in]: docIds }, householdId },
    attributes: ['id'],
  });

  const validDocIds = new Set(documents.map((d) => d.id));
  for (const docId of docIds) {
    if (!validDocIds.has(docId)) {
      throw new NotFoundError(`Document ${docId} not found in your household`);
    }
  }

  // Verify all re-wrap target users have vault keys (cannot wrap for unknown recipients)
  const remainingKeys = await getHouseholdPublicKeys(householdId);
  const remainingKeyMap = new Map(remainingKeys.map((k) => [k.userId, k.publicKey]));

  // Required: exactly one wrapped key per remaining member (all members minus the revoked one).
  // A re-key that omits any member would silently lock them out of their own vault documents.
  const expectedKeyCount = remainingKeyMap.size - 1; // -1 excludes the revoked user
  for (const doc of body.documents) {
    // Filter out any accidentally-included entry for the revoked user before counting
    const nonRevokedEntries = doc.wrappedKeys.filter((e) => e.userId !== body.revokedUserId);
    if (nonRevokedEntries.length !== expectedKeyCount) {
      throw new ForbiddenError(
        `Document ${doc.documentId}: expected wrapped keys for ${expectedKeyCount} remaining member(s), got ${nonRevokedEntries.length}. All remaining members must receive a re-wrapped key.`
      );
    }
  }

  let totalKeysStored = 0;

  await sequelize.transaction(async (transaction) => {
    // Step 1: Delete ALL VaultDocumentKey records for revoked user across all household docs
    await VaultDocumentKey.destroy({
      where: { userId: body.revokedUserId },
      transaction,
    });

    // Step 2: Delete the revoked user's VaultKey (public key + encrypted backup)
    await VaultKey.destroy({
      where: { userId: body.revokedUserId },
      transaction,
    });

    // Step 3: Store re-wrapped keys for remaining members
    for (const doc of body.documents) {
      // Remove stale wrapped keys for this document (full re-key)
      await VaultDocumentKey.destroy({
        where: { documentId: doc.documentId },
        transaction,
      });

      for (const entry of doc.wrappedKeys) {
        if (entry.userId === body.revokedUserId) {
          // Never store a key for the revoked member — silently skip
          continue;
        }
        if (!remainingKeyMap.has(entry.userId)) {
          throw new ForbiddenError(
            `Member ${entry.userId} does not have a registered vault key`
          );
        }
        await VaultDocumentKey.create({
          documentId: doc.documentId,
          userId: entry.userId,
          wrappedKey: entry.wrappedKey,
        }, { transaction });
        totalKeysStored++;
      }
    }
  });

  return {
    revokedUserId: body.revokedUserId,
    documentsRekeyed: body.documents.length,
    totalKeysStored,
  };
}