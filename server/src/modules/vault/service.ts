import { Op } from 'sequelize';
import {
  sequelize,
  VaultDocument,
  VaultDocumentKey,
  VaultKey,
  User,
} from '../../database/models';
import { NotFoundError, ForbiddenError } from '../../shared/utils/errors';
import { uploadBuffer, deleteObject, getSignedUrl } from '../../shared/utils/s3';
import { isCurrentHouseholdAdmin, getUserHousehold as getUserHouseholdCore } from '../../shared/utils/household';
import type {
  CreateVaultDocumentBody,
  UpdateVaultDocumentBody,
  VaultDocumentResponse,
  PaginatedVaultDocuments,
  VaultKeyResponse,
  VaultStorageUsageResponse,
  DocumentKeyResponse,
} from './types';

const MAX_STORAGE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function getUserHousehold(userId: string): Promise<string> {
  return getUserHouseholdCore(userId, 'You must belong to a household to use the vault');
}

async function toDocumentResponse(doc: VaultDocument): Promise<VaultDocumentResponse> {
  return {
    id: doc.id,
    householdId: doc.householdId,
    name: doc.name,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    uploadedBy: {
      id: (doc.get('uploader') as User).id,
      displayName: (doc.get('uploader') as User).displayName,
      avatarUrl: await getSignedUrl((doc.get('uploader') as User).avatarUrl),
      avatarEmoji: (doc.get('uploader') as User).avatarEmoji,
    },
    uploadedAt: doc.createdAt.toISOString(),
    downloadUrl: (await getSignedUrl(doc.s3Key))!,
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

async function checkStorageQuota(userId: string, additionalBytes: number): Promise<void> {
  const totalSize = await VaultDocument.sum('sizeBytes', {
    where: { uploadedBy: userId },
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
  await checkStorageQuota(userId, body.sizeBytes);

  const uploadResult = await uploadBuffer(fileBuffer, `vault/${householdId}`, body.mimeType);

  // Create document + per-user wrapped key in a transaction
  const document = await sequelize.transaction(async (transaction) => {
    const doc = await VaultDocument.create({
      householdId,
      name: body.name,
      mimeType: body.mimeType,
      sizeBytes: body.sizeBytes,
      encryptedKey: body.encryptedKey,
      iv: body.iv,
      s3Key: uploadResult.key,
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

  return await toDocumentResponse(fullDoc);
}

// ─── List Documents ───

export async function listDocuments(
  userId: string,
  options: { cursor?: string; limit?: number }
): Promise<PaginatedVaultDocuments> {
  const householdId = await getUserHousehold(userId);
  const limit = Math.min(options.limit || 20, 50);

  const where: any = { householdId, uploadedBy: userId };
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
    documents: await Promise.all(page.map(toDocumentResponse)),
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
    where: { id: documentId, householdId, uploadedBy: userId },
    include: [{ model: User, as: 'uploader' }],
  });

  if (!document) {
    throw new NotFoundError('Document');
  }

  return await toDocumentResponse(document);
}

// ─── Get User's Wrapped Key for a Document ───

export async function getDocumentKey(
  documentId: string,
  userId: string
): Promise<DocumentKeyResponse> {
  const householdId = await getUserHousehold(userId);

  // Verify document belongs to this user
  const document = await VaultDocument.findOne({
    where: { id: documentId, householdId, uploadedBy: userId },
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
  _userRole: string,
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

  // Only uploader or admin can rename. Re-checked against the DB rather
  // than trusting the caller's JWT `role` claim, which goes stale the
  // moment a user is demoted (F-06) — a demoted admin would otherwise
  // keep this authority until their token naturally expires.
  if (document.uploadedBy !== userId && !(await isCurrentHouseholdAdmin(userId, householdId))) {
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

  return await toDocumentResponse(updated);
}

// ─── Delete Document ───

export async function deleteDocument(
  documentId: string,
  userId: string,
  _userRole: string
): Promise<void> {
  const householdId = await getUserHousehold(userId);

  const document = await VaultDocument.findOne({
    where: { id: documentId, householdId },
  });

  if (!document) {
    throw new NotFoundError('Document');
  }

  // Only uploader or admin can delete (DB-checked, not JWT role — F-06).
  if (document.uploadedBy !== userId && !(await isCurrentHouseholdAdmin(userId, householdId))) {
    throw new ForbiddenError('Only the uploader or an admin can delete this document');
  }

  // Delete from S3
  await deleteObject(document.s3Key);

  // Hard delete document + all per-user keys in a transaction
  await sequelize.transaction(async (transaction) => {
    await VaultDocumentKey.destroy({ where: { documentId }, transaction });
    await document.destroy({ force: true, transaction });
  });
}

// ─── Storage Usage ───

export async function getStorageUsage(userId: string): Promise<VaultStorageUsageResponse> {
  await getUserHousehold(userId); // ensures caller belongs to a household

  const documents = await VaultDocument.findAll({
    where: { uploadedBy: userId },
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
  _userRole: string
): Promise<void> {
  const householdId = await getUserHousehold(userId);

  // Permanent delete — the highest-stakes gate in this module, so it must
  // never rely on the caller's JWT `role` claim alone (F-06): that claim
  // is only refreshed on login/refresh, so a demoted admin would
  // otherwise keep this authority until their token naturally expires.
  if (!(await isCurrentHouseholdAdmin(userId, householdId))) {
    throw new ForbiddenError('Only admins can permanently delete documents');
  }

  const document = await VaultDocument.findOne({
    where: { id: documentId, householdId },
  });

  if (!document) {
    throw new NotFoundError('Document');
  }

  // Delete from S3
  await deleteObject(document.s3Key);

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

