import api from './api';

export const statsService = {
  overview: () => api.get('/stats/overview').then((r) => r.data),
  subjects: () => api.get('/stats/subjects').then((r) => r.data),
  logFocus: (data) => api.post('/stats/focus', data).then((r) => r.data),
  recentFocus: () => api.get('/stats/focus').then((r) => r.data),
};
