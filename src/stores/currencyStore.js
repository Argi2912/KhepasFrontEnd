import { defineStore } from 'pinia'
import currencyService from '@/services/currencyService'

export const useCurrencyStore = defineStore('currencies', {
  state: () => ({
    currencies: [], // Lista principal para el CRUD paginado
    activeCurrencies: [], // Lista cacheada para dropdowns
    loading: false,
    error: null,
    paginationData: null,
  }),

  actions: {
    /**
     * Carga la lista paginada de divisas (para la vista CRUD).
     */
    async fetchCurrencies({ page = 1, search = '' }) {
      this.loading = true
      this.error = null

      try {
        const response = await currencyService.index(page, search)

        if (response.data && Array.isArray(response.data.data)) {
          this.currencies = response.data.data
          const { data, ...pagination } = response.data
          this.paginationData = pagination
        }
      } catch (error) {
        this.error = 'No se pudieron cargar las divisas.'
      } finally {
        this.loading = false
      }
    },

    /**
     * Carga todas las divisas activas (para dropdowns, ej. Tasas de Cambio).
     */
    async fetchActiveCurrencies() {
      if (this.activeCurrencies.length > 0) return // Usar cache

      this.loading = true
      try {
        // Llama a index con page=0
        const response = await currencyService.index(0, '')
        this.activeCurrencies = response.data
      } catch (error) {
        // No bloquear la UI si falla, pero registrar el error
        console.error('Error cargando divisas activas:', error)
      } finally {
        this.loading = false
      }
    },

    // --- CRUD ACTIONS ---
    async addCurrency(data) {
      this.loading = true
      try {
        await currencyService.create(data)
        await this.fetchCurrencies({}) // Recargar la lista
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
    async updateCurrency(data) {
      this.loading = true
      try {
        await currencyService.update(data.id, data)
        await this.fetchCurrencies({ page: this.paginationData?.meta?.current_page || 1 })
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
    async deleteCurrency(id) {
      this.loading = true
      try {
        await currencyService.destroy(id)
        await this.fetchCurrencies({ page: this.paginationData?.meta?.current_page || 1 })
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
