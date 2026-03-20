import { defineStore } from 'pinia'
import api from '@/services/api'
import notify from '@/services/notify'

export const useSupportStore = defineStore('support', {
  state: () => ({
    messages: [],
    pendingCount: 0,
    pendingThreads: [], // Lista de usuarios con mensajes pendientes
    isOpen: false, // Control global del chat
    isLoading: false,
    activeUserId: null // Para que el admin filtre el chat de un usuario
  }),

  actions: {
    async fetchMessages() {
      this.isLoading = true
      try {
        const params = {}
        if (this.activeUserId) {
          params.user_id = this.activeUserId
        }
        const { data } = await api.get('/support/contact', { params })
        this.messages = data
        return data
      } catch (error) {
        console.error('Error al cargar mensajes de soporte', error)
      } finally {
        this.isLoading = false
      }
    },

    async sendMessage(payload) {
      // Si el Admin está respondiendo, forzamos el activeUserId si no viene en el payload
      if (!payload.user_id && this.activeUserId) {
        payload.user_id = this.activeUserId
      }
      
      try {
        const { data } = await api.post('/support/contact', payload)
        // No pusheamos directamente si es respuesta, dejamos que el polling lo traiga 
        // o lo añadimos si ya estamos en ese hilo
        this.messages.push(data)
        return data
      } catch (error) {
        console.error('Error al enviar mensaje', error)
        throw error
      }
    },

    async fetchPendingCount() {
      try {
        const { data } = await api.get('/support/pending-count')
        this.pendingCount = data.count
      } catch (error) {
        console.error('Error al obtener conteo de soporte', error)
      }
    },

    async fetchPendingThreads() {
      try {
        const { data } = await api.get('/support/pending-threads')
        this.pendingThreads = data
      } catch (error) {
        console.error('Error al obtener hilos de soporte', error)
      }
    },

    async markRead(userId = null) {
      const targetId = userId || this.activeUserId
      try {
        await api.post('/support/mark-read', { user_id: targetId })
        this.fetchPendingCount()
      } catch (error) {
        console.error('Error al marcar mensajes como leídos', error)
      }
    },
  }
})
