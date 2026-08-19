import { api } from './client.js';

export const authApi = {
  login: (email, password) => api.post('/auth/login/', { email, password }),
  signup: (payload) => api.post('/auth/signup/', payload),
  logout: () => api.post('/auth/logout/'),
  me: () => api.get('/auth/me/'),
  updateMe: (payload) => api.patch('/auth/me/', payload),

  listUsers: () => api.get('/users/'),
  createUser: (payload) => api.post('/users/', payload),
  updateUser: (id, payload) => api.patch(`/users/${id}/`, payload),
  deleteUser: (id) => api.delete(`/users/${id}/`),
  approveUser: (id, role) => api.post(`/users/${id}/approve/`, { role }),
  rejectUser: (id) => api.post(`/users/${id}/reject/`),
  toggleSuspend: (id) => api.post(`/users/${id}/toggle_suspend/`),

  listRoles: () => api.get('/roles/'),
};
