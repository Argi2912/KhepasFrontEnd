import { defineStore } from 'pinia'
import userService from '@/services/userService'
import { useToast } from 'vue-toastification'

export const useUserStore = defineStore('users', {
  state: () => ({
    users: [],
    loading: false,
    error: null,
    paginationData: null,
  }),

  actions: {
    /**
     * Buscar y paginar usuarios.
     * @param {Object} params - { page: Number, search: String }
     */
    async fetchUsers({ page = 1, search = '' }) {
      this.loading = true
      this.error = null
      this.users = []

      try {
        const response = await userService.index(page, search)

        if (response.data && Array.isArray(response.data.data)) {
          this.users = response.data.data
          // Guardar meta y links para la paginación
          const { data, ...pagination } = response.data
          this.paginationData = pagination
        } else {
          this.users = response.data // Fallback
        }
      } catch (error) {
        this.error = 'No se pudieron cargar los usuarios.'
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
