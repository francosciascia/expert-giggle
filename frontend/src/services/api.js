import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const rutinasAPI = {
  getAll: (params = {}) => api.get('/api/rutinas/', { params }),
  getById: (id) => api.get(`/api/rutinas/${id}`),
  search: (nombre, params = {}) =>
    api.get('/api/rutinas/buscar', { params: { nombre, ...params } }),
  create: (data) => api.post('/api/rutinas/', data),
  update: (id, data) => api.put(`/api/rutinas/${id}`, data),
  delete: (id) => api.delete(`/api/rutinas/${id}`),
  addExercise: (id, data) => api.post(`/api/rutinas/${id}/ejercicios`, data),
  duplicate: (id) => api.post(`/api/rutinas/${id}/duplicar`),
  reorderExercises: (id, items) =>
    api.put(`/api/rutinas/${id}/ejercicios/reordenar`, { items }),
  exportOnePdf: (id) =>
    api.get(`/api/rutinas/${id}/export`, {
      params: { formato: 'pdf' },
      responseType: 'blob',
    }),
}

export const planAPI = {
  get: () => api.get('/api/plan/'),
  setDay: (dia_semana, rutina_id) => api.put('/api/plan/', { dia_semana, rutina_id }),
  clearDay: (dia_semana) => api.delete(`/api/plan/${dia_semana}`),
}

export const ejerciciosAPI = {
  update: (id, data) => api.put(`/api/ejercicios/${id}`, data),
  delete: (id) => api.delete(`/api/ejercicios/${id}`),
}

export default api

