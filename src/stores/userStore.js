import { defineStore } from 'pinia'
import userService from '../services/userService'
import { Notyf } from 'notyf'

let notyf = new Notyf()

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [],
    loading: false,
    error: null,
  }),

  getters: {
    activeUsers: () => state.users.filter((user) => user.isActive),
  },

  actions: {
    async fetchUsers() {
      this.loading = true
      this.error = null
      try {
        const response = await userService.getAllUsers()
        this.users = response.data
      } catch (error) {
        this.error = error.message || 'Error al cargar usuarios.'
        if (error.response) {
          notyf.error(error.response.data.message)
        } else {
          notyf.error(error.message)
        }
      } finally {
        this.loading = false
      }
    },
    async addUser(userData) {
      this.loading = true
      this.error = null
      try {
        const response = await userService.createUser(userData)
        notyf.success('Usuario creado exitosamente')
      } catch (error) {
        this.error = error.message || 'Error al crear usuario.'
        if (error.response) {
          notyf.error(error.response.data.message)
        } else {
          notyf.error(error.message)
        }
      } finally {
        this.loading = false
      }
    },
    async updateUser(id, userData) {
      this.loading = true
      this.error = null
      try {
        const response = await userService.updateUser(id, userData)
        this.users.push(response.data)
        notyf.success('Usuario actualizado exitosamente')
      } catch (error) {
        this.error = error.message || 'Error al actualizar usuario.'
        if (error.response) {
          notyf.error(error.response.data.message)
        } else {
          notyf.error(error.message)
        }
      } finally {
        this.loading = false
      }
    },
    async deleteUser(id) {
      this.loading = true
      this.error = null
      try {
        const response = await userService.deleteUser(id)
        this.users.push(response.data)
        notyf.success('Usuario eliminado exitosamente')
      } catch (error) {
        this.error = error.message || 'Error al eliminar usuario.'
        if (error.response) {
          notyf.error(error.response.data.message)
        } else {
          notyf.error(error.message)
        }
      } finally {
        this.loading = false
      }
    },
  },
})
