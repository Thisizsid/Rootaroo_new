import apiClient from './client';

export const feedApi = {
  uploadMedia: (files) =>
    apiClient.post('/feed/media/upload', files, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data),

  create: (data) =>
    apiClient.post('/feed', data).then((r) => r.data.data),

  list: (params) =>
    apiClient
      .get('/feed', { params })
      .then((r) => r.data.data),

  getById: (id) =>
    apiClient.get(`/feed/${id}`).then((r) => r.data.data),

  delete: (id) =>
    apiClient.delete(`/feed/${id}`),

  like: (postId) =>
    apiClient.post(`/feed/${postId}/like`),

  unlike: (postId) =>
    apiClient.delete(`/feed/${postId}/like`),

  addComment: (postId, content, parentId) =>
    apiClient
      .post(`/feed/${postId}/comments`, parentId ? { content, parentId } : { content })
      .then((r) => r.data.data),

  toggleCommentReaction: (commentId, reaction) =>
    apiClient
      .post(
        `/feed/comments/${commentId}/reactions`,
        { reaction },
      )
      .then((r) => r.data.data),

  deleteComment: (commentId) =>
    apiClient.delete(`/feed/comments/${commentId}`),

  getComments: (postId, params) =>
    apiClient
      .get(`/feed/${postId}/comments`, { params })
      .then((r) => r.data.data),
};
