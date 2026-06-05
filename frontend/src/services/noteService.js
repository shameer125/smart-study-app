import api from './api';

const toFormData = (data) => {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) fd.append(k, v.join(','));
    else fd.append(k, v);
  });
  return fd;
};

export const noteService = {
  list: (params = {}) => api.get('/notes', { params }).then((r) => r.data),
  get: (id) => api.get(`/notes/${id}`).then((r) => r.data),
  create: (data) => api.post('/notes', toFormData(data), {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data),
  update: (id, data) => api.put(`/notes/${id}`, toFormData(data), {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data),
  remove: (id) => api.delete(`/notes/${id}`).then((r) => r.data),
};
