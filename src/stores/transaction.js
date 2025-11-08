import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'

/**
 * Helper de formato (fuera del store para que getAccounts lo use)
 */
const formatCurrency = (value, currency) => {
  if (value == null || !currency) return '...'
  const code = currency === 'USDT' ? 'USD' : currency
  try {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: code,
    }).format(value)
  } catch (e) {
    return `${currency} ${value}`
  }
}

export const useTransactionStore = defineStore('transaction', () => {
  // --- STATE ---
  const clients = ref([])
  const providers = ref([])
  const brokers = ref([])
  const accounts = ref([])
  const allRates = ref([]) // 🚨 Contendrá TODAS las tasas
  const currencies = ref([]) // (Opcional, si lo necesitas)
  const isLoadingData = ref(false)

  // --- GETTERS ---
  const getClients = computed(() => clients.value)
  const getProviders = computed(() => providers.value)
  const getBrokers = computed(() => brokers.value)

  /**
   * Mapea las cuentas para mostrar el saldo en el nombre (UX).
   * Crucial para la validación de saldos.
   */
  const getAccounts = computed(() =>
    accounts.value.map((a) => ({
      ...a, // Mantiene todos los datos originales como 'balance'
      name: `${a.name} (${a.currency_code}) - Saldo: ${formatCurrency(a.balance, a.currency_code)}`,
    })),
  )

  const getAllRates = computed(() => allRates.value)

  /**
   * Lógica de búsqueda de tasa.
   * Busca la tasa más reciente (directa o inversa)
   */
  const findRate = computed(() => (from, to) => {
    if (!from || !to) return null
    if (from === to) return 1

    // 1. Buscar tasa directa (ej: USD -> VES)
    // .find() obtiene la primera (la más reciente, ya que el backend ordena por latest())
    const directRate = allRates.value.find((r) => r.from_currency === from && r.to_currency === to)
    if (directRate) return parseFloat(directRate.rate)

    // 2. Si no, buscar tasa inversa (ej: VES -> USD)
    const inverseRate = allRates.value.find((r) => r.from_currency === to && r.to_currency === from)
    if (inverseRate) return 1 / parseFloat(inverseRate.rate)

    return null
  })

  // --- ACTIONS ---
  async function fetchAllSupportData() {
    if (isLoadingData.value) return
    isLoadingData.value = true

    try {
      const [
        clientsRes,
        providersRes,
        brokersRes,
        accountsRes,
        ratesRes, // 🚨 LLAMADA A LA NUEVA RUTA
        currenciesRes,
      ] = await Promise.all([
        api.get('/clients?per_page=999'),
        api.get('/providers?per_page=999'),
        api.get('/brokers?per_page=999'),
        api.get('/accounts?per_page=999'),
        api.get('/rates/all'), // <-- 🚨 ¡AQUÍ ESTÁ EL CAMBIO!
        api.get('/currencies?per_page=999'),
      ])

      clients.value = clientsRes.data.data
      providers.value = providersRes.data.data
      brokers.value = brokersRes.data.data.map((b) => ({
        id: b.id,
        name: `${b.user.name} (${b.default_commission_rate}%)`,
        commission: b.default_commission_rate,
      }))

      accounts.value = accountsRes.data.data
      allRates.value = ratesRes.data // 🚨 La data de /all no está paginada
      currencies.value = currenciesRes.data.data
    } catch (error) {
      console.error('Error al cargar datos de apoyo:', error)
      notify.error('No se pudieron cargar todos los datos necesarios.')
    } finally {
      isLoadingData.value = false
    }
  }

  return {
    // State
    isLoadingData,
    accounts, // Exponer 'accounts' crudas para encontrar balances
    // Getters
    getClients,
    getProviders,
    getBrokers,
    getAccounts,
    getAllRates,
    findRate,
    // Actions
    fetchAllSupportData,
    // Helpers
    formatCurrency, // Exponer el helper para usarlo en los componentes
  }
})
