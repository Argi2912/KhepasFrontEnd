import { defineStore } from 'pinia'
import api from '@/services/api'
import notify from '@/services/notify'

export const useSupportStore = defineStore('support', {
  state: () => ({
    tickets: [], // Lista de tickets del usuario o admin
    messages: [],
    activeTicketId: null, // Ticket seleccionado actualmente
    pendingCount: 0,
    pendingThreads: [], // Ahora representará tickets abiertos con mensajes sin leer
    isOpen: false,
    isLoading: false,
    activeUserId: null // Para filtros del admin
  }),

  actions: {
    async fetchTickets(userId = null) {
      this.isLoading = true
      try {
        const params = {}
        if (userId || this.activeUserId) params.user_id = userId || this.activeUserId
        const { data } = await api.get('/support/contact', { params })
        this.tickets = data
        return data
      } catch (error) {
        console.error('Error al cargar tickets', error)
      } finally {
        this.isLoading = false
      }
    },

    async fetchTicketMessages(ticketId) {
      this.isLoading = true
      try {
        const { data } = await api.get(`/support/contact/${ticketId}`)
        this.messages = data.messages
        // Si el ticket es el activo, actualizamos su info básica si es necesario
        return data
      } catch (error) {
        console.error('Error al cargar mensajes del ticket', error)
      } finally {
        this.isLoading = false
      }
    },

    async sendMessage(payload) {
      if (!payload.ticket_id && this.activeTicketId) {
        payload.ticket_id = this.activeTicketId
      }
      
      try {
        const { data } = await api.post('/support/contact', payload)
        // Si es un ticket nuevo (primer mensaje), debemos actualizar la lista de tickets
        if (!payload.ticket_id) {
          await this.fetchTickets()
          if (this.tickets.length > 0) {
            this.activeTicketId = this.tickets[0].id
          }
        } else {
          this.messages.push(data)
        }
        return data
      } catch (error) {
        console.error('Error al enviar mensaje', error)
        notify.error(error.response?.data?.error || 'Error al enviar mensaje')
        throw error
      }
    },

    async closeTicket(ticketId = null) {
      const id = ticketId || this.activeTicketId
      if (!id) return
      try {
        await api.post(`/support/contact/${id}/close`)
        notify.success('Ticket cerrado correctamente')
        await this.fetchTickets()
        // Actualizar el estado del ticket activo si coincide
        const active = this.tickets.find(t => t.id === id)
        if (active && this.activeTicketId === id) {
          // Podríamos refrescar los mensajes para ver el sistema de bloqueo
          await this.fetchTicketMessages(id)
        }
      } catch (error) {
        console.error('Error al cerrar ticket', error)
      }
    },

    async fetchMessages() {
      if (this.activeTicketId) {
        return this.fetchTicketMessages(this.activeTicketId)
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

    async markRead(ticketId = null) {
      const id = ticketId || this.activeTicketId
      if (!id) return
      try {
        await api.post('/support/mark-read', { ticket_id: id })
        this.fetchPendingCount()
      } catch (error) {
        console.error('Error al marcar mensajes como leídos', error)
      }
    },
  }
})
