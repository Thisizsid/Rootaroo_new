import type { CreateVaultDocumentBody, UpdateVaultDocumentBody, VaultDocumentResponse, PaginatedVaultDocuments, VaultKeyResponse, VaultStorageUsageResponse, KeyCeremonyBody, KeyCeremonyResponse, KeyRotationBody, KeyRotationResponse, DocumentKeyResponse } from './types';
export declare function getUserHousehold(userId: string): Promise<string>;
export declare function uploadDocument(userId: string, body: CreateVaultDocumentBody, fileBuffer: Buffer): Promise<VaultDocumentResponse>;
export declare function listDocuments(userId: string, options: {
    cursor?: string;
    limit?: number;
}): Promise<PaginatedVaultDocuments>;
export declare function getDocumentById(documentId: string, userId: string): Promise<VaultDocumentResponse>;
export declare function getDocumentKey(documentId: string, userId: string): Promise<DocumentKeyResponse>;
export declare function updateDocument(documentId: string, userId: string, userRole: string, body: UpdateVaultDocumentBody): Promise<VaultDocumentResponse>;
export declare function deleteDocument(documentId: string, userId: string, userRole: string): Promise<void>;
export declare function getStorageUsage(userId: string): Promise<VaultStorageUsageResponse>;
export declare function hardDeleteDocument(documentId: string, userId: string, userRole: string): Promise<void>;
export declare function storeUserKey(userId: string, body: {
    publicKey: string;
    privateKeyEncrypted: string;
}): Promise<VaultKeyResponse>;
export declare function getUserKey(userId: string): Promise<VaultKeyResponse | null>;
export declare function getHouseholdPublicKeys(householdId: string): Promise<VaultKeyResponse[]>;
export declare function performKeyCeremony(documentId: string, userId: string, body: KeyCeremonyBody): Promise<KeyCeremonyResponse>;
export declare function rotateVaultKey(userId: string, body: KeyRotationBody): Promise<KeyRotationResponse>;
export declare function getHouseholdKeyStatus(userId: string): Promise<{
    hasKey: boolean;
    membersWithKeys: number;
    totalMembers: number;
}>;
export declare function revokeAndRekeyMember(requesterId: string, requesterRole: string, body: import('./types').RevokeAndRekeyBody): Promise<import('./types').RevokeAndRekeyResponse>;
//# sourceMappingURL=service.d.ts.map