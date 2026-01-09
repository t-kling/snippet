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
};

// Snippet API
export const snippetAPI = {
  create: (data) => apiClient.post('/snippets', data),
  getAll: (params) => apiClient.get('/snippets', { params }),
  getById: (id) => apiClient.get(`/snippets/${id}`),
  update: (id, data) => apiClient.put(`/snippets/${id}`, data),
  delete: (id) => apiClient.delete(`/snippets/${id}`),
  toggleQueue: (id, inQueue) => apiClient.patch(`/snippets/${id}/queue`, { inQueue }),
  toggleNeedsWork: (id, needsWork) => apiClient.patch(`/snippets/${id}/needs-work`, { needsWork }),
};

// Review API
export const reviewAPI = {
  getDue: (includeNeedsWork) => apiClient.get('/review/due', { params: { includeNeedsWork } }),
  submit: (snippetId, quality) => apiClient.post(`/review/${snippetId}`, { quality }),
  getStats: () => apiClient.get('/review/stats'),
};

// Topic API
export const topicAPI = {
  getAll: () => apiClient.get('/topics'),
  create: (name) => apiClient.post('/topics', { name }),
};

export default apiClient;
