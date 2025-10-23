import { defineStore } from 'pinia'
import permissionsService from '../services/permissionsService'
import { Notyf } from 'notyf'

let notyf = new Notyf()

export const useRolesStore = defineStore('roles', {
  state: () => ({
    permissions: [],
    roles: [],
    loading: false,
    error: null,
  }),
  getters: {
    allPermissions: (state) => state.permissions,
  },
  actions: {
    async fetchPermissions() {
      this.loading = true
      this.error = null
      try {
        const response = await permissionsService.getAllPermissions()
        this.permissions = response.data.permissions
      } catch (error) {
        this.error = error.message || 'Error al cargar permisos.'
        if (error.response) {
          notyf.error(error.response.data.message)
        } else {
          notyf.error(error.message)
        }
      } finally {
        this.loading = false
      }
    },
    async fetchRoles() {
      this.loading = true
      this.error = null
      try {
        const response = await permissionsService.getAllPermissions()
        this.roles = response.data.roles
      } catch (error) {
        this.error = error.message || 'Error al cargar roles.'
        if (error.response) {
          notyf.error(error.response.data.message)
        } else {
          notyf.error(error.message)
        }
      } finally {
        this.loading = false
      }
    },
    async addRole(roleData) {
      this.loading = true
      this.error = null
      try {
        const response = await permissionsService.createRole(roleData)
        this.roles.push(response.data)
        notyf.success('Rol creado exitosamente')
      } catch (error) {
        this.error = error.message || 'Error al crear rol.'
        if (error.response) {
          notyf.error(error.response.data.message)
        } else {
          notyf.error(error.message)
        }
      } finally {
        this.loading = false
      }
    },
    async updateRole(id, roleData) {
      this.loading = true
      this.error = null
      try {
        const response = await permissionsService.updateRole(id, roleData)
        this.roles.push(response.data)
        notyf.success('Rol actualizado exitosamente')
      } catch (error) {
        this.error = error.message || 'Error al actualizar rol.'
        if (error.response) {
          notyf.error(error.response.data.message)
        } else {
          notyf.error(error.message)
        }
      } finally {
        this.loading = false
      }
    },
    async deleteRole(id) {
      this.loading = true
      this.error = null
      try {
        const response = await permissionsService.deleteRole(id)
        this.roles.push(response.data)
        notyf.success('Rol eliminado exitosamente')
      } catch (error) {
        this.error = error.message || 'Error al eliminar rol.'
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
