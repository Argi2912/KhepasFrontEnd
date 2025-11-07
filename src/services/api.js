import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import notify from './notify'
import router from '@/router'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const authStore = useAuthStore()
    if (error.response) {
      const status = error.response.status

      // 401: Token inválido o expirado
      if (status === 401) {
        // Llama a logout sin notificar para evitar doble mensaje (Axios ya notificó el error de red)
        authStore.logout(false, true)
        notify.error('Sesión expirada o inválida. Inicia sesión.')
        return Promise.reject(error)
      }

      // 403: No tienes permiso
      if (status === 403) {
        notify.error('Acceso denegado. No tienes permisos para esta acción.')
        // Puedes redirigir a una página de acceso denegado si existe
        return Promise.reject(error)
      }

      // 422: Errores de Validación (Laravel)
      if (status === 422) {
        // El error 422 será manejado localmente por useFormValidation en el componente
        // Aquí solo mostramos el primer mensaje para el usuario
        const validationErrors = error.response.data.errors
        const firstErrorKey = validationErrors ? Object.keys(validationErrors)[0] : null
        const message = firstErrorKey ? validationErrors[firstErrorKey][0] : 'Error de validación.'
        notify.error(message)
        return Promise.reject(error)
      }

      // 500: Error de Servidor
      if (status >= 500) {
        notify.error('Error interno del servidor. Inténtalo más tarde.')
      }
    } else if (error.request) {
      notify.error('No se pudo conectar con el servidor. API inactiva.')
    }

    return Promise.reject(error)
  },
)

export default api
