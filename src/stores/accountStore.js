// src/stores/accountStore.js
import { defineStore } from 'pinia'
import accountService from '@/services/accountService'

export const useAccountStore = defineStore('accounts', {
  state: () => ({
    cashAccounts: [], // Solo guardamos las cuentas de tipo CASH
    loading: false,
  }),
  actions: {
    async fetchCashAccounts() {
      if (this.cashAccounts.length > 0) return // Cache

      this.loading = true
      try {
        const response = await accountService.index()
        this.cashAccounts = response.data
      } catch (error) {
        console.error('Error cargando cuentas (CASH):', error)
      } finally {
        this.loading = false
      }
    },
    async fetchAllAccountsForDropdowns() {
      this.loading = true
      try {
        // Llama a index con page=0, esperando el array completo
        const response = await accountService.index(0, '')

        if (Array.isArray(response.data)) {
          // Sobrescribe la lista principal con la lista completa (no paginada).
          this.accounts = response.data
        } else {
          this.accounts = [] // En caso de respuesta inesperada
        }
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
