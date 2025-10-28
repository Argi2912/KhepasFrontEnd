import api from './api' // Tu archivo 'api.js' central

// El recurso de la API (asegúrate que coincida con tu routes/api.php)
const resource = '/solicitudes'

export default {
  list() {
    return api.get(resource)
  },

  create(data) {
    return api.post(resource, data)
  },

  // (Puedes añadir get(id), update(id, data), delete(id) si los necesitas)
}