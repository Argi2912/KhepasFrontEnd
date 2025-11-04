// src/services/statsService.js

import apiClient from '@/utils/http'

const statsService = {
  /**
   * Obtiene el balance general agregado (Activos - Pasivos)
   */
  getNetBalance: () => {
    return apiClient.get('/stats/balance-general')
  },

  /**
   * Obtiene el total de comisiones generadas.
   */
  getCommissionTotals: () => {
    return apiClient.get('/stats/total-commissions')
  },
}

export default statsService
