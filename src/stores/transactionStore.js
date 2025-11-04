// src/stores/transactionStore.js

import { defineStore } from 'pinia'
import transactionService from '@/services/transactionService'

export const useTransactionStore = defineStore('transactions', {
  state: () => ({
    transactions: [],
    loading: false,
    error: null,
    paginationData: null,
    viewedTransaction: null,
  }),

  actions: {
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
        // Propagar el error para que las vistas puedan manejarlo
        throw error
      } finally {
        this.loading = false
      }
    },

    // ==========================================================
    // 1. REGISTRO DE CUENTAS PENDIENTES (PENDING)
    // ==========================================================

    /**
     * Registra una Cuenta por Pagar (CXP). Estado: PENDING.
     */
    async addAccountPayable(data) {
      this.loading = true
      try {
        const response = await transactionService.registerCXP(data)
        await this.fetchTransactions({}) // Recargar la lista para mostrar la nueva CXP (PENDING)
        return response.data
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Registra una Cuenta por Cobrar (CXC). Estado: PENDING.
     */
    async addAccountReceivable(data) {
      this.loading = true
      try {
        const response = await transactionService.registerCXC(data)
        await this.fetchTransactions({}) // Recargar la lista para mostrar la nueva CXC (PENDING)
        return response.data
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    // ==========================================================
    // 2. REGISTRO DIRECTO (COMPLETED - MODIFICA BALANCE DE CAJA)
    // ==========================================================

    /**
     * Registra un Ingreso Directo. Aumenta el cash.balance.
     */
    async addDirectIngress(data) {
      this.loading = true
      try {
        const response = await transactionService.registerIngress(data)
        // ATENCIÓN: Es crucial recargar las cajas también, ya que el balance cambió.
        // Se asume que el store de Cajas se encargará de esto si se implementa.
        await this.fetchTransactions({})
        return response.data
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Registra un Egreso Directo. Disminuye el cash.balance.
     */
    async addDirectEgress(data) {
      this.loading = true
      try {
        const response = await transactionService.registerEgress(data)
        // Es crucial recargar las cajas también, ya que el balance cambió.
        await this.fetchTransactions({})
        return response.data
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    // ==========================================================
    // 3. SALDAR CUENTAS (PAGOS/COBROS - MODIFICA BALANCE DE CAJA)
    // ==========================================================

    /**
     * Procesa el pago de una CXP PENDIENTE.
     * Crea una nueva transacción de pago y marca la CXP original como COMPLETED.
     */
    async processPaymentPayable(data) {
      this.loading = true
      try {
        const response = await transactionService.payDebt(data)
        // Recargar la lista para mostrar la nueva transacción y el estado actualizado de la CXP
        await this.fetchTransactions({})
        return response.data
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Procesa el cobro de una CXC PENDIENTE.
     * Crea una nueva transacción de cobro y marca la CXC original como COMPLETED.
     */
    async processPaymentReceivable(data) {
      this.loading = true
      try {
        const response = await transactionService.receivePayment(data)
        // Recargar la lista
        await this.fetchTransactions({})
        return response.data
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchTransactionDetails(id) {
      console.log(`[Store DEBUG] 1. Iniciando fetch de transacción ID: ${id}`)
      this.loading = true
      this.viewedTransaction = null
      try {
        const response = await transactionService.show(id)

        console.log('[Store DEBUG] 2. Respuesta de API recibida. Datos:', response.data)

        // VERIFICACIÓN CRÍTICA: Asegurar que los detalles vengan cargados
        if (response.data && response.data.details && Array.isArray(response.data.details)) {
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
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
