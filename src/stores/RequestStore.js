import { defineStore } from 'pinia'
import RequestService from '../services/RequestService'

export const useRequestStore = defineStore('requestStore', {
  state: () => ({
    requestsTypes: [],
    loading: false,
    error: null,
    meta: null,
  }),
  actions: {
    async fetchList() {
      this.loading = true
      this.error = null
      try {
        const response = await RequestService.getAll()
        this.requestsTypes = response.data
      } catch (error) {
        this.error = error.message || 'Error al cargar tipos de solicitudes.'
        if (error.response) {
          notyf.error(error.response.data.message)
        } else {
          notyf.error(error.message)
        }
      } finally {
        this.loading = false
      }
    },
    async create(requestType) {
      this.loading = true
      this.error = null
      try {
        const response = await RequestService.create(requestType)
        this.requestsTypes.push(response.data)
      } catch (error) {
        this.error = error.message || 'Error al crear tipo de solicitud.'
        if (error.response) {
          notyf.error(error.response.data.message)
        } else {
          notyf.error(error.message)
        }
      } finally {
        this.loading = false
      }
    },
    async update(requestType) {
      this.loading = true
      this.error = null
      try {
        const response = await RequestService.update(requestType)

        const index = this.requestsTypes.findIndex((rt) => rt.id === requestType.id)
        if (index !== -1) {
          this.requestsTypes.splice(index, 1, response.data)
        }
      } catch (error) {
        this.error = error.message || 'Error al actualizar tipo de solicitud.'
        if (error.response) {
          notyf.error(error.response.data.message)
        } else {
          notyf.error(error.message)
        }
      } finally {
        this.loading = false
      }
    },

    async delete(id) {
      this.loading = true
      this.error = null
      try {
        await RequestService.delete(id)

        this.requestsTypes = this.requestsTypes.filter((rt) => rt.id !== id)
      } catch (error) {
        this.error = error.message || 'Error al eliminar tipo de solicitud.'
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
