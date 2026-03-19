<script setup>
import { onMounted, ref } from 'vue'
import { useTransactionRequestStore } from '@/stores/transactionRequest'
import { useRouter } from 'vue-router'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import BaseButton from '@/components/shared/BaseButton.vue'
import BaseCard from '@/components/shared/BaseCard.vue'
import BaseModal from '@/components/shared/BaseModal.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useTransactionStore } from '@/stores/transaction'

const requestStore = useTransactionRequestStore()
const transactionStore = useTransactionStore()
const router = useRouter()
const currentFilter = ref('pending')

// Modal state
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
    closeActionModal()
  } finally {
    isProcessing.value = false
  }
}

const handleReject = async () => {
  if (!actionForm.value.notes) {
    notify.error('Debe indicar un motivo en las notas para rechazar')
    return
  }
  isProcessing.value = true
  try {
    await requestStore.updateRequestStatus(selectedRequest.value.id, 'rejected', actionForm.value.notes)
    closeActionModal()
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <FontAwesomeIcon icon="fa-solid fa-inbox" class="text-primary" />
          Solicitudes
        </h1>
        <p class="text-white/40 text-sm mt-1">Gestión de retiros e intercambios solicitados por clientes.</p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Filtros Rápidos -->
        <div class="flex bg-white/5 rounded-xl p-1 border border-white/10">
          <button @click="changeFilter('pending')" :class="['px-4 py-1.5 text-xs font-bold rounded-lg transition-colors duration-300', currentFilter === 'pending' ? 'bg-primary text-secondary' : 'text-white/40 hover:text-white']">
            Pendientes
          </button>
          <button @click="changeFilter('processed')" :class="['px-4 py-1.5 text-xs font-bold rounded-lg transition-colors duration-300', currentFilter === 'processed' ? 'bg-success text-white' : 'text-white/40 hover:text-white']">
            Procesadas
          </button>
          <button @click="changeFilter('rejected')" :class="['px-4 py-1.5 text-xs font-bold rounded-lg transition-colors duration-300', currentFilter === 'rejected' ? 'bg-danger text-white' : 'text-white/40 hover:text-white']">
            Rechazadas
          </button>
        </div>

        <BaseButton @click="goToCreate" variant="primary">
          <FontAwesomeIcon icon="fa-solid fa-plus" class="mr-2" /> Nueva Solicitud
        </BaseButton>
      </div>
    </div>

    <!-- Lista -->
    <BaseCard>
      <div v-if="requestStore.isLoading" class="flex justify-center p-12">
        <FontAwesomeIcon icon="fa-solid fa-circle-notch" spin class="text-3xl text-primary" />
      </div>

      <div v-else-if="requestStore.requests.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
        <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <FontAwesomeIcon icon="fa-solid fa-check-double" class="text-2xl text-white/20" />
        </div>
        <h3 class="text-lg font-bold text-white/60">No hay solicitudes en este estado</h3>
        <p class="text-sm text-white/30">Todo está al día para el filtro seleccionado.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[0.65rem] font-black text-white/20 uppercase tracking-[0.2em] border-b border-white/5">
              <th class="py-4 px-4">Fecha</th>
              <th class="py-4 px-4">Cliente</th>
              <th class="py-4 px-4">Tipo</th>
              <th class="py-4 px-4">Ruta</th>
              <th class="py-4 px-4 text-right">Monto</th>
              <th class="py-4 px-4 text-center">Estado</th>
              <th class="py-4 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="req in requestStore.requests" :key="req.id" class="group hover:bg-white/[0.02] transition-colors">
              <td class="py-4 px-4 text-sm font-mono text-white/40">{{ new Date(req.created_at).toLocaleDateString() }}</td>
              <td class="py-4 px-4 text-sm font-bold text-white">{{ req.client?.name || 'Cliente Eliminado' }}</td>
              <td class="py-4 px-4">
                <span class="text-xs font-bold uppercase tracking-wider" :class="req.type === 'withdrawal' ? 'text-danger' : 'text-info'">
                  {{ req.type === 'withdrawal' ? 'Retiro' : 'Exchange' }}
                </span>
              </td>
              <td class="py-4 px-4">
                <div class="flex flex-col gap-1">
                  <span class="text-xs font-bold text-white/60"><FontAwesomeIcon icon="fa-solid fa-arrow-right-from-bracket" class="text-white/20 mr-1"/> {{ req.source_origin || 'ND' }}</span>
                  <span class="text-xs font-bold text-white/60"><FontAwesomeIcon icon="fa-solid fa-arrow-right-to-bracket" class="text-white/20 mr-1"/> {{ req.destination_target || 'ND' }}</span>
                </div>
              </td>
              <td class="py-4 px-4 text-right text-sm font-black text-white">
                {{ formatCurrency(req.amount, req.currency_code) }}
              </td>
              <td class="py-4 px-4 text-center">
                <span :class="['px-3 py-1 text-[0.65rem] font-black uppercase tracking-widest rounded-full border', getStatusBadge(req.status)]">
                  {{ getStatusText(req.status) }}
                </span>
              </td>
              <td class="py-4 px-4 text-center">
                  <button v-if="req.status === 'pending'" @click="goToAction(req)" class="w-8 h-8 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-secondary transition-all">
                      <FontAwesomeIcon icon="fa-solid fa-bolt" />
                  </button>
                  <span v-if="req.status !== 'pending'" class="text-white/20" :title="req.notes || 'Sin notas'">
                    <FontAwesomeIcon icon="fa-solid fa-info-circle" v-if="req.notes" class="text-white/40 cursor-help" />
                    <span v-else>-</span>
                  </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <!-- Modal de Acción -->
    <BaseModal :show="isActionModalOpen" title="Procesar Solicitud" @close="closeActionModal">
      <div v-if="selectedRequest" class="space-y-6">
        <div class="bg-secondary p-4 rounded-xl border border-white/5 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-white/40 font-bold">Cliente:</span>
            <span class="text-white font-black">{{ selectedRequest.client?.name }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-white/40 font-bold">Monto:</span>
            <span class="text-primary font-black">{{ formatCurrency(selectedRequest.amount, selectedRequest.currency_code) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-white/40 font-bold">Destino:</span>
            <span class="text-white font-bold">{{ selectedRequest.destination_target || 'N/A' }}</span>
          </div>
          <div v-if="selectedRequest.notes" class="mt-4 pt-4 border-t border-white/5 text-xs text-info">
            <strong>Notas Cliente:</strong> {{ selectedRequest.notes }}
          </div>
        </div>

        <div class="space-y-4">
          <BaseInput
            label="Notas / Observaciones"
            v-model="actionForm.notes"
            placeholder="Añade algún detalle o motivo si vas a rechazar..."
          />
        </div>

        <div class="flex justify-end gap-3 pt-6 border-t border-white/5">
          <button @click="handleReject" :disabled="isProcessing" class="px-4 py-2 bg-danger/10 text-danger border border-danger/20 rounded-xl font-bold hover:bg-danger hover:text-white transition-colors">
            Rechazar
          </button>
          <button @click="handleApprove" :disabled="isProcessing" class="px-4 py-2 bg-success/10 text-success border border-success/20 rounded-xl font-bold hover:bg-success hover:text-white transition-colors flex items-center gap-2">
            <FontAwesomeIcon v-if="isProcessing" icon="fa-solid fa-spinner" spin />
            Marcar como Procesada / Aprobada
          </button>
        </div>
      </div>
    </BaseModal>

  </div>
</template>
