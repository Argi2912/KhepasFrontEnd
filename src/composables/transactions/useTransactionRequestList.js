import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTransactionRequestStore } from '@/stores/transactionRequest'
import { useTransactionStore } from '@/stores/transaction'
import notify from '@/services/notify'

export function useTransactionRequestList() {
  const requestStore = useTransactionRequestStore()
  const transactionStore = useTransactionStore()
  const router = useRouter()

  const currentFilter = ref('pending')
  const isActionModalOpen = ref(false)
  const selectedRequest = ref(null)
  const actionForm = ref({
    account_id: '',
    notes: ''
  })
  const isProcessing = ref(false)

  onMounted(async () => {
    requestStore.setFilters({ status: 'pending' })
    if (transactionStore.getAccounts.length === 0) {
      await transactionStore.fetchAllSupportData()
    }
  })

  const changeFilter = (status) => {
    currentFilter.value = status
    requestStore.setFilters({ status })
  }

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount)
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return 'bg-primary/20 text-primary border-primary/30'
      case 'processed': return 'bg-success/20 text-success border-success/30'
      case 'rejected': return 'bg-danger/20 text-danger border-danger/30'
      default: return 'bg-white/10 text-white border-white/20'
    }
  }

  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return 'Pendiente'
      case 'processed': return 'Procesada'
      case 'rejected': return 'Rechazada'
      default: return status
    }
  }

  const goToCreate = () => {
    router.push({ name: 'transaction_requests_create' })
  }

  const goToAction = (request) => {
    selectedRequest.value = request
    actionForm.value.account_id = ''
    actionForm.value.notes = ''
    isActionModalOpen.value = true
  }

  const closeActionModal = () => {
    isActionModalOpen.value = false
    selectedRequest.value = null
  }

  const handleApprove = async () => {
    isProcessing.value = true
    try {
      await requestStore.updateRequestStatus(selectedRequest.value.id, 'processed', actionForm.value.notes)
      
      const req = selectedRequest.value
      const message = `*✅ SOLICITUD APROBADA*%0A` +
                      `Tu solicitud REQ-${req.id.toString().padStart(6, '0')} por *${formatCurrency(req.amount, req.currency_code)}* ha sido aprobada y está siendo procesada.`
      
      closeActionModal()
      notify.success('Solicitud procesada exitosamente.')

      // Abrir WhatsApp automáticamente si hay teléfono (opcional, aquí simulamos la intención)
      // window.open(`https://wa.me/${req.client?.phone || ''}?text=${message}`, '_blank')

      // Redirigir al flujo de intercambio
      if (req.type === 'exchange') {
        router.push({ 
          name: 'currency_exchanges_create', 
          query: { 
            request_id: req.id,
            client_id: req.client_id,
            amount: req.amount,
            currency: req.currency_code,
            origin: req.source_origin,
            target: req.destination_target
          } 
        })
      }
    } catch (e) {
      notify.error('Fallo al procesar solicitud.')
    } finally {
      isProcessing.value = false
    }
  }

  const handleReject = async () => {
    isProcessing.value = true
    try {
      await requestStore.updateRequestStatus(selectedRequest.value.id, 'rejected', actionForm.value.notes)
      
      const req = selectedRequest.value
      const reason = actionForm.value.notes ? `%0A*Motivo:* ${actionForm.value.notes}` : ''
      const message = `*❌ SOLICITUD RECHAZADA*%0A` +
                      `Lo sentimos, tu solicitud REQ-${req.id.toString().padStart(6, '0')} por *${formatCurrency(req.amount, req.currency_code)}* ha sido rechazada.${reason}`
      
      closeActionModal()
      notify.success('Solicitud rechazada.')
      
      // Intentar notificar por WhatsApp
      if (req.client?.phone) {
         window.open(`https://wa.me/${req.client.phone}?text=${message}`, '_blank')
      }
    } catch (e) {
      notify.error('Fallo al rechazar solicitud.')
    } finally {
      isProcessing.value = false
    }
  }

  return {
    requestStore,
    currentFilter,
    isActionModalOpen,
    selectedRequest,
    actionForm,
    isProcessing,
    changeFilter,
    formatCurrency,
    getStatusBadge,
    getStatusText,
    goToCreate,
    goToAction,
    closeActionModal,
    handleApprove,
    handleReject
  }
}
