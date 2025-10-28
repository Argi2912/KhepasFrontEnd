import { defineStore } from 'pinia'
import CorredorService from '../services/CorredorService'
import { Notyf } from 'notyf'

let notyf = new Notyf()

export const useCorredorStore = defineStore('corredorStore', {
  state: () => ({
    corredores: [], // Nota el cambio de nombre
    loading: false,
    error: null,
  }),

  
    actions: {
      async fetchList() {
        this.loading = true
        this.error = null
        try {
          const response = await CorredorService.list()
          this.corredores = response.data.data || response.data
        } catch (error) {
          this.error = error.message
          notyf.error(error.response?.data?.message || 'Error al cargar corredor')
          throw error
        } finally {
          this.loading = false
        }
      },
  
      async create(corredorData) {
        this.loading = true
        this.error = null
        try {
          const response = await CorredorService.create(corredorData)
          const createdcorredor = response.data.data || response.data
          this.corredores.unshift(createdcorredor)
          notyf.success('Corredor creado exitosamente')
          return createdcorredor // Retorna para el modal
        } catch (error) {
          this.error = error.message
          if (error.response?.data?.errors) {
            notyf.error(error.response.data.errors.name[0])
          } else {
            notyf.error(error.response?.data?.message || 'Error al crear cliente')
          }
          throw error // Relanza para el modal
        } finally {
          this.loading = false
        }
      },
  
      async update(corredorData) {
        this.loading = true
        this.error = null
        try {
          const response = await CorredorService.update(corredorData.id, corredorData)
          const updatedcorredor = response.data.data || response.data
          const index = this.clients.findIndex((c) => c.id === corredorData.id)
          if (index !== -1) this.corredores[index] = updatedcorredor
          notyf.success('Cliente actualizado exitosamente')
          return updatedcorredor
        } catch (error) {
          this.error = error.message
          if (error.response?.data?.errors) {
            notyf.error(error.response.data.errors.name[0])
          } else {
            notyf.error(error.response?.data?.message || 'Error al actualizar cliente')
          }
          throw error
        } finally {
          this.loading = false
        }
      },
  
      async delete(id) {
        this.loading = true
        this.error = null
        try {
          await CorredorService.delete(id)
          this.corredores = this.corredores.filter((c) => c.id !== id)
          notyf.success('Cliente eliminado exitosamente')
        } catch (error) {
          this.error = error.message
          notyf.error(error.response?.data?.message || 'Error al eliminar cliente')
          throw error
        } finally {
          this.loading = false
        }
      },
    },
  })
  