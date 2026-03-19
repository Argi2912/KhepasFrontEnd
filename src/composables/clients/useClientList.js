import { ref, computed, watch, onMounted } from 'vue'
import api from '@/services/api'
import alert from '@/services/alert'
import notify from '@/services/notify'
import { useAuthStore } from '@/stores/auth'

export function useClientList() {
  const authStore = useAuthStore()
  const permissionKey = 'manage_clients'

  const showClientModal = ref(false)
  const clientIdToEdit = ref(null)

  const clients = ref([])
  const pagination = ref({})
  const filters = ref({})
  const isLoading = ref(false)

  const totalClients = computed(() => pagination.value.total || clients.value.length)
  
  const newClientsCount = computed(() => {
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    return clients.value.filter(c => new Date(c.created_at) > oneMonthAgo).length
  })

  const fetchClients = async (page = 1) => {
    isLoading.value = true
    const params = { page: page, ...filters.value }
    try {
      const response = await api.get('/clients', { params })
      clients.value = response.data.data
      const { data, ...pagData } = response.data
      pagination.value = pagData
    } catch (error) {
      notify.error('Error al sincronizar cartera de clientes.')
    } finally {
      isLoading.value = false
    }
  }

  const openCreateModal = () => {
    clientIdToEdit.value = null
    showClientModal.value = true
  }

  const openEditModal = (clientId) => {
    clientIdToEdit.value = clientId
    showClientModal.value = true
  }

  const deleteClient = async (clientId, clientName) => {
    if (!authStore.can(permissionKey)) return notify.error('Acceso denegado: Permisos insuficientes.')
    const confirmed = await alert.confirm(
      `¿Archivar cliente ${clientName}?`,
      'Esta acción es irreversible y afectará el historial de operaciones.',
    )
    if (confirmed) {
      try {
        await api.delete(`/clients/${clientId}`)
        notify.success('Cliente removido del sistema.')
        fetchClients(pagination.value.current_page || 1)
      } catch (error) {
        notify.error('Fallo al eliminar: El cliente posee transacciones activas.')
      }
    }
  }

  onMounted(() => fetchClients())

  watch(filters, () => fetchClients(1), { deep: true })

  return {
    authStore,
    permissionKey,
    showClientModal,
    clientIdToEdit,
    clients,
    pagination,
    filters,
    isLoading,
    totalClients,
    newClientsCount,
    fetchClients,
    openCreateModal,
    openEditModal,
    deleteClient
  }
}
