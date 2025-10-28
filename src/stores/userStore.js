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
    // CORRECCIÓN: El 'state' debe pasarse como argumento al getter
    activeUsers: (state) => state.users.filter((user) => user.isActive),
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
        
        // CORRECCIÓN: 
        // Agregamos el nuevo usuario (devuelto por la API) al array 'users'.
        this.users.push(response.data) 
        
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
        
        // CORRECCIÓN: 
        // 1. Encontramos el índice (la posición) del usuario antiguo.
        const index = this.users.findIndex(user => user.id === id)
        
        // 2. Si lo encontramos, lo reemplazamos con los datos nuevos.
        if (index !== -1) {
          this.users[index] = response.data 
        }

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
        await userService.deleteUser(id) // La API borra el registro

        // CORRECCIÓN: 
        // Filtramos el array 'users', creando uno nuevo
        // que contenga todos los usuarios MENOS el que tiene el 'id' eliminado.
        this.users = this.users.filter(user => user.id !== id) 
        
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