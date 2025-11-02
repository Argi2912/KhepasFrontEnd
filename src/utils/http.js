// src/plugins/apiClient.js

import axios from 'axios'
import { useToast } from 'vue-toastification'

const toast = useToast()

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

// ==========================================================
// A. Interceptor de Peticiones (Adjuntar JWT)
// ==========================================================
apiClient.interceptors.request.use(
  (config) => {
    // Usamos 'jwt_token' para consistencia con el Store
    const token = localStorage.getItem('jwt_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// ==========================================================
// B. Interceptor de Respuestas (Manejo de Errores Globales con Notificaciones)
// ==========================================================
apiClient.interceptors.response.use(
  (response) => {
    // Notificación de éxito para métodos que modifican (post, put, delete)
    if (['post', 'put', 'delete'].includes(response.config.method) && response.data.message) {
      toast.success(response.data.message)
    }
    return response
  },
  (error) => {
    const response = error.response

    if (response && response.data) {
      let message = response.data.message || 'Error desconocido del servidor.'

      // 1. Manejo de Errores de Validación de Laravel (Status 422)
      if (response.status === 422 && response.data.errors) {
        const validationErrors = Object.values(response.data.errors).flat().join(' | ')
        toast.warning(`Validación fallida: ${validationErrors}`, {
          timeout: 5000,
        })
      }

      // 2. Manejo de Sesión Expirada (Status 401)
      else if (response.status === 401) {
        // Notificación de error genérico (la lógica de logout está en el Store)
        toast.error('Acceso denegado o sesión expirada.')
      }

      // 3. Otros errores (400, 403, 500)
      else {
        toast.error(message)
      }
    } else {
      // Error de red
      toast.error('Error de red. Verifique su conexión o la URL del servidor.')
    }

    return Promise.reject(error)
  },
)

export default apiClient
