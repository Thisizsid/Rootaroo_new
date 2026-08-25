import apiClient from './client';

export const chatApi = {
  // Conversations
  listConversations: async () => {
    const res = await apiClient.get('/chat/conversations');
    return res.data.data;
  },

  createConversation: async (body) => {
    const res = await apiClient.post('/chat/conversations', body);
    return res.data.data;
  },

  deleteConversation: async (id) => {
    await apiClient.delete(`/chat/conversations/${id}`);
  },

  addParticipant: async (conversationId, userId) => {
    await apiClient.post(`/chat/conversations/${conversationId}/participants`, { userId });
  },

  inviteToGroup: async (conversationId, userId) => {
    await apiClient.post(`/chat/conversations/${conversationId}/invite`, { userId });
  },

  removeParticipant: async (conversationId, userId) => {
    await apiClient.delete(`/chat/conversations/${conversationId}/participants/${userId}`);
  },

  // Messages
  list: async (params) => {
    const res = await apiClient.get('/chat', { params });
    return res.data.data;
  },

  send: async (body) => {
    const res = await apiClient.post('/chat', body);
    return res.data.data;
  },

  getById: async (id) => {
    const res = await apiClient.get(`/chat/${id}`);
    return res.data.data;
  },

  update: async (id, body) => {
    const res = await apiClient.patch(`/chat/${id}`, body);
    return res.data.data;
  },

  remove: async (id) => {
    await apiClient.delete(`/chat/${id}`);
  },

  addReaction: async (id, emoji) => {
    const res = await apiClient.post(`/chat/${id}/reactions`, { emoji });
    return res.data.data;
  },

  removeReaction: async (id, emoji) => {
    const res = await apiClient.delete(`/chat/${id}/reactions/${encodeURIComponent(emoji)}`);
    return res.data.data;
  },

  typing: async (action) => {
    await apiClient.post('/chat/typing', null, { params: { action } });
  },

  uploadMedia: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/feed/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  uploadImage: async ({ uri, name, type }) => {
    const formData = new FormData();
    formData.append('file', { uri, name: name || `image_${Date.now()}.jpg`, type: type || 'image/jpeg' });
    const res = await apiClient.post('/chat/media/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  uploadVoice: async ({ uri, name, type, durationSeconds }) => {
    const formData = new FormData();
    formData.append('file', { uri, name: name || `voice_${Date.now()}.m4a`, type: type || 'audio/m4a' });
    formData.append('durationSeconds', String(Math.round(durationSeconds || 0)));
    const res = await apiClient.post('/chat/media/voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
};
