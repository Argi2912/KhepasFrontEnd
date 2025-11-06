// src/stores/transactionStore.js

import { defineStore } from 'pinia'
import transactionService from '@/services/transactionService'
import { useCashStore } from './cashStore' // Importar cashStore

export const useTransactionStore = defineStore('transactions', {
  state: () => ({
    transactions: [],
    loading: false,
    error: null,
    paginationData: null,
    viewedTransaction: null,
    currentExchangeRate: null, // --- NUEVO ESTADO PARA LA TASA ---
  }),

  actions: {
    // ... (fetchTransactions, fetchTransactionDetails, ...etc)

    // ==========================================================
    // LECTURA
    // ==========================================================
    async fetchTransactions({ page = 1, search = '' }) {
      this.loading = true
      this.error = null

      try {
        const response = await transactionService.index(page, search)

        if (response.data && Array.isArray(response.data.data)) {
          this.transactions = response.data.data
          const { data, ...pagination } = response.data
          this.paginationData = pagination
        } else {
          this.transactions = []
        }
      } catch (error) {
        this.error = 'No se pudieron cargar las transacciones.'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchTransactionDetails(transactionId) {
      this.loading = true
      this.error = null
      this.viewedTransaction = null
      console.log(`[Store DEBUG] 1. Buscando TX ID: ${transactionId}`)
      try {
        const response = await transactionService.show(transactionId)
        console.log('[Store DEBUG] 2. Respuesta de API recibida:', response.data)

        if (response.data && response.data.details && response.data.details.length > 0) {
          this.viewedTransaction = response.data
          console.log(
            '[Store DEBUG] 3. Transacción cargada con éxito. Detalles count:',
            response.data.details.length,
          )
        } else {
          this.error = 'La transacción no contiene los detalles contables requeridos.'
          console.error(
            '[Store DEBUG] 3. ERROR: La respuesta de API no tiene los detalles contables.',
          )
          throw new Error(this.error) // Forzar manejo de error
        }

        return this.viewedTransaction
      } catch (error) {
        console.error(
          '[Store DEBUG] 4. ERROR FATAL en fetchTransactionDetails:',
          error.response?.data || error.message,
        )
        this.error =
          'Fallo al cargar los detalles de la transacción. Revise la consola del servidor/navegador.'
        throw error // Propagar el error
      } finally {
        console.log('[Store DEBUG] 5. Finalizando carga. Loading = false.')
        this.loading = false
      }
    },

    // ... (addAccountPayable, addAccountReceivable, addDirectIngress, addDirectEgress) ...
    async addAccountPayable(data) {
      this.loading = true
      try {
        const response = await transactionService.registerCXP(data)
        await this.fetchTransactions({})
        return response.data
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
    async addAccountReceivable(data) {
      this.loading = true
      try {
        const response = await transactionService.registerCXC(data)
        await this.fetchTransactions({})
        return response.data
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
    async addDirectIngress(data) {
      this.loading = true
      try {
        const response = await transactionService.registerIngress(data)
        await this.fetchTransactions({})
        return response.data
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
    async addDirectEgress(data) {
      this.loading = true
      try {
        const response = await transactionService.registerEgress(data)
        await this.fetchTransactions({})
        return response.data
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    // ... (processPaymentPayable, processPaymentReceivable) ...
    async processPaymentPayable(data) {
      this.loading = true
      try {
        const response = await transactionService.payDebt(data)
        await this.fetchTransactions({})
        return response.data
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
    async processPaymentReceivable(data) {
      this.loading = true
      try {
        const response = await transactionService.receivePayment(data)
        await this.fetchTransactions({})
        return response.data
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    // ==========================================================
    // 4. INTERCAMBIO DE DIVISAS
    // ==========================================================
    async executeExchange(data) {
      this.loading = true
      try {
        const response = await transactionService.executeExchange(data)
        await this.fetchTransactions({}) // Recargar la lista
        return response.data
      } catch (error) {
        throw error // Propagar para que el modal lo maneje
      } finally {
        this.loading = false
      }
    },

    // --- NUEVA ACCIÓN ---
    async fetchLatestRate(cash_given_id, cash_received_id, date) {
      this.loading = true
      this.currentExchangeRate = null
      const cashStore = useCashStore()

      try {
        // Obtener los IDs de las divisas desde el cashStore
        const cashGiven = cashStore.cashes.find((c) => c.id === cash_given_id)
        const cashReceived = cashStore.cashes.find((c) => c.id === cash_received_id)

        if (!cashGiven?.currency_id || !cashReceived?.currency_id) {
          throw new Error('Las cajas seleccionadas no tienen divisas asignadas.')
        }

        const response = await transactionService.getLatestRate(
          cashGiven.currency_id,
          cashReceived.currency_id,
          date,
        )
        this.currentExchangeRate = response.data
        return this.currentExchangeRate
      } catch (error) {
        this.currentExchangeRate = null // Asegurar que esté nulo si falla
        throw error // Propagar para que el modal lo muestre
      } finally {
        this.loading = false
      }
    },
  },
})
