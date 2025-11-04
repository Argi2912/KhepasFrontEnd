import apiClient from '@/utils/http'

const cashService = {
  /**
   * Obtener todas las cajas (con paginación y búsqueda)
   * @param {number} page - Número de página
   * @param {string} search - Término de búsqueda
   */
  index: (page = 1, search = '') => {
    return apiClient.get('/cashes', {
      params: {
        page: page,
        search: search,
      },
    })
  },

  /**
   * Crear una nueva caja/plataforma
   * @param {object} cashData - Datos de la caja
   */
  create: (cashData) => apiClient.post('/cashes', cashData),

  /**
   * Actualizar una caja/plataforma
   * @param {number} cashId - ID de la caja
   * @param {object} cashData - Datos de la caja
   */
  update: (cashId, cashData) => apiClient.put(`/cashes/${cashId}`, cashData),

  /**
   * Eliminar una caja/plataforma
   * @param {number} cashId - ID de la caja
   */
  destroy: (cashId) => apiClient.delete(`/cashes/${cashId}`),
}

export default cashService
