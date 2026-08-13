export interface CreateVaultDocumentBody {
  name: string;
  mimeType: string;
  sizeBytes: number;
  encryptedKey: string;
  iv: string;
  cloudinaryPublicId: string;
  cloudinarySecureUrl: string;
}

export interface UpdateVaultDocumentBody {
  name?: string;
}

export interface VaultDocumentResponse {
  id: string;
  householdId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    avatarEmoji: string | null;
  };
  uploadedAt: string;
  downloadUrl: string;
  iv: string;
}

export interface PaginatedVaultDocuments {
  documents: VaultDocumentResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface VaultKeyResponse {
  userId: string;
  publicKey: string;
  privateKeyEncrypted: string;
  createdAt: string;
}

export interface VaultStorageUsageResponse {
  usedBytes: number;
  limitBytes: number;
  documentCount: number;
}

// ── Key Ceremony (FR-132) ──

export interface KeyCeremonyBody {
  wrappedKeys: {
    userId: string;
    wrappedKey: string;
  }[];
}

export interface KeyCeremonyResponse {
  documentId: string;
  keysStored: number;
}

// ── Key Rotation ──

export interface KeyRotationBody {
  documents: {
    documentId: string;
    wrappedKeys: {
      userId: string;
      wrappedKey: string;
    }[];
  }[];
}

export interface KeyRotationResponse {
  documentsRotated: number;
  totalKeysStored: number;
}

// ── Document Key ──

export interface DocumentKeyResponse {
  documentId: string;
  userId: string;
  wrappedKey: string;
}

// ── Revoke & Rekey ──
//
// When a member is removed from a household vault, their VaultDocumentKey
// records are deleted (they lose the ability to decrypt). For forward secrecy,
// remaining members re-encrypt all documents and supply new wrapped keys.
// This is optional but strongly recommended — the revokeAndRekey flow handles both.

export interface RevokeAndRekeyBody {
  /** ID of the member being revoked */
  revokedUserId: string;
  /** Re-wrapped AES keys for all remaining members, per document */
  documents: {
    documentId: string;
    wrappedKeys: {
      userId: string;
      wrappedKey: string;
    }[];
  }[];
}

export interface RevokeAndRekeyResponse {
  revokedUserId: string;
  documentsRekeyed: number;
  totalKeysStored: number;
}
