import apiClient from '@/utils/http'

const userService = {
  // Obtener todos los usuarios (con paginación y búsqueda)
  index: (page = 1, search = '') => {
    return apiClient.get('/users', {
      params: {
        page: page,
        search: search,
      },
    })
  },

  // Crear un nuevo usuario
  create: (userData) => apiClient.post('/users', userData),

  // Actualizar un usuario existente
  update: (userId, userData) => apiClient.put(`/users/${userId}`, userData),

  // Actualizar el perfil del usuario autenticado
  updateProfile: (profileData) => apiClient.post('/auth/updateProfile', profileData),

  /**
   * Eliminar un usuario existente
   * @param {number} userId - ID del usuario a eliminar.
   */
  destroy: (userId) => apiClient.delete(`/users/${userId}`),
}

export default userService
