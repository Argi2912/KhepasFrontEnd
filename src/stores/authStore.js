import { defineStore } from 'pinia'
import authService from '../services/authService'
import router from '../router'
import { Notyf } from 'notyf'

let notyf = new Notyf()

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    loading: false,
    authError: null,
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
  },
  actions: {
    setAuth(token, user) {
      this.token = token
      this.user = user
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    },
    async handleLogin(credentials) {
      console.log(credentials.email, credentials.password)
      this.loading = true
      this.authError = null
      try {
        const tokenResponse = await authService.login(credentials.email, credentials.password)

        const tokenData = tokenResponse.data.access_token

        localStorage.setItem('token', tokenData)
        this.token = tokenData

        const userResponse = await authService.getMe()

        const userData = userResponse.data

        this.setAuth(tokenData, userData)
        router.push({ name: 'users' })
        notyf.success(`Bienvenido: ${this.user.name}`)
      } catch (error) {
        localStorage.removeItem('token')
        this.token = null
        this.authError = error.message || 'Error al iniciar sesión.'
        if (error.response) {
          notyf.error(error.response.data.message)
        }
      } finally {
        this.loading = false
      }
    },
    async handleLogout() {
      this.loading = true
      this.authError = null
      try {
        await authService.logout()
        this.token = null
        this.user = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push({ name: 'login' })
        notyf.success('Hasta luego')
      } catch (error) {
        this.authError = error.message || 'Error al cerrar sesión.'
        if (error.response) {
          notyf.error(error.response.data.message)
        }
      } finally {
        this.loading = false
      }
    },
  },
})
