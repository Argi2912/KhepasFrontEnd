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
        authStore.logout(false, true)
        notify.error('Sesión expirada o inválida. Inicia sesión.')
        return Promise.reject(error)
      }

      // 403: No tienes permiso
      if (status === 403) {
        notify.error('Acceso denegado. No tienes permisos para esta acción.')
        return Promise.reject(error)
      }

      // 422: Errores de Validación (Laravel)
      if (status === 422) {
        // CAMBIO AQUÍ: Mensaje genérico en lugar de específico
        // Esto evita el juego de "Adivina cuál es el siguiente error"
        notify.warning(
          'Hay datos incorrectos en el formulario. Por favor revisa los campos en rojo.',
        )
        return Promise.reject(error)
      }

      // 429: Demasiadas peticiones (Throttle)
      if (status === 429) {
        notify.warning('Has realizado demasiadas peticiones. Espera un momento.')
        return Promise.reject(error)
      }

      // 500: Error de Servidor
      if (status >= 500) {
        // A veces el backend manda un mensaje útil en 'message', si no, usamos el genérico
        const serverMsg = error.response.data?.message
        if (serverMsg && serverMsg.length < 100) {
          // Solo si es un mensaje corto legible
          notify.error(`Error del servidor: ${serverMsg}`)
        } else {
          notify.error('Error interno del servidor. Inténtalo más tarde.')
        }
      }
    } else if (error.request) {
      notify.error('No se pudo conectar con el servidor. API inactiva.')
    }

    return Promise.reject(error)
  },
)

export default api
