import { ref, computed, watch, onMounted } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'
import alert from '@/services/alert'
import { useAuthStore } from '@/stores/auth'

export function useAccountList() {
  const authStore = useAuthStore()
  const permissionKey = 'manage_exchanges'

  const showAccountModal = ref(false)
  const accountIdToEdit = ref(null)

  const accounts = ref([])
  const pagination = ref({})
  const filters = ref({})
  const isLoading = ref(false)

  const totalBalanceUSD = computed(() => {
    return accounts.value
      .filter(a => a.currency_code === 'USD' || a.currency_code === 'USDT')
      .reduce((acc, curr) => acc + Number(curr.balance), 0)
  })

  const totalAccountsCount = computed(() => pagination.value.total || accounts.value.length)

  const activeCurrencies = computed(() => {
    const codes = accounts.value.map(a => a.currency_code)
    return [...new Set(codes)].length
  })

  const formatCurrencyPremium = (value, currency = 'USD') => {
    if (value === null || value === undefined) value = 0
    let currencyCode = currency === 'USDT' ? 'USD' : currency
    
    const formatter = new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    
    const formatted = formatter.format(value)
    const [whole, decimal] = formatted.split(',')
    return { 
      whole, 
      decimal, 
      symbol: currencyCode === 'BS' ? 'Bs.' : (currencyCode === 'USD' ? '$' : currencyCode) 
    }
  }

  const fetchAccounts = async (page = 1) => {
    isLoading.value = true
    const params = { page: page, ...filters.value }
    try {
      const response = await api.get('/accounts', { params })
      accounts.value = response.data.data
      const { data, ...pagData } = response.data
      pagination.value = pagData
    } catch (error) {
      notify.error('Error al cargar la lista de cuentas.')
    } finally {
      isLoading.value = false
    }
  }

  const openCreateModal = () => {
    accountIdToEdit.value = null
    showAccountModal.value = true
  }

  const openEditModal = (accountId) => {
    accountIdToEdit.value = accountId
    showAccountModal.value = true
  }

  const deleteAccount = async (accountId, accountName) => {
    if (!authStore.can(permissionKey)) {
      notify.error('No tienes permiso para eliminar cuentas.')
      return
    }
    const confirmed = await alert.confirm(
      `¿Eliminar cuenta ${accountName}?`,
      'Esta acción solo es posible si el saldo es exactamente CERO.',
    )
    if (confirmed) {
      try {
        await api.delete(`/accounts/${accountId}`)
        notify.success('Cuenta liquidada correctamente.')
        fetchAccounts(pagination.value.current_page || 1)
      } catch (error) {
        notify.error('Fallo al eliminar: Verifique que el saldo sea cero.')
      }
    }
  }

  onMounted(() => fetchAccounts())

  watch(filters, () => fetchAccounts(1), { deep: true })

  return {
    authStore,
    permissionKey,
    showAccountModal,
    accountIdToEdit,
    accounts,
    pagination,
    filters,
    isLoading,
    totalBalanceUSD,
    totalAccountsCount,
    activeCurrencies,
    formatCurrencyPremium,
    fetchAccounts,
    openCreateModal,
    openEditModal,
    deleteAccount
  }
}
