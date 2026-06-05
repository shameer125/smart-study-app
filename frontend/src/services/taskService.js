import api from './api';

export const taskService = {
  list: (params = {}) => api.get('/tasks', { params }).then((r) => r.data),
  get: (id) => api.get(`/tasks/${id}`).then((r) => r.data),
  create: (data) => api.post('/tasks', data).then((r) => r.data),
  update: (id, data) => api.put(`/tasks/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/tasks/${id}`).then((r) => r.data),
  reorder: (items) => api.post('/tasks/reorder', { items }).then((r) => r.data),
};
