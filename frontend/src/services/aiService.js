import api from './api';

export const aiService = {
  chat: (payload) => api.post('/ai/chat', payload).then((r) => r.data),
  conversations: () => api.get('/ai/conversations').then((r) => r.data),
  conversation: (id) => api.get(`/ai/conversations/${id}`).then((r) => r.data),
  deleteConversation: (id) => api.delete(`/ai/conversations/${id}`).then((r) => r.data),
};
