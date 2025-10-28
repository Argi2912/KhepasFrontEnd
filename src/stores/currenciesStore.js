import { defineStore } from 'pinia'
import CurrenciesService from '../services/currenciesService'
import { Notyf } from 'notyf'

let notyf = new Notyf()

export const useCurrenciesStore = defineStore('currenciesStore', {
  state: () => ({
    currencies: [],
    loading: false,
    error: null,
    meta: null,
  }),

  actions: {
    // 🔹 Obtener lista de monedas
    async fetchList() {
      this.loading = true
      this.error = null
      try {
        const response = await CurrenciesService.list()
        this.currencies = response.data.data || response.data
      } catch (error) {
        this.error = error.message || 'Error al cargar monedas.'
        if (error.response) {
          notyf.error(error.response.data.message || 'Error al listar monedas')
        } else {
          notyf.error(error.message)
        }
      } finally {
        this.loading = false
      }
    },

    // 🔹 Crear nueva moneda
    async create(currency) {
      this.loading = true
      this.error = null
      try {
        const response = await CurrenciesService.create(currency)
        const createdCurrency = response.data.data || response.data

        // Insertar nueva moneda al inicio del array
        this.currencies.unshift(createdCurrency)

        notyf.success('Moneda creada exitosamente')
      } catch (error) {
        this.error = error.message || 'Error al crear moneda.'
        if (error.response && error.response.data && error.response.data.errors) {
          const errors = error.response.data.errors
          if (errors.name) {
            notyf.error(errors.name[0])
          } else {
            notyf.error(error.response.data.message || 'Error de validación')
          }
        } else {
          notyf.error('❌ Error al guardar la moneda')
        }
      } finally {
        this.loading = false
      }
    },

    // 🔹 Actualizar moneda
    async update(currency) {
      this.loading = true
      this.error = null
      try {
        const response = await CurrenciesService.update(currency.id, currency)
        const updatedCurrency = response.data.data || response.data

        const index = this.currencies.findIndex((c) => c.id === currency.id)
        if (index !== -1) {
          this.currencies[index] = updatedCurrency
        }

        notyf.success('Moneda actualizada exitosamente')
      } catch (error) {
        this.error = error.message || 'Error al actualizar moneda.'
        if (error.response && error.response.data && error.response.data.errors) {
          const errors = error.response.data.errors
          if (errors.name) {
            notyf.error(errors.name[0])
          } else {
            notyf.error(error.response.data.message || 'Error de validación')
          }
        } else {
          notyf.error('❌ Error al actualizar la moneda')
        }
      } finally {
        this.loading = false
      }
    },

    // 🔹 Eliminar moneda
    async delete(id) {
      this.loading = true
      this.error = null
      try {
        await CurrenciesService.delete(id)
        this.currencies = this.currencies.filter((c) => c.id !== id)
        notyf.success('Moneda eliminada exitosamente')
      } catch (error) {
        this.error = error.message || 'Error al eliminar moneda.'
        if (error.response) {
          notyf.error(error.response.data.message || 'Error al eliminar moneda')
        } else {
          notyf.error(error.message)
        }
      } finally {
        this.loading = false
      }
    },
  },
})
