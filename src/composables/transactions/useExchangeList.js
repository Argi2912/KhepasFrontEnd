import { ref, computed } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'
import alert from '@/services/alert'
import { downloadTransactionReceipt, downloadBlob } from '@/utils/download'
import { useAuthStore } from '@/stores/auth'
import { useTransactionStore } from '@/stores/transaction'

export function useExchangeList() {
  const authStore = useAuthStore()
  const transactionStore = useTransactionStore()

  const exchanges = ref([])
  const isLoading = ref(false)
  const isDownloading = ref(false)
  const pagination = ref({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })

  const showDetailModal = ref(false)
  const selectedTx = ref(null)
  const isLoadingDetail = ref(false)

  const canApprove = computed(() => authStore.can('manage_exchanges'))

  const totalExchanges = computed(() => pagination.value.total || exchanges.value.length)
  
  const totalVolumeUSD = computed(() => {
    return exchanges.value.reduce((acc, tx) => 
      acc + (tx.is_purchase ? (Number(tx.amount_received) || 0) : (Number(tx.amount_sent) || 0)), 0)
  })

  const totalGrossProfit = computed(() => {
    return exchanges.value.reduce((acc, tx) => acc + (Number(tx.commission_total_amount) || 0), 0)
  })

  const normalizeTransactionData = (data) => {
    const client = data.client || {}
    const buyRate = parseFloat(data.buy_rate || 0)
    const exRate = parseFloat(data.exchange_rate || 0)
    const isPurchase = buyRate > 0

    return {
      id: data.id,
      number: data.number,
      status: data.status,
      created_at: data.created_at,
      date_fmt: new Date(data.created_at).toLocaleDateString(),
      type_label: isPurchase ? 'COMPRA' : 'INTERCAMBIO',
      is_purchase: isPurchase,
      client_name: client.name || 'S/N',
      from_currency: data.from_account?.currency_code || '---',
      amount_sent: parseFloat(data.amount_sent || 0),
      to_currency: data.to_account?.currency_code || '---',
      amount_total_in: parseFloat(data.amount_received || 0),
      rate_used: isPurchase ? buyRate : exRate,
      rate_label: isPurchase ? 'Tasa Compra' : 'Tasa Cambio',
      comm_charged: parseFloat(data.commission_total_amount || 0),
      net_profit: parseFloat(data.commission_total_amount || 0) - 
                 parseFloat(data.commission_provider_amount || 0) - 
                 parseFloat(data.commission_admin_amount || 0) - 
                 parseFloat(data.commission_broker_amount || 0),
    }
  }

  const formatMoney = (amount, currency = '') => {
    return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(amount || 0) + 
           (currency ? ` ${currency}` : '')
  }

  const fetchExchanges = async (page = 1) => {
    isLoading.value = true
    try {
      const { data } = await api.get(`/transactions/exchanges?page=${page}`)
      exchanges.value = data.data.map((tx) => {
        const normalized = normalizeTransactionData(tx)
        return {
          ...tx,
          ...normalized,
          amount_out_fmt: formatMoney(normalized.amount_sent, normalized.from_currency),
          amount_in_fmt: formatMoney(normalized.amount_total_in, normalized.to_currency),
        }
      })
      const { data: list, ...meta } = data
      pagination.value = meta
    } catch (e) {
      notify.error('Fallo al sincronizar historial operativo.')
    } finally {
      isLoading.value = false
    }
  }

  const downloadReport = async (format) => {
    isDownloading.value = true
    try {
      const response = await api.get('/reports/download', {
        params: { report_type: 'operations', format },
        responseType: 'blob'
      })
      
      const filename = `Reporte_Operaciones_${format}_${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      downloadBlob(response.data, filename)
      notify.success('Documento exportado exitosamente.')
    } catch (error) {
      notify.error('Fallo al generar el reporte.')
    } finally {
      isDownloading.value = false
    }
  }

  const downloadReceipt = async (id) => {
    await downloadTransactionReceipt(id, 'exchange')
  }

  const handleDeliver = async (row) => {
    const confirmed = await alert.confirm(
      `¿Confirmar entrega para Ref: ${row.number}?`, 
      'Esta acción marcará la operación como COMPLETADA.'
    )
    if (confirmed) {
      isLoading.value = true
      try {
        await transactionStore.markAsDelivered(row.id)
        notify.success('Operación completada.')
        fetchExchanges(pagination.value.current_page)
      } finally {
        isLoading.value = false
      }
    }
  }

  const openModal = async (id) => {
    showDetailModal.value = true
    isLoadingDetail.value = true
    try {
      const { data } = await api.get(`/transactions/exchanges/${id}`)
      selectedTx.value = normalizeTransactionData(data)
    } finally {
      isLoadingDetail.value = false
    }
  }

  return {
    exchanges,
    isLoading,
    isDownloading,
    pagination,
    showDetailModal,
    selectedTx,
    isLoadingDetail,
    canApprove,
    totalExchanges,
    totalVolumeUSD,
    totalGrossProfit,
    fetchExchanges,
    downloadReport,
    downloadReceipt,
    handleDeliver,
    openModal,
    formatMoney
  }
}
