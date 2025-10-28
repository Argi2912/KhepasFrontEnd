import api from './api'

const resource = '/corredores'

export default {
  list() {
    return api.get(resource)
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