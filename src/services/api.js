import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor de solicitudes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Interceptor de respuestas
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Manejo de errores más específico
    if (error.response && error.response.status === 401) {
      // Por ejemplo, redirigir al login o intentar refrescar el token
      console.error('Error 401: No autorizado. Posible token inválido.')
      // Opcional: Llamar a refreshToken y reintentar la solicitud
    }
    return Promise.reject(error)
  },
)

export default api
