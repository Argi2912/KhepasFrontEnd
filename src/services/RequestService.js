import api from './api'

// 👇 Aquí definimos el recurso correcto según tus rutas de Laravel
const resource = '/request-types'

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
