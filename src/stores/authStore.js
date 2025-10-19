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
      this.loading = true
      this.authError = null
      console.log('Iniciando handleLogin con credenciales:', {
        email: credentials.email,
        password: '[REDACTED]', // Evitar loguear contraseñas en texto plano
      })

      try {
        // Registrar el inicio de la solicitud de login
        console.log('Enviando solicitud a /auth/login')
        const startTime = performance.now()
        const tokenResponse = await authService.login(credentials.email, credentials.password)
        const endTime = performance.now()
        console.log(`Solicitud a /auth/login completada en ${(endTime - startTime).toFixed(2)}ms`)

        // Verificar y almacenar el token
        const tokenData = tokenResponse.data?.access_token
        if (!tokenData) {
          console.error('No se recibió un token en la respuesta:', tokenResponse.data)
          throw new Error('No se recibió un token de autenticación')
        }
        localStorage.setItem('token', tokenData)
        this.token = tokenData
        console.log('Token almacenado:', tokenData.substring(0, 20) + '...')

        // Obtener datos del usuario
        console.log('Enviando solicitud a /auth/me')
        const userStartTime = performance.now()
        const userResponse = await authService.getMe()
        const userEndTime = performance.now()
        console.log(
          `Solicitud a /auth/me completada en ${(userEndTime - userStartTime).toFixed(2)}ms`,
        )

        // Verificar datos del usuario
        const userData = userResponse.data
        if (!userData) {
          console.error('No se recibieron datos del usuario:', userResponse.data)
          throw new Error('No se recibieron datos del usuario')
        }

        // Actualizar estado de autenticación
        this.setAuth(tokenData, userData)
        console.log('Estado de autenticación actualizado, usuario:', userData.name)

        // Redirigir al usuario
        await router.push({ name: 'dashboard' })
        console.log('Redirigido a la ruta "users"')

        // Mostrar notificación de éxito
        if (this.user?.name) {
          notyf.success(`Bienvenido: ${this.user.name}`)
        } else {
          console.warn('No se encontró user.name para la notificación')
          notyf.success('Inicio de sesión exitoso')
        }
      } catch (error) {
        console.error('Error en handleLogin:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          code: error.code,
        })

        // Limpiar token en caso de error
        localStorage.removeItem('token')
        this.token = null

        // Manejo específico de errores
        let errorMessage
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'El servidor tardó demasiado en responder. Por favor, intenta de nuevo.'
        } else if (error.response) {
          errorMessage =
            error.response.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.'
        } else {
          errorMessage = 'Ocurrió un error inesperado. Por favor, intenta de nuevo.'
        }

        // Actualizar estado y mostrar notificación
        this.authError = errorMessage
        notyf.error(errorMessage)
      } finally {
        this.loading = false
        console.log('handleLogin finalizado, loading:', this.loading)
      }
    },
    async handleLogout() {
      this.loading = true
      this.authError = null
      try {
        const token = localStorage.getItem('token')
        console.log(
          'Attempting logout with token:',
          token ? token.substring(0, 20) + '...' : 'No token found',
        )

        if (token) {
          await authService.logout() // Attempt server-side logout if token exists
          console.log('Server-side logout successful')
        } else {
          console.warn('No token found in localStorage, proceeding with client-side logout')
        }

        // Clear state and localStorage regardless of server response
        this.token = null
        this.user = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        await router.push({ name: 'login' })
        notyf.success('Hasta luego')
      } catch (error) {
        console.error('Error in handleLogout:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          code: error.code,
        })

        // Treat 401 as non-critical for logout (user is logged out client-side)
        if (error.response?.status === 401) {
          console.warn('Token invalid or expired, proceeding with client-side logout')
          this.token = null
          this.user = null
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          await router.push({ name: 'login' })
          notyf.success('Hasta luego')
        } else {
          // Handle other errors
          this.authError = error.response?.data?.message || 'Error al cerrar sesión.'
          notyf.error(this.authError)
        }
      } finally {
        this.loading = false
        console.log('handleLogout finalizado, loading:', this.loading)
      }
    },
    async handleRegister(credentials) {
      this.loading = true
      this.authError = null
      try {
        const response = await authService.register(credentials)
        const tokenData = response.data?.access_token
        if (!tokenData) {
          console.error('No se recibió un token en la respuesta:', response.data)
          throw new Error('No se recibió un token de autenticación')
        }
        localStorage.setItem('token', tokenData)
        this.token = tokenData
        console.log('Token almacenado:', tokenData.substring(0, 20) + '...')
        await router.push({ name: 'dashboard' })
        console.log('Redirigido a la ruta "users"')
        notyf.success('Registro exitoso')
      } catch (error) {
        console.error('Error en handleRegister:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          code: error.code,
        })
        this.authError = error.response?.data?.message || 'Error al registrar.'
        notyf.error(this.authError)
      } finally {
        this.loading = false
        console.log('handleRegister finalizado, loading:', this.loading)
      }
    },
  },
})
