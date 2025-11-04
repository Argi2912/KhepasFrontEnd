import { defineStore } from 'pinia'
import authService from '@/services/authService'
import userService from '@/services/userService' // <-- IMPORTAR NUEVO SERVICIO
import router from '@/router'
import { useToast } from 'vue-toastification'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('jwt_token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    loading: false,
    authError: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    fullName: (state) =>
      state.user ? `${state.user.first_name} ${state.user.last_name}` : 'Invitado',
    primaryRole: (state) => state.user?.roles?.[0]?.name || 'Client',
  },

  actions: {
    setAuth(token, userData) {
      this.token = token
      // Si userData no es nulo, actualiza el usuario
      if (userData) {
        this.user = userData
        localStorage.setItem('user', JSON.stringify(userData))
      }

      if (token) {
        localStorage.setItem('jwt_token', token)
      } else {
        localStorage.removeItem('jwt_token')
        localStorage.removeItem('user')
      }
    },

    async handleLogin(credentials) {
      this.loading = true
      this.authError = null
      try {
        const response = await authService.login(credentials.email, credentials.password)
        const tokenData = response.data?.access_token

        if (!tokenData) throw new Error('No se recibió un token de autorización.')

        this.setAuth(tokenData, null) // Guardar token ANTES de llamar a /me

        const userResponse = await authService.me()
        const userData = userResponse.data
        if (!userData) throw new Error('No se recibieron datos del usuario.')

        this.setAuth(tokenData, userData) // Actualizar usuario
        await router.push({ name: 'Dashboard' })
      } catch (error) {
        this.setAuth(null, null)
        this.authError = error.response?.data?.message || 'Error de conexión.'
        throw error
      } finally {
        this.loading = false
      }
    },

    async handleRegister(credentials) {
      // (código de registro sin cambios...)
      this.loading = true
      this.authError = null
      try {
        const response = await authService.register(credentials)
        const tokenData = response.data?.access_token
        if (!tokenData) throw new Error('Registro fallido, no se recibió token.')

        this.setAuth(tokenData, null)

        const userResponse = await authService.me()
        this.setAuth(tokenData, userResponse.data)
        await router.push({ name: 'Dashboard' })
      } catch (error) {
        this.setAuth(null, null)
        throw error
      } finally {
        this.loading = false
      }
    },

    async handleLogout(callApi = true) {
      // (código de logout sin cambios...)
      this.loading = true
      const toast = useToast()
      try {
        if (callApi) {
          await authService.logout()
        }
      } catch (error) {
        // Ignorar
      } finally {
        this.setAuth(null, null)
        this.loading = false
        toast.success('Sesión cerrada exitosamente.')
        await router.push({ name: 'Login' })
      }
    },

    async fetchUser() {
      // (código de fetchUser sin cambios...)
      if (!this.token) return
      this.loading = true
      try {
        const userResponse = await authService.me()
        this.setAuth(this.token, userResponse.data)
      } catch (error) {
        if (error.response?.status === 401) {
          this.handleLogout(false)
        }
      } finally {
        this.loading = false
      }
    },

    // ==========================================================
    // NUEVA ACCIÓN: Actualizar Perfil
    // ==========================================================
    async handleProfileUpdate(profileData) {
      this.loading = true
      const toast = useToast()
      try {
        // Llama al servicio de usuario
        const response = await userService.updateProfile(profileData)

        // Actualiza el estado local y localStorage
        this.setAuth(this.token, response.data.user)

        toast.success('Perfil actualizado exitosamente.')
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
