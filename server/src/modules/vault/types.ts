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

// ── Document Key ──

export interface DocumentKeyResponse {
  documentId: string;
  userId: string;
  wrappedKey: string;
}
