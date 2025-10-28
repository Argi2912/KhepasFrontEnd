import api from './api'

const resource = '/exchange-rates'

export default {
  
  list(params = {}) {
    return api.get(resource, { params })
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
  }
}
