// src/services/authService.js

import apiClient from '@/utils/http.js' // Importamos el cliente con interceptores

const authService = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  register: (credentials) => apiClient.post('/auth/register', credentials),
  me: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
  // Añadir refresh si se requiere manejo manual de refresh token
}

export default authService
