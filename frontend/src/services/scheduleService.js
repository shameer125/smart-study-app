import api from './api';

export const scheduleService = {
  list: (params = {}) => api.get('/schedule', { params }).then((r) => r.data),
  get: (id) => api.get(`/schedule/${id}`).then((r) => r.data),
  create: (data) => api.post('/schedule', data).then((r) => r.data),
  update: (id, data) => api.put(`/schedule/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/schedule/${id}`).then((r) => r.data),
};
