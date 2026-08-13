import apiClient from './client';

export const vaultApi = {
  uploadDocument: (data, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', data.name);
    formData.append('mimeType', data.mimeType);
    formData.append('sizeBytes', data.sizeBytes.toString());
    formData.append('encryptedKey', data.encryptedKey);
    formData.append('iv', data.iv);

    return apiClient.post('/vault', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data);
  },

  listDocuments: (params) =>
    apiClient
      .get('/vault', { params })
      .then((r) => r.data.data),

  getDocument: (id) =>
    apiClient
      .get(`/vault/${id}`)
      .then((r) => r.data.data),

  getDocumentKey: (id) =>
    apiClient
      .get(`/vault/${id}/key`)
      .then((r) => r.data.data),

  updateDocument: (id, data) =>
    apiClient
      .patch(`/vault/${id}`, data)
      .then((r) => r.data.data),

  deleteDocument: (id) =>
    apiClient.delete(`/vault/${id}`).then((r) => r.data),

  hardDeleteDocument: (id) =>
    apiClient.delete(`/vault/${id}/hard`).then((r) => r.data),

  getSummary: () =>
    apiClient
      .get('/vault/summary')
      .then((r) => r.data.data),

  // Key management
  storeKey: (publicKey, privateKeyEncrypted) =>
    apiClient
      .post('/vault/keys/me', {
        publicKey,
        privateKeyEncrypted,
      })
      .then((r) => r.data.data),

  getMyKey: () =>
    apiClient
      .get('/vault/keys/me')
      .then((r) => r.data.data),

  getHouseholdKeys: () =>
    apiClient
      .get('/vault/keys')
      .then((r) => r.data.data),

  getKeyStatus: () =>
    apiClient
      .get('/vault/keys/status')
      .then((r) => r.data.data),

  // Key ceremony
  performKeyCeremony: (documentId, wrappedKeys) =>
    apiClient
      .post(
        `/vault/${documentId}/key-ceremony`,
        { wrappedKeys }
      )
      .then((r) => r.data.data),

  // Key rotation
  rotateVaultKey: (documents) =>
    apiClient
      .post(
        '/vault/keys/rotate',
        { documents }
      )
      .then((r) => r.data.data),

  // Revoke member and rekey all documents (admin only)
  revokeAndRekey: (
    revokedUserId,
    documents
  ) =>
    apiClient
      .post('/vault/keys/revoke', { revokedUserId, documents })
      .then((r) => r.data.data),
};
