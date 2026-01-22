import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'

// Helper for formatting currency
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
  const platforms = ref([])
  const investors = ref([])
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
    investors.value.map((i) => ({
      id: i.id,
      name: i.alias ? `${i.name} (${i.alias})` : i.name,
    })),
  )

  // --- ACTIONS ---

  async function fetchAllSupportData() {
    isLoadingData.value = true
    try {
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
        api.get('/platforms?per_page=999'),
        api.get('/investors?per_page=999'),
      ])

      clients.value = clientsRes.data.data || clientsRes.data
      providers.value = providersRes.data.data || providersRes.data
      brokers.value = brokersRes.data.data || brokersRes.data
      accounts.value = accountsRes.data.data || accountsRes.data
      currencies.value = currenciesRes.data.data || currenciesRes.data
      platforms.value = platformsRes.data.data || platformsRes.data
      investors.value = investorsRes.data.data || investorsRes.data
    } catch (error) {
      console.error('Error loading data:', error)
      notify.error('Connection error while loading necessary data')
    } finally {
      isLoadingData.value = false
    }
  }

  // ✅ ADDED: Function to fetch the Profit Matrix
  async function fetchProfitMatrixReport(filters = {}) {
    try {
      const response = await api.get('/reports/profit-matrix', { params: filters })
      return response.data
    } catch (error) {
      console.error('Error loading matrix:', error)
      notify.error('Error fetching profit matrix report')
      throw error
    }
  }

  async function createCurrencyExchange(payload) {
    const response = await api.post('/transactions/exchanges', payload)
    await fetchAllSupportData()
    return response.data
  }

  async function createInternalTransaction(payload) {
    const response = await api.post('/transactions/internal', payload)
    await fetchAllSupportData()
    return response.data
  }

  async function markAsDelivered(id) {
    try {
      const response = await api.patch(`/transactions/exchanges/${id}/deliver`)
      notify.success('Delivery confirmed successfully')
      return response.data
    } catch (error) {
      console.error(error)
      notify.error(error.response?.data?.message || 'Error updating status')
      throw error
    }
  }

  return {
    isLoadingData,
    rawAccounts: accounts,
    getClients,
    getProviders,
    getBrokers,
    getPlatforms,
    getInvestors,
    getAccounts,
    currencies,
    fetchAllSupportData,
    fetchProfitMatrixReport, // 👈 Don't forget to export the function here
    createCurrencyExchange,
    createInternalTransaction,
    markAsDelivered,
  }
})