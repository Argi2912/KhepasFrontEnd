import { defineStore } from 'pinia'
import { Notyf } from 'notyf'
import exchangeService from '../services/exchangeService'

const notyf = new Notyf()

export const useexchangeStore = defineStore('exchangeStore', {
  state: () => ({
    exchangeRates: [],   // Lista de tipos de cambio
    loading: false,
    error: null,
  }),

  actions: {
    // 📋 Obtener lista de tipos de cambio
    async fetchList() {
      this.loading = true
      this.error = null
      try {
        const response = await exchangeService.list()
        
        // ==== CORRECCIÓN 1 ====
        // Accedemos a la clave "exchangeRates" que vimos en la respuesta JSON
        this.exchangeRates = response.data.exchangeRates 
        
      } catch (error) {
        this.error = error.message || 'Error al cargar los tipos de cambio.'
        if (error.response) {
          notyf.error(error.response.data.message || 'Error del servidor')
        } else {
          notyf.error(error.message)
        }
      } finally {
        this.loading = false
      }
    },

    // ➕ Crear nuevo tipo de cambio
    async create(exchangeRate) {
      this.loading = true
      this.error = null
      try {
        const response = await exchangeService.create(exchangeRate)

        // ==== CORRECCIÓN 2 ====
        // Asumimos que la API devuelve el item creado bajo la clave "exchangeRate" (singular)
        // El "|| response.data" es un respaldo por si lo devuelve sin clave.
        this.exchangeRates.push(response.data.exchangeRate || response.data)

        notyf.success('Tipo de cambio creado exitosamente ✅')
      } catch (error) {
        this.error = error.message || 'Error al crear tipo de cambio.'
        if (error.response?.data?.errors) {
          const errors = error.response.data.errors
          Object.values(errors).forEach(msg => notyf.error(msg[0]))
        } else {
          notyf.error(error.response?.data?.message || 'Error inesperado')
        }
      } finally {
        this.loading = false
      }
    },

    // ✏️ Actualizar tipo de cambio
    async update(exchangeRate) {
      this.loading = true
      this.error = null
      try {
        const response = await exchangeService.update(exchangeRate.id, exchangeRate)
        const index = this.exchangeRates.findIndex(e => e.id === exchangeRate.id)
        if (index !== -1) {

          // ==== CORRECCIÓN 3 ====
          // Igual que en "create", asumimos que la API devuelve el item actualizado
          // bajo la clave "exchangeRate" (singular)
          this.exchangeRates[index] = response.data.exchangeRate || response.data
        }
        notyf.success('Tipo de cambio actualizado correctamente ✏️')
      } catch (error) {
        this.error = error.message || 'Error al actualizar tipo de cambio.'
        if (error.response?.data?.errors) {
          const errors = error.response.data.errors
          Object.values(errors).forEach(msg => notyf.error(msg[0]))
        } else {
          notyf.error(error.response?.data?.message || 'Error del servidor')
        }
      } finally {
        this.loading = false
      }
    },

    // 🗑️ Eliminar tipo de cambio
    async delete(id) {
      this.loading = true
      this.error = null
      try {
        await exchangeService.delete(id)
        this.exchangeRates = this.exchangeRates.filter(e => e.id !== id)
        notyf.success('Tipo de cambio eliminado correctamente 🗑️')
      } catch (error) {
        this.error = error.message || 'Error al eliminar tipo de cambio.'
        if (error.response) {
          notyf.error(error.response.data.message || 'Error del servidor')
        } else {
          notyf.error(error.message)
        }
      } finally {
        this.loading = false
      }
    },
  },
})