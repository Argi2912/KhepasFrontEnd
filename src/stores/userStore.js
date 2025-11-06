// src/stores/userStore.js
import { defineStore } from 'pinia'
import userService from '@/services/userService'
import { useToast } from 'vue-toastification'
import { useAuthStore } from './authStore' // Importar authStore

export const useUserStore = defineStore('users', {
  state: () => ({
    users: [], // Lista para el CRUD (paginado)
    allUsers: [], // Lista para dropdowns (cache)
    loading: false,
    error: null,
    paginationData: null,

    // Getter para obtener el usuario logueado desde authStore
    get user() {
      const auth = useAuthStore()
      return auth.user
    },
  }),

  actions: {
    /**
     * CORREGIDO: Acepta un objeto de parámetros genérico
     * @param {Object} params - { page: Number, search: String, role: String, per_page: Number }
     */
    async fetchUsers(params = {}) {
      this.loading = true
      this.error = null

      try {
        // Pasamos todos los params al servicio
        const response = await userService.index(params)

        // Si la respuesta es paginada (viene del CRUD de usuarios)
        if (response.data && Array.isArray(response.data.data)) {
          this.users = response.data.data
          const { data, ...pagination } = response.data
          this.paginationData = pagination
          return this.users // Devuelve los datos paginados
        }

        // Si la respuesta NO es paginada (ej. per_page: 999 para dropdowns)
        else if (response.data && Array.isArray(response.data)) {
          // Guardamos en un caché diferente para no afectar la tabla paginada
          this.allUsers = response.data
          return this.allUsers // Devuelve todos los datos
        } else {
          // Fallback por si la respuesta es inesperada
          console.warn('Respuesta inesperada de fetchUsers:', response.data)
          this.users = []
          this.allUsers = []
          return []
        }
      } catch (error) {
        this.error = 'No se pudieron cargar los usuarios.'
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Añadir un nuevo usuario.
     */
    async addUser(userData) {
      this.loading = true
      const toast = useToast()
      try {
        await userService.create(userData)
        toast.success('Usuario creado exitosamente.')
        // Recargar la lista (vuelve a la página 1)
        await this.fetchUsers({})
      } catch (error) {
        throw error // Propagar el error para que el modal sepa si cerrar
      } finally {
        this.loading = false
      }
    },

    /**
     * Actualizar un usuario existente.
     */
    async updateUser(userData) {
      this.loading = true
      const toast = useToast()
      try {
        await userService.update(userData.id, userData)
        toast.success('Usuario actualizado exitosamente.')
        // Recargar la lista en la página actual
        await this.fetchUsers({
          page: this.paginationData?.meta?.current_page || 1,
        })
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteUser(userId) {
      this.loading = true
      try {
        await userService.destroy(userId) // Asumo que tienes userService.destroy(userId)
        // Recargar la lista en la página actual
        await this.fetchUsers({
          page: this.paginationData?.meta?.current_page || 1,
        })
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
