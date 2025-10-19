import api from './api'

export default {
  login: (email, password) => {
    return api.post('/auth/login', { email, password })
  },

  register: (credentials) => {
    return api.post('/register/register', credentials)
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
