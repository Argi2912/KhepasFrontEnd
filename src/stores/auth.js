import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import router from '@/router'
import notify from '@/services/notify'

export const useAuthStore = defineStore('auth', () => {
  // --- ESTADO (State) ---
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(null)
  const permissions = ref([])

  // --- GETTERS (Computed) ---
  const isLoggedIn = computed(() => !!token.value)
  const authUser = computed(() => user.value)

  // Verifica si el usuario tiene un permiso específico
  const can = (permissionName) => {
    if (user.value && user.value.tenant_id === null) {
      return true // Superadmin tiene acceso total
    }
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
    await fetchUser()

    router.push({ name: 'dashboard' })
  }

  async function fetchUser() {
    if (!token.value) return

    try {
      const response = await api.get('/me')
      user.value = response.data

      // Aplanar los permisos de los roles (asumiendo formato Spatie: user.roles[].permissions[])
      const userPermissions = response.data.roles.flatMap((role) =>
        (role.permissions || []).map((p) => p.name),
      )
      permissions.value = [...new Set(userPermissions)]
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error)
      // Limpiamos el estado localmente, sin redireccionar (el router guard lo hará)
      setToken(null)
      user.value = null
      permissions.value = []
      throw error // Propagar el error para el interceptor/guard
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

  async function checkAuth() {
    if (token.value && !user.value) {
      await fetchUser()
    }
  }

  return {
    token,
    user,
    permissions,
    isLoggedIn,
    authUser,
    can,
    login,
    fetchUser,
    logout,
    checkAuth,
  }
})
