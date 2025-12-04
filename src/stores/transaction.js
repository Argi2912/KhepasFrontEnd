import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'

// Helper para formatear moneda en el selector (Ej: "Zelle [1,500.00 USD]")
const formatBalance = (amount, currency) => {
  try {
    return (
      new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount) +
      ' ' +
      currency
    )
  } catch (e) {
    return `${amount} ${currency}`
  }
}

export const useTransactionStore = defineStore('transaction', () => {
  // --- STATE ---
  const clients = ref([])
  const providers = ref([])
  const brokers = ref([])
  const accounts = ref([])
  const currencies = ref([])
  const platforms = ref([]) // 🚨 NUEVO: Estado para Plataformas
  const investors = ref([]) // 🚨 NUEVO: Estado para Inversionistas
  const isLoadingData = ref(false)

  // --- GETTERS ---

  const getClients = computed(() =>
    clients.value.map((c) => ({
      id: c.id,
      name: c.name,
    })),
  )

  const getProviders = computed(() =>
    providers.value.map((p) => ({
      id: p.id,
      name: p.name,
    })),
  )

  const getBrokers = computed(() =>
    brokers.value.map((b) => ({
      id: b.id,
      name: `${b.name || 'Sin Nombre'} (${b.default_commission_rate}%)`,
      commission: b.default_commission_rate,
    })),
  )

  // 🚨 NUEVO: Getter para Plataformas
  const getPlatforms = computed(() =>
    platforms.value.map((p) => ({
      id: p.id,
      name: p.name,
    })),
  )

  const getAccounts = computed(() =>
    accounts.value.map((a) => ({
      id: a.id,
      name: `${a.name} — [${formatBalance(a.balance, a.currency_code)}]`,
      currency: a.currency_code,
      balance: parseFloat(a.balance),
    })),
  )

  const getInvestors = computed(() =>
    // 🚨 NUEVO: Getter para Inversionistas
    investors.value.map((i) => ({
      id: i.id,
      name: i.alias ? `${i.name} (${i.alias})` : i.name, // Usar alias si existe
    })),
  )

  // --- ACTIONS ---

  async function fetchAllSupportData() {
    isLoadingData.value = true
    try {
      // 🚨 Agregamos la petición de '/platforms'
      const [
        clientsRes,
        providersRes,
        brokersRes,
        accountsRes,
        currenciesRes,
        platformsRes,
        investorsRes,
      ] = await Promise.all([
        api.get('/clients?per_page=999'),
        api.get('/providers?per_page=999'),
        api.get('/brokers?per_page=999'),
        api.get('/accounts?per_page=999'),
        api.get('/currencies?per_page=999'),
        api.get('/platforms?per_page=999'), // Endpoint de plataformas
        api.get('/investors?per_page=999'),
      ])

      clients.value = clientsRes.data.data || clientsRes.data
      providers.value = providersRes.data.data || providersRes.data
      brokers.value = brokersRes.data.data || brokersRes.data
      accounts.value = accountsRes.data.data || accountsRes.data
      currencies.value = currenciesRes.data.data || currenciesRes.data
      platforms.value = platformsRes.data.data || platformsRes.data // Asignar plataformas
      investors.value = investorsRes.data.data || investorsRes.data // 🚨 Asignar Inversionistas
    } catch (error) {
      console.error('Error cargando datos:', error)
      notify.error('Error de conexión al cargar datos necesarios')
    } finally {
      isLoadingData.value = false
    }
  }

  // Crear Transacción Unificada
  async function createCurrencyExchange(payload) {
    const response = await api.post('/transactions/exchanges', payload)
    await fetchAllSupportData()
    return response.data
  }

  // Crear Transacción Interna
  async function createInternalTransaction(payload) {
    const response = await api.post('/transactions/internal', payload)
    await fetchAllSupportData()
    return response.data
  }

  async function markAsDelivered(id) {
    try {
      const response = await api.patch(`/transactions/exchanges/${id}/deliver`)
      notify.success('Entrega confirmada exitosamente')
      return response.data
    } catch (error) {
      console.error(error)
      notify.error(error.response?.data?.message || 'Error al actualizar el estado')
      throw error
    }
  }

  return {
    isLoadingData,
    rawAccounts: accounts,
    getClients,
    getProviders,
    getBrokers,
    getPlatforms, // Exportar getter
    getInvestors,
    getAccounts,
    currencies,
    fetchAllSupportData,
    createCurrencyExchange,
    createInternalTransaction,
    markAsDelivered,
  }
})
