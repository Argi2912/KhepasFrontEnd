// src/stores/authStore.js

import { defineStore } from 'pinia'
import authService from '@/services/authService'
import router from '@/router'
import { useToast } from 'vue-toastification'

export const useAuthStore = defineStore('auth', {
  // ==========================================================
  // 1. STATE
  // ==========================================================
  state: () => ({
    token: localStorage.getItem('jwt_token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    loading: false,
    authError: null,
  }),

  // ==========================================================
  // 2. GETTERS
  // ==========================================================
  getters: {
    isAuthenticated: (state) => !!state.token,
    fullName: (state) =>
      state.user ? `${state.user.first_name} ${state.user.last_name}` : 'Invitado',
    primaryRole: (state) => state.user?.roles?.[0]?.name || 'Client',
  },

  // ==========================================================
  // 3. ACTIONS
  // ==========================================================
  actions: {
    setAuth(token, userData) {
      this.token = token
      this.user = userData

      if (token) {
        localStorage.setItem('jwt_token', token)
        localStorage.setItem('user', JSON.stringify(userData))
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

        // FetchUser para obtener los datos completos con roles
        const userResponse = await authService.me()
        const userData = userResponse.data

        this.setAuth(tokenData, userData)
        await router.push({ name: 'Dashboard' })
      } catch (error) {
        this.setAuth(null, null)
        throw error
      } finally {
        this.loading = false
      }
    },

    async handleRegister(credentials) {
      this.loading = true
      this.authError = null

      try {
        const response = await authService.register(credentials)
        const tokenData = response.data?.access_token

        // Si el backend hace login automático
        if (tokenData) {
          const userResponse = await authService.me()
          this.setAuth(tokenData, userResponse.data)
          await router.push({ name: 'Dashboard' })
        } else {
          // Si solo registra, redirigir al login
          useToast().info('Registro exitoso. Por favor, inicia sesión.')
          await router.push({ name: 'Login' })
        }
      } catch (error) {
        this.setAuth(null, null)
        throw error
      } finally {
        this.loading = false
      }
    },

    async handleLogout(callApi = true) {
      this.loading = true
      const toast = useToast()

      try {
        if (callApi) {
          await authService.logout()
        }
      } catch (error) {
        // No importa si falla el endpoint, el cliente debe limpiarse
      } finally {
        this.setAuth(null, null)
        this.loading = false
        toast.success('Sesión cerrada exitosamente.')
        await router.push({ name: 'Login' })
      }
    },

    async fetchUser() {
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
  },
})
