// src/services/ClientProviderService.js
import api from '@/services/api'

class ClientProviderService {
  /**
   * Obtiene una lista paginada y filtrada (para vistas de lista).
   * @param {string} resource 'clients' o 'providers'
   * @param {object} params Filtros de la query string
   */
  async fetchList(resource, params) {
    return api.get(`/${resource}`, { params })
  }

  /**
   * Obtiene una lista corta, sin paginar (para selectores).
   * @param {string} resource 'clients' o 'providers'
   * @param {string} search Término de búsqueda
   */
  async fetchSelectOptions(resource, search = '') {
    // En este caso, asumimos que Laravel tiene un endpoint que devuelve
    // una lista corta si no se especifica 'page' o que acepta 'search'
    return api.get(`/${resource}`, { params: { search, per_page: 500 } })
  }

  /**
   * Crea un nuevo registro.
   */
  async create(resource, data) {
    return api.post(`/${resource}`, data)
  }

  /**
   * Actualiza un registro.
   */
  async update(resource, id, data) {
    return api.put(`/${resource}/${id}`, data)
  }

  /**
   * Elimina un registro.
   */
  async delete(resource, id) {
    return api.delete(`/${resource}/${id}`)
  }
}

export default new ClientProviderService()
