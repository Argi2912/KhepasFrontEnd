import api from './api'

export default {
  login: (email, password) => {
    return api.post('/auth/login', { email, password })
  },

  logout: () => {
    return api.post('/auth/logout')
  },

  refreshToken: () => {
    return api.post('/auth/refresh')
  },

  getMe: () => {
    return api.get('/auth/me')
  },
}
