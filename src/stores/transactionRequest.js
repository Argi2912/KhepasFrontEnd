import { defineStore } from 'pinia'
import api from '@/services/api'
import notify from '@/services/notify'

export const useTransactionRequestStore = defineStore('transactionRequest', {
  state: () => ({
    requests: [],
    pagination: {
      current_page: 1,
      last_page: 1,
      total: 0
    },
    isLoading: false,
    pendingCount: 0,
    filters: {
      status: 'pending',
      client_id: ''
    }
  }),

  actions: {
    async fetchRequests(page = 1) {
      this.isLoading = true
      try {
        const { data } = await api.get('/transactions/requests', {
          params: {
            page,
            status: this.filters.status,
            client_id: this.filters.client_id
          }
        })
        this.requests = data.data
        this.pagination = {
          current_page: data.current_page,
          last_page: data.last_page,
          total: data.total
        }
        
        // Si el filtro actual es 'pending', aprovechamos para actualizar el conteo global
        if (this.filters.status === 'pending') {
          this.pendingCount = data.total
        } else {
          // Si no, hacemos una llamada ligera solo para el conteo (opcional)
          this.fetchPendingCount()
        }
      } catch (error) {
        notify.error('Error al cargar las solicitudes de transacción')
        console.error(error)
      } finally {
        this.isLoading = false
      }
    },

    async createRequest(payload) {
      try {
        const { data } = await api.post('/transactions/requests', payload)
        this.requests.unshift(data)
        notify.success('Solicitud de transacción creada')
        return true
      } catch (error) {
        console.error(error)
        throw error
      }
    },

    async updateRequestStatus(id, newStatus, notes = '') {
      try {
        await api.put(`/transactions/requests/${id}`, {
          status: newStatus,
          notes: notes
        })
        
        notify.success('Estado de solicitud actualizado')
        
        // Refrescamos la lista completa para asegurar que los filtros se apliquen correctamente
        await this.fetchRequests(this.pagination.current_page)
        
        return true
      } catch (error) {
        notify.error('Error al actualizar la solicitud')
        console.error(error)
        throw error
      }
    },

    setFilters(newFilters) {
      this.filters = { ...this.filters, ...newFilters }
      this.fetchRequests(1)
    },

    async fetchPendingCount() {
      try {
        const { data } = await api.get('/transactions/requests', {
          params: { status: 'pending', page: 1 }
        })
        this.pendingCount = data.total
      } catch (e) {
        console.error('Error al obtener conteo de pendientes', e)
      }
    }
  }
})
