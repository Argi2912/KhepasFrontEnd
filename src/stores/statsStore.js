// src/stores/statsStore.js (Fragmento de State y Actions)

import { defineStore } from 'pinia'
import statsService from '@/services/statsService'
import { useCashStore } from '@/stores/cashStore'

export const useStatsStore = defineStore('stats', {
  state: () => ({
    loading: false,
    netBalance: 0,
    totalCommissions: 0,
    // FIX: Añadir métricas detalladas
    totalCash: 0,
    totalReceivable: 0,
    totalPayable: 0,
    kpiError: null,
  }),

  actions: {
    async fetchDashboardData() {
      this.loading = true
      this.kpiError = null

      try {
        // 1. Cargar Balance General y Comisiones en paralelo
        const [balanceResponse, commissionResponse] = await Promise.all([
          statsService.getNetBalance(), // Llamará a tu método getNetBalance()
          statsService.getCommissionTotals(),
        ])

        // FIX: Asignar todas las métricas de la respuesta de getNetBalance
        const metrics = balanceResponse.data.metrics
        this.netBalance = metrics.net_balance
        this.totalCash = metrics.total_cash
        this.totalReceivable = metrics.total_receivable
        this.totalPayable = metrics.total_payable

        this.totalCommissions = commissionResponse.data.total_commissions

        // 2. Cargar las cajas para la sección "Balance por Caja"
        const cashStore = useCashStore()
        await cashStore.fetchCashes({ per_page: 100 })
      } catch (error) {
        this.kpiError = 'Error al cargar los datos del dashboard.'
        console.error('Error fetching dashboard data:', error)
      } finally {
        this.loading = false
      }
    },
  },
})
