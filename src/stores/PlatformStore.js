import { defineStore } from 'pinia'
// Asegúrate de que la ruta a tu servicio sea correcta
import PlatformService from '../services/PlatformService' 
import { Notyf } from 'notyf'

let notyf = new Notyf()

export const usePlatformStore = defineStore('platformStore', {
  // 🔹 STATE
  state: () => ({
    platforms: [],
    currentPlatform: null, // Para vistas de detalle o edición
    loading: false,
    error: null,
  }),

  // 🔹 ACTIONS
  actions: {
    /**
     * Obtener lista de plataformas
     */
    async fetchList() {
      this.loading = true
      this.error = null
      try {
        const response = await PlatformService.list()
        // Manejamos data anidada (ej. paginación) o plana
        this.platforms = response.data.data || response.data
      } catch (error) {
        this.error = error.message || 'Error al cargar plataformas.'
        if (error.response) {
          notyf.error(error.response.data.message || 'Error al listar plataformas')
        } else {
          notyf.error(error.message)
        }
      } finally {
        this.loading = false
      }
    },

    /**
     * Obtener una plataforma por ID
     */
    async fetchOne(id) {
      this.loading = true
      this.error = null
      this.currentPlatform = null // Reiniciar
      try {
        const response = await PlatformService.get(id)
        this.currentPlatform = response.data.data || response.data
      } catch (error) {
        this.error = error.message || 'Error al buscar la plataforma.'
        if (error.response) {
          notyf.error(error.response.data.message || 'Error al buscar plataforma')
        } else {
          notyf.error(error.message)
        }
      } finally {
        this.loading = false
      }
    },

    /**
     * Crear nueva plataforma
     */
    async create(platformData) {
      this.loading = true
      this.error = null
      try {
        const response = await PlatformService.create(platformData)
        const createdPlatform = response.data.data || response.data

        // Insertar nueva plataforma al inicio del array
        this.platforms.unshift(createdPlatform)

        notyf.success('Plataforma creada exitosamente')
      } catch (error) {
        this.error = error.message || 'Error al crear plataforma.'
        // Manejo de errores de validación de Laravel
        if (error.response && error.response.data && error.response.data.errors) {
          const errors = error.response.data.errors
          if (errors.name) { // Asumimos un campo 'name'
            notyf.error(errors.name[0])
          } else {
            notyf.error(error.response.data.message || 'Error de validación')
          }
        } else {
          notyf.error('❌ Error al guardar la plataforma')
        }
      } finally {
        this.loading = false
      }
    },

    /**
     * Actualizar plataforma
     */
    async update(platformData) {
      this.loading = true
      this.error = null
      try {
        const response = await PlatformService.update(platformData.id, platformData)
        const updatedPlatform = response.data.data || response.data

        // Actualizar la lista
        const index = this.platforms.findIndex((p) => p.id === platformData.id)
        if (index !== -1) {
          this.platforms[index] = updatedPlatform
        }
        
        // Actualizar la plataforma actual si se está viendo
        if (this.currentPlatform && this.currentPlatform.id === platformData.id) {
          this.currentPlatform = updatedPlatform
        }

        notyf.success('Plataforma actualizada exitosamente')
      } catch (error) {
        this.error = error.message || 'Error al actualizar plataforma.'
        // Manejo de errores de validación de Laravel
        if (error.response && error.response.data && error.response.data.errors) {
          const errors = error.response.data.errors
          if (errors.name) {
            notyf.error(errors.name[0])
          } else {
            notyf.error(error.response.data.message || 'Error de validación')
          }
        } else {
          notyf.error('❌ Error al actualizar la plataforma')
        }
      } finally {
        this.loading = false
      }
    },

    /**
     * Eliminar plataforma
     */
    async delete(id) {
      this.loading = true
      this.error = null
      try {
        await PlatformService.delete(id)
        this.platforms = this.platforms.filter((p) => p.id !== id)
        notyf.success('Plataforma eliminada exitosamente')
      } catch (error) {
        this.error = error.message || 'Error al eliminar plataforma.'
        if (error.response) {
          notyf.error(error.response.data.message || 'Error al eliminar plataforma')
        } else {
          notyf.error(error.message)
        }
      } finally {
        this.loading = false
      }
    },
  },
})