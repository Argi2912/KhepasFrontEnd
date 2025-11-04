// src/services/exchangeRateService.js

import apiClient from '@/utils/http' // Ajusta la ruta a tu http util

const exchangeRateService = {
  /**
   * Obtener tasas de cambio (con paginación y filtros)
   * @param {Object} params - { page: Number, date: String, from_currency_id: Number }
   */
  index: (params = { page: 1 }) => {
    return apiClient.get('/exchange-rates', {
      params: {
        page: params.page,
        // Enviar filtros solo si están definidos
        date: params.date || undefined,
        from_currency_id: params.from_currency_id || undefined,
        per_page: 20,
      },
    })
  },

  create: (data) => apiClient.post('/exchange-rates', data),
  update: (id, data) => apiClient.put(`/exchange-rates/${id}`, data),
  destroy: (id) => apiClient.delete(`/exchange-rates/${id}`),

  // --- INICIO DE LA MODIFICACIÓN ---
  /**
   * Obtiene la tasa de cambio MÁS RECIENTE para un par de divisas.
   * @param {Number} fromCurrencyId
   * @param {Number} toCurrencyId
   */
  getLatestRate: (fromCurrencyId, toCurrencyId) => {
    return apiClient.get('/exchange-rates/latest', {
      params: {
        from_currency_id: fromCurrencyId,
        to_currency_id: toCurrencyId,
      },
    })
  },
  // --- FIN DE LA MODIFICACIÓN ---
}

export default exchangeRateService
