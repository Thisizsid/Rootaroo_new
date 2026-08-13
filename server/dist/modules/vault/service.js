"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserHousehold = getUserHousehold;
exports.uploadDocument = uploadDocument;
exports.listDocuments = listDocuments;
exports.getDocumentById = getDocumentById;
exports.getDocumentKey = getDocumentKey;
exports.updateDocument = updateDocument;
exports.deleteDocument = deleteDocument;
exports.getStorageUsage = getStorageUsage;
exports.hardDeleteDocument = hardDeleteDocument;
exports.storeUserKey = storeUserKey;
exports.getUserKey = getUserKey;
exports.getHouseholdPublicKeys = getHouseholdPublicKeys;
exports.performKeyCeremony = performKeyCeremony;
exports.rotateVaultKey = rotateVaultKey;
exports.getHouseholdKeyStatus = getHouseholdKeyStatus;
exports.revokeAndRekeyMember = revokeAndRekeyMember;
const sequelize_1 = require("sequelize");
const models_1 = require("../../database/models");
const errors_1 = require("../../shared/utils/errors");
const cloudinary_1 = require("../../shared/utils/cloudinary");
const MAX_STORAGE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
async function getUserHousehold(userId) {
    const membership = await models_1.HouseholdMember.findOne({ where: { userId } });
    if (!membership) {
        throw new errors_1.ForbiddenError('You must belong to a household to use the vault');
    }
    return membership.householdId;
}
function toDocumentResponse(doc) {
    return {
        id: doc.id,
        householdId: doc.householdId,
        name: doc.name,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        uploadedBy: {
            id: doc.get('uploader').id,
            displayName: doc.get('uploader').displayName,
            avatarUrl: doc.get('uploader').avatarUrl,
            avatarEmoji: doc.get('uploader').avatarEmoji,
        },
        uploadedAt: doc.createdAt.toISOString(),
        downloadUrl: doc.cloudinarySecureUrl,
    };
}
function toKeyResponse(key) {
    return {
        userId: key.userId,
        publicKey: key.publicKey,
        privateKeyEncrypted: key.privateKeyEncrypted,
        createdAt: key.createdAt.toISOString(),
    };
}
async function checkStorageQuota(householdId, additionalBytes) {
    const totalSize = await models_1.VaultDocument.sum('sizeBytes', {
        where: { householdId },
    }) || 0;
    if (totalSize + additionalBytes > MAX_STORAGE_BYTES) {
        throw new errors_1.ForbiddenError(`Vault storage limit exceeded (${MAX_STORAGE_BYTES / (1024 * 1024 * 1024)}GB). Current: ${(totalSize / (1024 * 1024)).toFixed(1)}MB`);
    }
}
// ─── Upload Document ───
async function uploadDocument(userId, body, fileBuffer) {
    const householdId = await getUserHousehold(userId);
    // Verify file size
    if (body.sizeBytes > MAX_FILE_SIZE) {
        throw new errors_1.ForbiddenError(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
    }
    // Check storage quota
    await checkStorageQuota(householdId, body.sizeBytes);
    // Upload to Cloudinary
    const uploadResult = await (0, cloudinary_1.uploadBuffer)(fileBuffer, {
        folder: `rootaru/vault/${householdId}`,
        resource_type: 'raw',
        public_id: `vault-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    });
    // Create document + per-user wrapped key in a transaction
    const document = await models_1.sequelize.transaction(async (transaction) => {
        const doc = await models_1.VaultDocument.create({
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
        await models_1.VaultDocumentKey.create({
            documentId: doc.id,
            userId,
            wrappedKey: body.encryptedKey,
        }, { transaction });
        return doc;
    });
    // Load with uploader
    const fullDoc = await models_1.VaultDocument.findByPk(document.id, {
        include: [{ model: models_1.User, as: 'uploader' }],
    });
    if (!fullDoc) {
        throw new Error('Failed to load created document');
    }
    return toDocumentResponse(fullDoc);
}
// ─── List Documents ───
async function listDocuments(userId, options) {
    const householdId = await getUserHousehold(userId);
    const limit = Math.min(options.limit || 20, 50);
    const where = { householdId };
    if (options.cursor) {
        where.createdAt = { [sequelize_1.Op.lt]: new Date(options.cursor) };
    }
    const documents = await models_1.VaultDocument.findAll({
        where,
        include: [{ model: models_1.User, as: 'uploader' }],
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
async function getDocumentById(documentId, userId) {
    const householdId = await getUserHousehold(userId);
    const document = await models_1.VaultDocument.findOne({
        where: { id: documentId, householdId },
        include: [{ model: models_1.User, as: 'uploader' }],
    });
    if (!document) {
        throw new errors_1.NotFoundError('Document');
    }
    return toDocumentResponse(document);
}
// ─── Get User's Wrapped Key for a Document ───
async function getDocumentKey(documentId, userId) {
    const householdId = await getUserHousehold(userId);
    // Verify document belongs to the user's household
    const document = await models_1.VaultDocument.findOne({
        where: { id: documentId, householdId },
        attributes: ['id'],
    });
    if (!document) {
        throw new errors_1.NotFoundError('Document');
    }
    // Look up the per-user wrapped key
    const docKey = await models_1.VaultDocumentKey.findOne({
        where: { documentId, userId },
    });
    if (!docKey) {
        throw new errors_1.NotFoundError('No vault key found for this document. A key ceremony may be required.');
    }
    return {
        documentId: docKey.documentId,
        userId: docKey.userId,
        wrappedKey: docKey.wrappedKey,
    };
}
// ─── Update Document ───
async function updateDocument(documentId, userId, userRole, body) {
    const householdId = await getUserHousehold(userId);
    const document = await models_1.VaultDocument.findOne({
        where: { id: documentId, householdId },
        include: [{ model: models_1.User, as: 'uploader' }],
    });
    if (!document) {
        throw new errors_1.NotFoundError('Document');
    }
    // Only uploader or admin can rename
    if (document.uploadedBy !== userId && userRole !== 'admin') {
        throw new errors_1.ForbiddenError('Only the uploader or an admin can update this document');
    }
    if (body.name !== undefined) {
        document.name = body.name;
    }
    await document.save();
    const updated = await models_1.VaultDocument.findByPk(document.id, {
        include: [{ model: models_1.User, as: 'uploader' }],
    });
    if (!updated) {
        throw new Error('Failed to load updated document');
    }
    return toDocumentResponse(updated);
}
// ─── Delete Document ───
async function deleteDocument(documentId, userId, userRole) {
    const householdId = await getUserHousehold(userId);
    const document = await models_1.VaultDocument.findOne({
        where: { id: documentId, householdId },
    });
    if (!document) {
        throw new errors_1.NotFoundError('Document');
    }
    // Only uploader or admin can delete
    if (document.uploadedBy !== userId && userRole !== 'admin') {
        throw new errors_1.ForbiddenError('Only the uploader or an admin can delete this document');
    }
    // Delete from Cloudinary
    await (0, cloudinary_1.deleteResource)(document.cloudinaryPublicId);
    // Hard delete document + all per-user keys in a transaction
    await models_1.sequelize.transaction(async (transaction) => {
        await models_1.VaultDocumentKey.destroy({ where: { documentId }, transaction });
        await document.destroy({ force: true, transaction });
    });
}
// ─── Storage Usage ───
async function getStorageUsage(userId) {
    const householdId = await getUserHousehold(userId);
    const documents = await models_1.VaultDocument.findAll({
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
async function hardDeleteDocument(documentId, userId, userRole) {
    if (userRole !== 'admin') {
        throw new errors_1.ForbiddenError('Only admins can permanently delete documents');
    }
    const householdId = await getUserHousehold(userId);
    const document = await models_1.VaultDocument.findOne({
        where: { id: documentId, householdId },
    });
    if (!document) {
        throw new errors_1.NotFoundError('Document');
    }
    // Delete from Cloudinary
    await (0, cloudinary_1.deleteResource)(document.cloudinaryPublicId);
    // Permanently purge document + per-user keys
    await models_1.sequelize.transaction(async (transaction) => {
        await models_1.VaultDocumentKey.destroy({ where: { documentId }, transaction });
        await document.destroy({ force: true, transaction });
    });
}
// ─── Vault Key Management ───
async function storeUserKey(userId, body) {
    const householdId = await getUserHousehold(userId);
    const [key] = await models_1.VaultKey.upsert({
        userId,
        householdId,
        publicKey: body.publicKey,
        privateKeyEncrypted: body.privateKeyEncrypted,
    }, { returning: true });
    return toKeyResponse(key);
}
async function getUserKey(userId) {
    const key = await models_1.VaultKey.findByPk(userId);
    return key ? toKeyResponse(key) : null;
}
async function getHouseholdPublicKeys(householdId) {
    const members = await models_1.HouseholdMember.findAll({
        where: { householdId },
        include: [{ model: models_1.VaultKey, as: 'vaultKey' }],
    });
    return members
        .filter((m) => m.get('vaultKey') !== null)
        .map((m) => toKeyResponse(m.get('vaultKey')));
}
// ─── Key Ceremony (FR-132) ───
//
// The client performs the actual cryptographic work:
//   1. Unwraps the document's AES key using their RSA private key
//   2. Wraps the AES key with each target member's RSA public key
//   3. Sends the wrapped keys to the server for storage
//
// The server NEVER sees the raw AES key — only RSA-wrapped ciphertext.
async function performKeyCeremony(documentId, userId, body) {
    const householdId = await getUserHousehold(userId);
    const document = await models_1.VaultDocument.findOne({
        where: { id: documentId, householdId },
    });
    if (!document) {
        throw new errors_1.NotFoundError('Document');
    }
    // Verify the requesting user has access to this document's key
    const requesterKey = await models_1.VaultDocumentKey.findOne({
        where: { documentId, userId },
    });
    if (!requesterKey) {
        throw new errors_1.ForbiddenError('You do not have a key for this document');
    }
    // Verify all target users are household members with vault keys
    const publicKeys = await getHouseholdPublicKeys(householdId);
    const keyMap = new Map(publicKeys.map((k) => [k.userId, k.publicKey]));
    for (const entry of body.wrappedKeys) {
        if (!keyMap.has(entry.userId)) {
            throw new errors_1.ForbiddenError(`Member ${entry.userId} does not have a vault key`);
        }
    }
    // Store the client-provided wrapped keys
    await models_1.sequelize.transaction(async (transaction) => {
        for (const entry of body.wrappedKeys) {
            await models_1.VaultDocumentKey.upsert({
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
async function rotateVaultKey(userId, body) {
    const householdId = await getUserHousehold(userId);
    // Verify all provided document IDs belong to the household
    const docIds = body.documents.map((d) => d.documentId);
    const documents = await models_1.VaultDocument.findAll({
        where: { id: { [sequelize_1.Op.in]: docIds }, householdId },
        attributes: ['id'],
    });
    const validDocIds = new Set(documents.map((d) => d.id));
    for (const docId of docIds) {
        if (!validDocIds.has(docId)) {
            throw new errors_1.NotFoundError(`Document ${docId} not found in your household`);
        }
    }
    // Verify all target users have vault keys
    const existingKeys = await getHouseholdPublicKeys(householdId);
    const existingKeyMap = new Map(existingKeys.map((k) => [k.userId, k.publicKey]));
    let totalKeysStored = 0;
    await models_1.sequelize.transaction(async (transaction) => {
        for (const doc of body.documents) {
            // Replace all existing wrapped keys for this document
            await models_1.VaultDocumentKey.destroy({
                where: { documentId: doc.documentId },
                transaction,
            });
            for (const entry of doc.wrappedKeys) {
                if (!existingKeyMap.has(entry.userId)) {
                    throw new errors_1.ForbiddenError(`Member ${entry.userId} does not have a vault key`);
                }
                await models_1.VaultDocumentKey.create({
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
async function getHouseholdKeyStatus(userId) {
    const householdId = await getUserHousehold(userId);
    const members = await models_1.HouseholdMember.findAll({
        where: { householdId },
        include: [{ model: models_1.VaultKey, as: 'vaultKey' }],
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
async function revokeAndRekeyMember(requesterId, requesterRole, body) {
    if (requesterRole !== 'admin') {
        throw new errors_1.ForbiddenError('Only admins can revoke vault access');
    }
    const householdId = await getUserHousehold(requesterId);
    // Verify the revoked user is in the same household
    const revokedMembership = await models_1.HouseholdMember.findOne({
        where: { userId: body.revokedUserId, householdId },
    });
    if (!revokedMembership) {
        throw new errors_1.NotFoundError('Revoked user is not a member of this household');
    }
    // Verify the requester is not revoking themselves
    if (body.revokedUserId === requesterId) {
        throw new errors_1.ForbiddenError('You cannot revoke your own vault access');
    }
    // Verify all document IDs belong to the household
    const docIds = body.documents.map((d) => d.documentId);
    const documents = await models_1.VaultDocument.findAll({
        where: { id: { [sequelize_1.Op.in]: docIds }, householdId },
        attributes: ['id'],
    });
    const validDocIds = new Set(documents.map((d) => d.id));
    for (const docId of docIds) {
        if (!validDocIds.has(docId)) {
            throw new errors_1.NotFoundError(`Document ${docId} not found in your household`);
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
            throw new errors_1.ForbiddenError(`Document ${doc.documentId}: expected wrapped keys for ${expectedKeyCount} remaining member(s), got ${nonRevokedEntries.length}. All remaining members must receive a re-wrapped key.`);
        }
    }
    let totalKeysStored = 0;
    await models_1.sequelize.transaction(async (transaction) => {
        // Step 1: Delete ALL VaultDocumentKey records for revoked user across all household docs
        await models_1.VaultDocumentKey.destroy({
            where: { userId: body.revokedUserId },
            transaction,
        });
        // Step 2: Delete the revoked user's VaultKey (public key + encrypted backup)
        await models_1.VaultKey.destroy({
            where: { userId: body.revokedUserId },
            transaction,
        });
        // Step 3: Store re-wrapped keys for remaining members
        for (const doc of body.documents) {
            // Remove stale wrapped keys for this document (full re-key)
            await models_1.VaultDocumentKey.destroy({
                where: { documentId: doc.documentId },
                transaction,
            });
            for (const entry of doc.wrappedKeys) {
                if (entry.userId === body.revokedUserId) {
                    // Never store a key for the revoked member — silently skip
                    continue;
                }
                if (!remainingKeyMap.has(entry.userId)) {
                    throw new errors_1.ForbiddenError(`Member ${entry.userId} does not have a registered vault key`);
                }
                await models_1.VaultDocumentKey.create({
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
//# sourceMappingURL=service.js.map