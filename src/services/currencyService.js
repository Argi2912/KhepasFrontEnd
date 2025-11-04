import apiClient from '@/utils/http' // Ajusta la ruta a tu apiClient

const currencyService = {
  /**
   * Obtener divisas (paginadas para CRUD, o todas para dropdown)
   */
  index: (page = 0, search = '') => {
    return apiClient.get('/currencies', {
      params: {
        page: page > 0 ? page : undefined, // No enviar 'page=0'
        search: search || undefined,
        per_page: page > 0 ? 20 : undefined,
      },
    })
  },

  create: (data) => apiClient.post('/currencies', data),
  update: (id, data) => apiClient.put(`/currencies/${id}`, data),
  destroy: (id) => apiClient.delete(`/currencies/${id}`),
}

export default currencyService
