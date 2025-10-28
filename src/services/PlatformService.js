import api from './api'

// 👉 Servicio con la misma estructura que los demás (ExchangeService, etc.)
const resource = '/platforms'

export default {
  list() {
    return api.get(resource)
  },

  get(id) {
    return api.get(`${resource}/${id}`)
  },

  create(data) {
    return api.post(resource, data)
  },

  update(id, data) {
    return api.put(`${resource}/${id}`, data)
  },

  delete(id) {
    return api.delete(`${resource}/${id}`)
  },
}
