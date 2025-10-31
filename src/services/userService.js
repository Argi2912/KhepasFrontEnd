import api from './api'

const resourse = '/users'

export default {
  getAllUsers() {
    return api.get(resourse)
  },

  getUserById(id) {
    return api.get(`${resourse}/${id}`)
  },

  createUser(userData) {
    return api.post(resourse, userData)
  },

  updateUser(id, userData) {
    return api.put(`${resourse}/${id}`, userData)
  },

  deleteUser(id) {
    return api.delete(`${resourse}/${id}`)
  },
}
