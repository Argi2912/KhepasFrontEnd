import { defineStore } from 'pinia'
import ProviderService from '../services/ProviderService'
import { Notyf } from 'notyf'

let notyf = new Notyf()

export const useProviderStore = defineStore('providerStore', {
  state: () => ({
    providers: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchList() {
      this.loading = true
      this.error = null
      try {
        const response = await ProviderService.list()
        this.providers = response.data.data || response.data
      } catch (error) {
        this.error = error.message
        notyf.error(error.response?.data?.message || 'Error al cargar proveedores')
        throw error
      } finally {
        this.loading = false
      }
    },

    async create(providerData) {
      this.loading = true
      this.error = null
      try {
        const response = await ProviderService.create(providerData)
        const createdProvider = response.data.data || response.data
        this.providers.unshift(createdProvider)
        notyf.success('Proveedor creado exitosamente')
        return createdProvider
      } catch (error) {
        this.error = error.message
        if (error.response?.data?.errors) {
          notyf.error(error.response.data.errors.name[0])
        } else {
          notyf.error(error.response?.data?.message || 'Error al crear proveedor')
        }
        throw error
      } finally {
        this.loading = false
      }
    },
    
       async update(providerData) {
         this.loading = true
         this.error = null
         try {
           const response = await ProviderService.update(providerData.id, providerData)
           const updatedprovider = response.data.data || response.data
           const index = this.providers.findIndex((c) => c.id === this.providerData.id)
           if (index !== -1) this.clients[index] = updatedprovider
           notyf.success('proveedor actualizado exitosamente')
           return updatedClient
         } catch (error) {
           this.error = error.message
           if (error.response?.data?.errors) {
             notyf.error(error.response.data.errors.name[0])
           } else {
             notyf.error(error.response?.data?.message || 'Error al actualizar proovedor')
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
           await ProviderService.delete(id)
           this.providers = this.providers.filter((c) => c.id !== id)
           notyf.success('proveedor eliminado exitosamente')
         } catch (error) {
           this.error = error.message
           notyf.error(error.response?.data?.message || 'Error al eliminar prooverdor')
           throw error
         } finally {
           this.loading = false
         }
       },
     },
   })