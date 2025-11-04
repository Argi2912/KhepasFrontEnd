import apiClient from '@/utils/http'

const accountService = {
  /**
   * Obtener TODAS las cuentas (no paginado)
   */
  index: (page = 0, search = '') => {
    return apiClient.get('/accounts', {
      params: {
        page: page > 0 ? page : undefined,
        search: search || undefined,
        per_page: page > 0 ? 20 : undefined,
      },
    })
  },
}

export default accountService
