import { ref, onMounted } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'
import { useAuthStore } from '@/stores/auth'

export function useDashboard() {
  const authStore = useAuthStore()
  const breakdown = ref([])
  const accountsBreakdown = ref([])
  const isLoading = ref(true)

  // Chart state
  const chartData = ref(null)
  const currentPeriod = ref('month')

  const fetchSummary = async () => {
    isLoading.value = true
    try {
      const response = await api.get('/dashboard/summary')
      breakdown.value = response.data.breakdown || []
      accountsBreakdown.value = response.data.accounts_breakdown || []
      await fetchPerformance()
    } catch (error) {
      notify.error('No se pudieron cargar los datos del Dashboard.')
    } finally {
      isLoading.value = false
    }
  }

  const fetchPerformance = async () => {
    try {
      const { data } = await api.get('/statistics/performance', { params: { period: currentPeriod.value } })
      chartData.value = data.chart_data
    } catch (error) {
      console.error('Error cargando gráfico:', error)
    }
  }

  const changePeriod = (period) => {
    currentPeriod.value = period
    fetchPerformance()
  }

  onMounted(() => {
    if (authStore.isLoggedIn) fetchSummary()
  })

  return {
    authStore,
    breakdown,
    accountsBreakdown,
    isLoading,
    chartData,
    currentPeriod,
    fetchSummary,
    fetchPerformance,
    changePeriod,
  }
}
