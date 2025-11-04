import { defineStore } from 'pinia'
import cashService from '@/services/cashService'
import { useToast } from 'vue-toastification'

export const useCashStore = defineStore('cashes', {
  state: () => ({
    cashes: [],
    loading: false,
    error: null,
    paginationData: null, // Para guardar la info de paginación
  }),

  actions: {
    /**
     * Buscar y paginar cajas.
     * @param {Object} params - { page: Number, search: String }
     */
    async fetchCashes({ page = 1, search = '' }) {
      this.loading = true
      this.error = null
      this.cashes = []

      try {
        const response = await cashService.index(page, search)

        if (response.data && Array.isArray(response.data.data)) {
          this.cashes = response.data.data
          const { data, ...pagination } = response.data
          this.paginationData = pagination
        } else {
          this.cashes = response.data // Fallback por si no es paginado
        }
      } catch (error) {
        this.error = 'No se pudieron cargar las cajas.'
      } finally {
        this.loading = false
      }
    },

    /**
     * Añadir una nueva caja.
     */
    async addCash(cashData) {
      this.loading = true
      try {
        await cashService.create(cashData)
        // Recargar la lista (vuelve a la página 1)
        await this.fetchCashes({})
      } catch (error) {
        throw error // Propagar el error para que el modal sepa si cerrar
      } finally {
        this.loading = false
      }
    },

    /**
     * Actualizar una caja existente.
     */
    async updateCash(cashData) {
      this.loading = true
      try {
        await cashService.update(cashData.id, cashData)
        // Recargar la lista en la página actual
        await this.fetchCashes({
          page: this.paginationData?.meta?.current_page || 1,
        })
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Eliminar una caja existente.
     */
    async deleteCash(cashId) {
      this.loading = true
      try {
        await cashService.destroy(cashId)
        // Recargar la lista en la página actual
        await this.fetchCashes({
          page: this.paginationData?.meta?.current_page || 1,
        })
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
