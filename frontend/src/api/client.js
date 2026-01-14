import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (email, password) => apiClient.post('/auth/register', { email, password }),
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  me: () => apiClient.get('/auth/me'),
  requestPasswordReset: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => apiClient.post('/auth/reset-password', { token, newPassword }),
};

// Snippet API
export const snippetAPI = {
  create: (data) => apiClient.post('/snippets', data),
  getAll: (params) => apiClient.get('/snippets', { params }),
  getSources: () => apiClient.get('/snippets/sources'),
  getById: (id) => apiClient.get(`/snippets/${id}`),
  update: (id, data) => apiClient.put(`/snippets/${id}`, data),
  delete: (id) => apiClient.delete(`/snippets/${id}`),
  toggleQueue: (id, inQueue) => apiClient.patch(`/snippets/${id}/queue`, { inQueue }),
  toggleNeedsWork: (id, needsWork) => apiClient.patch(`/snippets/${id}/needs-work`, { needsWork }),
  exportLibrary: () => apiClient.get('/snippets/export'),
  importLibrary: (data) => apiClient.post('/snippets/import', data),
  bulkUpdatePriority: (snippetIds, priority) => apiClient.post('/snippets/bulk-priority', { snippetIds, priority }),
};

// Review API
export const reviewAPI = {
  getDue: (queryString) => apiClient.get(`/review/due?${queryString}`),
  submit: (snippetId, quality) => apiClient.post(`/review/${snippetId}`, { quality }),
  getStats: () => apiClient.get('/review/stats'),
  clearData: () => apiClient.post('/review/clear-data'),
};

// Topic API
export const topicAPI = {
  getAll: () => apiClient.get('/topics'),
  create: (name) => apiClient.post('/topics', { name }),
};

// AI API
export const aiAPI = {
  ocr: (imageData) => apiClient.post('/ai/ocr', { imageData }),
  suggestTopics: (content) => apiClient.post('/ai/suggest-topics', { content }),
  search: (query) => apiClient.post('/ai/search', { query }),
  suggestCloze: (content) => apiClient.post('/ai/suggest-cloze', { content }),
};

export default apiClient;
