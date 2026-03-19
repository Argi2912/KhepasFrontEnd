import { ref, computed, watch, onMounted } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'
import Swal from 'sweetalert2'
import { useTransactionStore } from '@/stores/transaction'

export function useLedger() {
  const transactionStore = useTransactionStore()

  const loading = ref(false)
  const isDownloading = ref(false)
  const activeTab = ref('payable')
  const summary = ref({ payable_total: 0, receivable_total: 0 })
  const entries = ref([])
  const paginationData = ref({})

  const searchQuery = ref('')
  const startDate = ref('')
  const endDate = ref('')

  const showPayModal = ref(false)
  const selectedEntry = ref(null)
  const paymentForm = ref({
    account_id: '',
    amount: '',
    description: '',
  })
  const isProcessing = ref(false)

  const accountsOptions = computed(() => transactionStore.getAccounts)

  const filteredAccounts = computed(() => {
    if (!selectedEntry.value || !selectedEntry.value.currency_code) {
      return transactionStore.getAccounts
    }
    return transactionStore.getAccounts.filter(
      (acc) => acc.currency === selectedEntry.value.currency_code,
    )
  })

  const formatMoney = (amount, currency = 'USD') => {
    try {
      return Number(amount).toLocaleString('en-US', {
        style: 'currency',
        currency: currency,
      })
    } catch (error) {
      return (
        Number(amount).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) + ' ' + currency
      )
    }
  }

  const isInterestRow = (description) => {
    if (!description) return false
    const lower = description.toLowerCase()
    return lower.includes('rendimiento') || lower.includes('interés') || lower.includes('interes') || lower.includes('compuesto')
  }

  const fetchDashboard = async (page = 1) => {
    loading.value = true
    try {
      const { data: summaryData } = await api.get('/ledger/summary')
      summary.value = summaryData

      const params = {
        page: page,
        type: activeTab.value,
        search: searchQuery.value.trim() || undefined,
        start_date: startDate.value || undefined,
        end_date: endDate.value || undefined,
        include_paid: false,
      }

      const { data: response } = await api.get('/ledger', { params })
      paginationData.value = response

      entries.value = response.data.map((item) => {
        const amount = parseFloat(item.amount || 0)
        const original = parseFloat(item.original_amount || amount)
        const paid = parseFloat(item.paid_amount || 0)
        const pending = Math.max(0, original - paid)

        let displayStatus = 'Pendiente'
        if (pending <= 0.01) displayStatus = 'Pagado'
        else if (paid > 0) displayStatus = 'Parcial'

        let prettyType = 'Otros'
        if (item.entity_type) {
          if (item.entity_type.includes('Employee')) prettyType = 'Empleado'
          else if (item.entity_type.includes('Provider')) prettyType = 'Proveedor'
          else if (item.entity_type.includes('Client')) prettyType = 'Cliente'
          else if (item.entity_type.includes('Broker')) prettyType = 'Corredor'
          else prettyType = item.entity_type.split('\\').pop()
        }

        return {
          id: item.id,
          date: new Date(item.created_at).toLocaleDateString('es-VE', {
            day: '2-digit',
            month: 'short',
          }),
          description: item.description,
          amount,
          currency_code: item.currency_code || 'USD',
          original_amount: original,
          paid_amount: paid,
          pending_amount: pending,
          display_status: displayStatus,
          has_pending: pending > 0.01,
          entity_name: item.entity
            ? item.entity.name || item.entity.alias || item.entity.user?.name || 'Sin nombre'
            : '---',
          entity_type: prettyType,
          tx_number: item.transaction ? item.transaction.number : 'MANUAL',
        }
      })
    } catch (e) {
      notify.error('Error al cargar el libro mayor')
    } finally {
      loading.value = false
    }
  }

  const downloadReport = async (format) => {
    isDownloading.value = true
    try {
      const today = new Date().toISOString().slice(0, 10)
      const reportType = activeTab.value === 'payable' ? 'payables' : 'receivables'
      const start = startDate.value || '2020-01-01'
      const end = endDate.value || today

      const response = await api.get('/reports/download', {
        params: {
          report_type: reportType,
          format: format,
          start_date: start,
          end_date: end,
        },
        responseType: 'blob'
      })

      if (response.data.type === 'application/json') {
        const errorText = await response.data.text()
        throw new Error(JSON.parse(errorText).message || 'Error generando reporte')
      }

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      const title = activeTab.value === 'payable' ? 'Cuentas_Por_Pagar' : 'Cuentas_Por_Cobrar'
      link.setAttribute('download', `${title}_${today}.${format === 'excel' ? 'xlsx' : 'pdf'}`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      Swal.fire('Error', error.message || 'No se pudo generar el reporte.', 'error')
    } finally {
      isDownloading.value = false
    }
  }

  const openPayModal = (entry) => {
    selectedEntry.value = entry
    paymentForm.value = {
      account_id: '',
      amount: entry.pending_amount > 0 ? entry.pending_amount.toFixed(2) : entry.amount.toFixed(2),
      description: '',
    }
    showPayModal.value = true
  }

  const confirmPayment = async () => {
    if (!paymentForm.value.account_id) return notify.warning('Selecciona una cuenta')
    
    const amount = parseFloat(paymentForm.value.amount)
    if (amount <= 0 || amount > (selectedEntry.value.pending_amount + 0.01)) {
       return notify.warning('Monto inválido')
    }

    isProcessing.value = true
    try {
      await api.post(`/ledger/${selectedEntry.value.id}/pay`, {
        account_id: paymentForm.value.account_id,
        amount,
        description: paymentForm.value.description || null,
      })
      notify.success('Abono registrado correctamente')
      showPayModal.value = false
      fetchDashboard()
    } catch (e) {
      notify.error(e.response?.data?.message || 'Error al procesar el abono')
    } finally {
      isProcessing.value = false
    }
  }

  const switchTab = (tab) => {
    activeTab.value = tab
  }

  const clearFilters = () => {
    searchQuery.value = ''
    startDate.value = ''
    endDate.value = ''
    fetchDashboard(1)
  }

  onMounted(() => {
    transactionStore.fetchAllSupportData()
    fetchDashboard()
  })

  watch([activeTab, searchQuery, startDate, endDate], () => {
    fetchDashboard(1)
  })

  return {
    loading,
    isDownloading,
    activeTab,
    summary,
    entries,
    paginationData,
    searchQuery,
    startDate,
    endDate,
    showPayModal,
    selectedEntry,
    paymentForm,
    isProcessing,
    accountsOptions,
    filteredAccounts,
    formatMoney,
    isInterestRow,
    fetchDashboard,
    downloadReport,
    openPayModal,
    confirmPayment,
    switchTab,
    clearFilters
  }
}
