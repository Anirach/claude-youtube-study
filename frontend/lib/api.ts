import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Video APIs
export const videoAPI = {
  getAll: (params?: any) => api.get('/videos', { params }),
  getOne: (id: string) => api.get(`/videos/${id}`),
  create: (data: any) => api.post('/videos', data),
  update: (id: string, data: any) => api.put(`/videos/${id}`, data),
  delete: (id: string) => api.delete(`/videos/${id}`),
  process: (id: string) => api.post(`/videos/${id}/process`),
};

// Category APIs
export const categoryAPI = {
  getAll: () => api.get('/categories'),
  getOne: (id: string) => api.get(`/categories/${id}`),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Graph APIs
export const graphAPI = {
  get: () => api.get('/graph'),
  getRelationships: (videoId: string) => api.get(`/graph/relationships?videoId=${videoId}`),
};

// Chat APIs
export const chatAPI = {
  create: (videoIds: string[]) => api.post('/chat', { videoIds }),
  sendMessage: (id: string, message: string) => api.post(`/chat/${id}/message`, { message }),
  getHistory: (id: string) => api.get(`/chat/${id}`),
  getAll: () => api.get('/chat'),
};

export default api;
