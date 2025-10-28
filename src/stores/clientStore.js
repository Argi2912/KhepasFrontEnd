import { defineStore } from 'pinia'
import ClientService from '../services/ClientService'
import { Notyf } from 'notyf'

let notyf = new Notyf()

export const useClientStore = defineStore('clientStore', {
  state: () => ({
    clients: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchList() {
      this.loading = true
      this.error = null
      try {
        const response = await ClientService.list()
        this.clients = response.data.data || response.data
      } catch (error) {
        this.error = error.message
        notyf.error(error.response?.data?.message || 'Error al cargar clientes')
        throw error
      } finally {
        this.loading = false
      }
    },

    async create(clientData) {
      this.loading = true
      this.error = null
      try {
        const response = await ClientService.create(clientData)
        const createdClient = response.data.data || response.data
        this.clients.unshift(createdClient)
        notyf.success('Cliente creado exitosamente')
        return createdClient // Retorna para el modal
      } catch (error) {
        this.error = error.message
        if (error.response?.data?.errors) {
          notyf.error(error.response.data.errors.name[0])
        } else {
          notyf.error(error.response?.data?.message || 'Error al crear cliente')
        }
        throw error // Relanza para el modal
      } finally {
        this.loading = false
      }
    },

    async update(clientData) {
      this.loading = true
      this.error = null
      try {
        const response = await ClientService.update(clientData.id, clientData)
        const updatedClient = response.data.data || response.data
        const index = this.clients.findIndex((c) => c.id === clientData.id)
        if (index !== -1) this.clients[index] = updatedClient
        notyf.success('Cliente actualizado exitosamente')
        return updatedClient
      } catch (error) {
        this.error = error.message
        if (error.response?.data?.errors) {
          notyf.error(error.response.data.errors.name[0])
        } else {
          notyf.error(error.response?.data?.message || 'Error al actualizar cliente')
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
        await ClientService.delete(id)
        this.clients = this.clients.filter((c) => c.id !== id)
        notyf.success('Cliente eliminado exitosamente')
      } catch (error) {
        this.error = error.message
        notyf.error(error.response?.data?.message || 'Error al eliminar cliente')
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})