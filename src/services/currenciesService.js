import api from './api'

// 👇 Recurso base según tus rutas de Laravel
const resource = '/currencies'

export default {
  // 🔹 Obtener todas las monedas
  list(params = {}) {
    return api.get(resource, { params })
  },

  // 🔹 Obtener una moneda por ID
  get(id) {
    return api.get(`${resource}/${id}`)
  },

  // 🔹 Crear una nueva moneda
  create(data) {
    return api.post(resource, data)
  },

  // 🔹 Actualizar una moneda existente
  update(id, data) {
    return api.put(`${resource}/${id}`, data)
  },

  // 🔹 Eliminar una moneda
  delete(id) {
    return api.delete(`${resource}/${id}`)
  }
}
