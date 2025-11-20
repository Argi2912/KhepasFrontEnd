import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import router from '@/router'
import notify from '@/services/notify'

export const useAuthStore = defineStore('auth', () => {
  // --- ESTADO (State) ---
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(null) // Contendrá el objeto completo del usuario (con roles, etc.)
  const permissions = ref([]) // Contendrá una lista PLANA de permisos (ej: ['manage_users', ...])

  // --- GETTERS (Computed) ---
  const isLoggedIn = computed(() => !!token.value)
  const authUser = computed(() => user.value)

  /**
   * Verifica si el usuario tiene un permiso específico.
   */
  const can = (permissionName) => {
    // 1. Si el usuario es Superadmin (sin tenant_id), tiene acceso total
    if (user.value && user.value.tenant_id === null) {
      return true
    }
    // 2. Busca en la lista plana de permisos
    return permissions.value.includes(permissionName)
  }

  // --- ACCIONES (Actions) ---

  function setToken(newToken) {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  async function login(credentials) {
    const response = await api.post('/login', credentials)
    const newToken = response.data.access_token

    setToken(newToken)

    // Esperamos que fetchUser() termine y cargue los permisos
    await fetchUser()

    // Solo después de tener los permisos, redirigimos.
    // Esto evita el error 403 al recargar.
    router.push({ name: 'dashboard' })
  }

  /**
   * Obtiene los datos del usuario y "aplana" los permisos.
   */
  async function fetchUser() {
    if (!token.value) return

    try {
      const response = await api.get('/me')
      user.value = response.data // Guardamos el usuario (JSON completo)

      // 🚨 LA SOLUCIÓN ESTÁ AQUÍ 🚨
      // "Aplanamos" la estructura anidada (user -> roles -> permissions)
      // en un solo array de strings.
      const userPermissions = response.data.roles.flatMap((role) =>
        (role.permissions || []).map((p) => p.name),
      )

      // Guardamos la lista única de permisos
      permissions.value = [...new Set(userPermissions)]
    } catch (error) {
      console.error('Error al obtener datos del usuario (Token inválido o expirado):', error)
      setToken(null)
      user.value = null
      permissions.value = []
      throw error // Propagar el error para que el router guard lo capture
    }
  }

  async function logout(notifyUser = true, redirect = true) {
    if (token.value) {
      try {
        await api.post('/logout')
      } catch (error) {
        console.warn('Logout de API fallido, forzando limpieza local.')
      }
    }

    // Limpieza completa del estado
    setToken(null)
    user.value = null
    permissions.value = []

    if (notifyUser) {
      notify.success('Sesión cerrada correctamente.')
    }

    if (redirect) {
      router.push({ name: 'login' })
    }
  }

  /**
   * Función de ayuda para el router guard, se asegura de que
   * el usuario esté cargado si hay un token (ej. al recargar con F5).
   */
  async function checkAuth() {
    if (token.value && !user.value) {
      await fetchUser()
    }
  }

  return {
    token,
    user,
    permissions, // La lista plana de permisos
    isLoggedIn,
    authUser,
    can, // La función que consume la lista plana
    login,
    fetchUser,
    logout,
    checkAuth,
  }
})
