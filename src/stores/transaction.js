import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'

export const useTransactionStore = defineStore('transaction', () => {
  // --- STATE ---
  const clients = ref([])
  const providers = ref([])
  const brokers = ref([])
  const accounts = ref([])
  const activeRates = ref([])
  const currencies = ref([]) // Para la lista de divisas

  const isLoadingData = ref(false)

  // --- GETTERS ---
  const getClients = computed(() => clients.value)
  const getProviders = computed(() => providers.value)
  const getBrokers = computed(() => brokers.value)

  // Mapear cuentas para mostrar su saldo en el nombre (UX mejorada)
  const getAccounts = computed(() =>
    accounts.value.map((a) => ({
      ...a, // Mantiene todos los datos originales como 'balance'
      name: `${a.name} (${a.currency_code})`, // El texto que se muestra en el select
    })),
  )

  const getActiveRates = computed(() => activeRates.value)
  const getCurrencies = computed(() => currencies.value)

  // Lógica de búsqueda de tasa mejorada para incluir tasas inversas
  const findRate = computed(() => (from, to) => {
    if (!from || !to) return null
    if (from === to) return 1 // La tasa a sí misma es 1

    // 1. Buscar tasa directa (ej: USD -> VES)
    const directRate = activeRates.value.find(
      (r) => r.from_currency === from && r.to_currency === to,
    )
    if (directRate) return parseFloat(directRate.rate)

    // 2. Si no, buscar tasa inversa (ej: VES -> USD)
    const inverseRate = activeRates.value.find(
      (r) => r.from_currency === to && r.to_currency === from,
    )
    // Si se encuentra, devolver el inverso (1 / tasa)
    if (inverseRate) return 1 / parseFloat(inverseRate.rate)

    return null // No se encontró ninguna tasa
  })

  // --- ACTIONS ---
  async function fetchAllSupportData() {
    if (isLoadingData.value) return
    isLoadingData.value = true

    try {
      const [clientsRes, providersRes, brokersRes, accountsRes, ratesRes, currenciesRes] =
        await Promise.all([
          api.get('/clients?per_page=999'),
          api.get('/providers?per_page=999'),
          api.get('/brokers?per_page=999'),
          api.get('/accounts?per_page=999'),
          api.get('/rates', { params: { is_active: 1 } }), // 🚨 Ahora esto funcionará
          api.get('/currencies?per_page=999'),
        ])

      clients.value = clientsRes.data.data
      providers.value = providersRes.data.data

      // Mapear brokers para incluir su comisión por defecto
      brokers.value = brokersRes.data.data.map((b) => ({
        id: b.id,
        name: `${b.user.name} (${b.default_commission_rate}%)`,
        commission: b.default_commission_rate,
      }))

      accounts.value = accountsRes.data.data
      activeRates.value = ratesRes.data.data // Ahora sí contendrá solo las activas
      currencies.value = currenciesRes.data.data
    } catch (error) {
      console.error('Error al cargar datos de apoyo:', error)
      notify.error('No se pudieron cargar todos los datos necesarios.')
    } finally {
      isLoadingData.value = false
    }
  }

  return {
    isLoadingData,
    getClients,
    getProviders,
    getBrokers,
    getAccounts, // Devuelve cuentas con saldo
    getCurrencies,
    findRate, // Devuelve tasa directa o inversa
    fetchAllSupportData,
    accounts, // Exponer cuentas 'crudas' para acceder al balance
  }
})
