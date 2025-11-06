// src/stores/exchangeRateStore.js

import { defineStore } from 'pinia'
import exchangeRateService from '@/services/exchangeRateService'

export const useExchangeRateStore = defineStore('exchangeRates', {
  state: () => ({
    rates: [],
    loading: false,
    error: null,
    paginationData: null,
    latestRate: null, // <-- Estado para la tasa única
  }),

  actions: {
    // ... (tus acciones CRUD: fetchExchangeRates, addExchangeRate, etc. se quedan igual) ...

    /**
     * Carga la lista paginada de tasas (para la vista CRUD).
     */
    async fetchExchangeRates(params = { page: 1 }) {
      this.loading = true
      this.error = null

      try {
        const response = await exchangeRateService.index(params)

        if (response.data && Array.isArray(response.data.data)) {
          this.rates = response.data.data
          const { data, ...pagination } = response.data
          this.paginationData = pagination
        }
      } catch (error) {
        this.error = 'No se pudieron cargar las tasas de cambio.'
      } finally {
        this.loading = false
      }
    },

    // --- CRUD ACTIONS ---
    async addExchangeRate(data) {
      this.loading = true
      try {
        await exchangeRateService.create(data)
        await this.fetchExchangeRates({}) // Recargar la lista
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
    async updateExchangeRate(data) {
      this.loading = true
      try {
        await exchangeRateService.update(data.id, data)
        await this.fetchExchangeRates({ page: this.paginationData?.meta?.current_page || 1 })
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
    async deleteExchangeRate(id) {
      this.loading = true
      try {
        await exchangeRateService.destroy(id)
        await this.fetchExchangeRates({ page: this.paginationData?.meta?.current_page || 1 })
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    // --- INICIO DE LA CORRECCIÓN ---
    async fetchLatestRate(fromCurrencyId, toCurrencyId, date) {
      // <-- 1. ACEPTAR FECHA
      if (!fromCurrencyId || !toCurrencyId || !date) {
        // <-- 2. VALIDAR FECHA
        this.latestRate = null
        this.error = null // Limpiar error si faltan datos
        return
      }

      this.loading = true
      this.latestRate = null
      this.error = null

      try {
        // 3. PASAR FECHA AL SERVICIO
        const response = await exchangeRateService.getLatestRate(fromCurrencyId, toCurrencyId, date)

        this.latestRate = response.data
        return response.data
      } catch (error) {
        this.error = 'No se pudo cargar la tasa de cambio.'
        console.error(this.error, error.response?.data)
        this.latestRate = null
        return null
      } finally {
        this.loading = false
      }
    },
    // --- FIN DE LA CORRECCIÓN ---

    /**
     * Limpia la tasa cargada.
     */
    clearRate() {
      this.latestRate = null
      this.error = null
    },
  },
})
