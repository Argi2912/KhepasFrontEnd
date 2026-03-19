import { ref, computed, watch, onMounted } from 'vue'
import api from '@/services/api'
import alert from '@/services/alert'
import notify from '@/services/notify'
import { useAuthStore } from '@/stores/auth'

export function useProviderList() {
  const authStore = useAuthStore()
  const permissionKey = 'manage_exchanges'

  const showProviderModal = ref(false)
  const providerIdToEdit = ref(null)
  const showBalanceModal = ref(false)
  const selectedProvider = ref(null)

  const providers = ref([])
  const pagination = ref({})
  const filters = ref({})
  const isLoading = ref(false)

  const totalProviders = computed(() => pagination.value.total || providers.value.length)
  const activeProviders = computed(() => providers.value.filter(p => p.is_active).length)
  
  const totalDebtUSD = computed(() => {
    return providers.value.reduce((acc, p) => {
      const usdBal = p.balances?.find(b => b.currency_code === 'USD' || b.currency_code === 'USDT')
      return acc + (usdBal ? Number(usdBal.amount) : 0)
    }, 0)
  })

  const fetchProviders = async (page = 1) => {
    isLoading.value = true
    const params = { page: page, ...filters.value }
    try {
      const response = await api.get('/providers', { params })
      providers.value = response.data.data
      const { data, ...pagData } = response.data
      pagination.value = pagData
    } catch (error) {
      notify.error('Error al sincronizar el directorio de proveedores.')
    } finally {
      isLoading.value = false
    }
  }

  const openCreateModal = () => {
    providerIdToEdit.value = null
    showProviderModal.value = true
  }

  const openEditModal = (providerId) => {
    providerIdToEdit.value = providerId
    showProviderModal.value = true
  }

  const openBalanceModal = (provider) => {
    selectedProvider.value = provider
    showBalanceModal.value = true
  }

  const deleteProvider = async (providerId, providerName) => {
    if (!authStore.can(permissionKey)) return notify.error('Permisos insuficientes.')
    if (await alert.confirm(`¿Remover a ${providerName}?`, 'Esta acción podría afectar cuadres históricos.')) {
      try {
        await api.delete(`/providers/${providerId}`)
        notify.success('Proveedor archivado correctamente.')
        fetchProviders(pagination.value.current_page || 1)
      } catch (error) {
        notify.error('Fallo al eliminar: Verifique dependencias activas.')
      }
    }
  }

  const formatNumber = (value) => {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0)
  }

  onMounted(() => fetchProviders())

  watch(filters, () => fetchProviders(1), { deep: true })

  return {
    authStore,
    permissionKey,
    showProviderModal,
    providerIdToEdit,
    showBalanceModal,
    selectedProvider,
    providers,
    pagination,
    filters,
    isLoading,
    totalProviders,
    activeProviders,
    totalDebtUSD,
    fetchProviders,
    openCreateModal,
    openEditModal,
    openBalanceModal,
    deleteProvider,
    formatNumber
  }
}
