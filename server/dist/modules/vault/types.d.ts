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
export interface DocumentKeyResponse {
    documentId: string;
    userId: string;
    wrappedKey: string;
}
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
//# sourceMappingURL=types.d.ts.map