import { ref, computed, watch, onMounted } from 'vue'
import api from '@/services/api'
import alert from '@/services/alert'
import notify from '@/services/notify'
import { useAuthStore } from '@/stores/auth'

export function useInvestorList() {
  const authStore = useAuthStore()
  const permissionKey = 'manage_exchanges'

  const showInvestorModal = ref(false)
  const investorIdToEdit = ref(null)
  const showBalanceModal = ref(false)
  const showTransferModal = ref(false)
  const selectedInvestor = ref(null)

  const investors = ref([])
  const pagination = ref({})
  const filters = ref({})
  const isLoading = ref(false)

  const totalCapital = computed(() => {
    return investors.value.reduce((acc, i) => acc + (Number(i.capital_historico) || 0), 0)
  })

  const totalLiquid = computed(() => {
    return investors.value.reduce((acc, i) => acc + (Number(i.available_balance || i.current_balance) || 0), 0)
  })

  const activeCount = computed(() => investors.value.filter(i => i.is_active).length)

  const fetchInvestors = async (page = 1) => {
    isLoading.value = true
    const params = { page, ...filters.value }
    try {
      const response = await api.get('/investors', { params })
      investors.value = response.data.data
      const { data, ...pagData } = response.data
      pagination.value = pagData
    } catch (error) {
      notify.error('Fallo al sincronizar la cartera de inversionistas.')
    } finally {
      isLoading.value = false
    }
  }

  const openCreateModal = () => {
    investorIdToEdit.value = null
    showInvestorModal.value = true
  }

  const openEditModal = (id) => {
    investorIdToEdit.value = id
    showInvestorModal.value = true
  }

  const openBalanceModal = (investor) => {
    selectedInvestor.value = investor
    showBalanceModal.value = true
  }

  const openTransferModal = (investor) => {
    selectedInvestor.value = investor
    showTransferModal.value = true
  }

  const deleteInvestor = async (id, name) => {
    if (!authStore.can(permissionKey)) return notify.error('Acceso restringido.')
    const confirmed = await alert.confirm(`¿Remover inversionista "${name}"?`, 'Esto archivará su historial de aportes.')
    if (!confirmed) return
    try {
      await api.delete(`/investors/${id}`)
      notify.success('Inversionista removido del sistema.')
      fetchInvestors(pagination.value.current_page || 1)
    } catch (error) {
      notify.error('Fallo al eliminar: Verifique si posee capital activo.')
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(value || 0)
  }

  onMounted(() => fetchInvestors())

  watch(filters, () => fetchInvestors(1), { deep: true })

  return {
    authStore,
    permissionKey,
    showInvestorModal,
    investorIdToEdit,
    showBalanceModal,
    showTransferModal,
    selectedInvestor,
    investors,
    pagination,
    filters,
    isLoading,
    totalCapital,
    totalLiquid,
    activeCount,
    fetchInvestors,
    openCreateModal,
    openEditModal,
    openBalanceModal,
    openTransferModal,
    deleteInvestor,
    formatCurrency
  }
}
