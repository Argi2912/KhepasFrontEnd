import { defineStore } from 'pinia'
import AdminService from '../services/AdminService' // (El AdminService que ya tenías está bien)
import { Notyf } from 'notyf'

let notyf = new Notyf()

export const useAdminStore = defineStore('adminStore', {
  state: () => ({
    admins: [], // Lista de admins (fuentes)
    loading: false,
    error: null,
  }),

  actions: {
    async fetchList() {
      this.loading = true
      this.error = null
      try {
        const response = await AdminService.list()
        this.admins = response.data.data || response.data
      } catch (error) {
        this.error = error.message
        notyf.error(error.response?.data?.message || 'Error al cargar admins')
        throw error
      } finally {
        this.loading = false
      }
    },

    async create(adminData) {
      this.loading = true
      this.error = null
      try {
        const response = await AdminService.create(adminData)
        const createdAdmin = response.data.data || response.data
        this.admins.unshift(createdAdmin)
        notyf.success('Admin creado exitosamente')
        return createdAdmin // Retorna para el modal
      } catch (error) {
        this.error = error.message
        if (error.response?.data?.errors) {
          notyf.error(error.response.data.errors.name[0]) // Solo valida 'name'
        } else {
          notyf.error(error.response?.data?.message || 'Error al crear admin')
        }
        throw error // Relanza para el modal
      } finally {
        this.loading = false
      }
    },

    async update(adminData) {
      this.loading = true
      this.error = null
      try {
        const response = await AdminService.update(adminData.id, adminData)
        const updatedAdmin = response.data.data || response.data
        const index = this.admins.findIndex((a) => a.id === adminData.id)
        if (index !== -1) this.admins[index] = updatedAdmin
        notyf.success('Admin actualizado exitosamente')
        return updatedAdmin
      } catch (error) {
        this.error = error.message
        if (error.response?.data?.errors) {
          notyf.error(error.response.data.errors.name[0])
        } else {
          notyf.error(error.response?.data?.message || 'Error al actualizar admin')
        }
        throw error
      } finally {
        this.loading = false
      }
    },

    async delete(id) {
      this.loading = true
      this.error = null
      try {
        await AdminService.delete(id)
        this.admins = this.admins.filter((a) => a.id !== id)
        notyf.success('Admin eliminado exitosamente')
      } catch (error) {
        this.error = error.message
        notyf.error(error.response?.data?.message || 'Error al eliminar admin')
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})