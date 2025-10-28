import { defineStore } from 'pinia'
import SolicitudService from '../services/SolicitudService'
import { Notyf } from 'notyf'

let notyf = new Notyf()

export const useSolicitudStore = defineStore('solicitudStore', {
  state: () => ({
    solicitudes: [], // Lista de solicitudes ya guardadas
    loading: false,
    error: null,
  }),

  actions: {
    /**
     * Carga la lista de solicitudes ya creadas
     */
    async fetchList() {
      this.loading = true
      this.error = null
      try {
        const response = await SolicitudService.list()
        this.solicitudes = response.data.data || response.data
      } catch (error) {
        this.error = error.message
        notyf.error(error.response?.data?.message || 'Error al cargar solicitudes')
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Acción para guardar el formulario del wizard
     */
    async createSolicitud(formData) {
      this.loading = true
      this.error = null
      try {
        const response = await SolicitudService.create(formData)
        
        // Añadimos la nueva solicitud a la lista
        this.solicitudes.unshift(response.data.data || response.data)
        
        notyf.success('Solicitud registrada con éxito')
        return response.data
        
      } catch (error) {
        this.error = error.message
        if (error.response && error.response.data && error.response.data.errors) {
            // Maneja múltiples errores de validación
            const errors = error.response.data.errors;
            Object.values(errors).forEach(errorArray => {
                notyf.error(errorArray[0]); // Muestra el primer error de cada campo
            });
        } else {
            notyf.error(error.response?.data?.message || 'Error al guardar la solicitud')
        }
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})