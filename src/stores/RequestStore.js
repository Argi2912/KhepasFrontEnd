import { defineStore } from 'pinia'
import RequestService from '../services/RequestService'
import { Notyf } from 'notyf'

let notyf = new Notyf()

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
        const response = await RequestService.list()
        this.requestsTypes = response.data.data
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
        
        // 👇 CORRECCIÓN: Usamos unshift() para AÑADIR el nuevo
        const createdRequestType = response.data.data || response.data
        this.requestsTypes.unshift(createdRequestType)
        
        notyf.success('Tipo de solicitud creado exitosamente')

        // 👇 ¡LA LÍNEA QUE FALTA!
        // Retornamos el objeto para que el formulario del wizard lo reciba
        return createdRequestType

      } catch (error) {
        this.error = error.message || 'Error al crear tipo de solicitud.'
        if (error.response && error.response.data && error.response.data.errors) {
          const errors = error.response.data.errors
          if (errors.name) {
            notyf.error(errors.name[0])
          } else {
            notyf.error(error.response.data.message || 'Error de validación')
          }
        } else {
          notyf.error('❌ Error al guardar la solicitud')
        }
        
        // 👇 RECUERDA relanzar el error
        throw error
        
      } finally {
        this.loading = false
      }
    },
    async update(requestType) {
      this.loading = true
      this.error = null
      try {
        const response = await RequestService.update(requestType.id, requestType)
        const index = this.requestsTypes.findIndex((rt) => rt.id === requestType.id)
        if (index !== -1) {
          this.requestsTypes[index] = response.data.data
        }
        notyf.success('Tipo de solicitud actualizado exitosamente')
      } catch (error) {
        this.error = error.message || 'Error al actualizar tipo de solicitud.'
        if (error.response && error.response.data && error.response.data.errors) {
          // Si hay errores de validación
          const errors = error.response.data.errors
          if (errors.name) {
            // Muestra el primer error del campo 'name'
            notyf.error(errors.name[0])
          } else {
            // Muestra el mensaje principal si no es un error de 'name'
            notyf.error(error.response.data.message || 'Error de validación')
          }
        } else {
          // Error genérico si no es un error de validación
          notyf.error('❌ Error al guardar la solicitud')
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
