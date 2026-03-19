<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'
import BaseTable from '@/components/ui/BaseTable.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import Pagination from '@/components/ui/Pagination.vue'
import BaseCard from '@/components/shared/BaseCard.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useAuthStore } from '@/stores/auth'
import { useTransactionStore } from '@/stores/transaction'
import alert from '@/services/alert'

const authStore = useAuthStore()
const transactionStore = useTransactionStore()

// --- ESTADO ---
const exchanges = ref([])
const isLoading = ref(false)
const isDownloading = ref(false)
const pagination = ref({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })

// --- ESTADO DEL MODAL ---
const showDetailModal = ref(false)
const selectedTx = ref(null)
const isLoadingDetail = ref(false)

const headers = [
  { key: 'number', label: 'Estructura / Referencia' },
  { key: 'client', label: 'Contraparte' },
  { key: 'type', label: 'Operación' },
  { key: 'out', label: 'Salida de Capital' },
  { key: 'in', label: 'Entrada de Capital' },
  { key: 'status', label: 'Estado' },
  { key: 'actions', label: '' },
]

const canApprove = computed(() => {
  return authStore.can('manage_exchanges')
})

/**
 * Estadísticas Rápidas (Vista de Mando)
 */
const totalExchanges = computed(() => pagination.value.total || exchanges.value.length)
const totalVolumeUSD = computed(() => {
  return exchanges.value.reduce((acc, tx) => acc + (tx.is_purchase ? (Number(tx.amount_received) || 0) : (Number(tx.amount_sent) || 0)), 0)
})
const totalGrossProfit = computed(() => {
  return exchanges.value.reduce((acc, tx) => acc + (Number(tx.commission_total_amount) || 0), 0)
})

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
    net_profit: parseFloat(data.commission_total_amount || 0) - parseFloat(data.commission_provider_amount || 0) - parseFloat(data.commission_admin_amount || 0) - parseFloat(data.commission_broker_amount || 0),
  }
}

const downloadReport = async (format) => {
  isDownloading.value = true
  try {
    const response = await api.get('/reports/download', {
      params: { report_type: 'operations', format },
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = `Reporte_Khepas_${format}_${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`
    link.click()
    notify.success('Documento exportado exitosamente.')
  } catch (error) {
    notify.error('Fallo al generar el reporte.')
  } finally {
    isDownloading.value = false
  }
}

const handleDeliver = async (row) => {
  const confirmed = await alert.confirm(`¿Confirmar entrega para Ref: ${row.number}?`, 'Esta acción marcará la operación como COMPLETADA.')
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

const formatMoney = (amount, currency = '') => {
  return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(amount || 0) + (currency ? ` ${currency}` : '')
}

onMounted(() => fetchExchanges())
</script>

<template>
  <div class="space-y-10 animate-premium-in pb-12 overflow-hidden">
    
    <!-- Header Premium -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
        <h1 class="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <span class="w-1.5 h-10 bg-primary rounded-full"></span>
          Control de <span class="text-gradient-primary">Operaciones</span>
        </h1>
        <p class="text-white/30 text-xs font-bold uppercase tracking-[0.2em] mt-2 ml-4">Historial de intercambio y flujo de divisas</p>
      </div>

      <div class="flex items-center gap-4">
        <div class="flex items-center bg-white/[0.04] p-1.5 rounded-2xl border border-white/5 shadow-inner">
           <button @click="downloadReport('excel')" :disabled="isDownloading" class="w-10 h-10 rounded-xl hover:bg-success/20 text-white/40 hover:text-success transition-all flex items-center justify-center">
             <FontAwesomeIcon icon="fa-solid fa-file-excel" />
           </button>
           <button @click="downloadReport('pdf')" :disabled="isDownloading" class="w-10 h-10 rounded-xl hover:bg-danger/20 text-white/40 hover:text-danger transition-all flex items-center justify-center">
             <FontAwesomeIcon icon="fa-solid fa-file-pdf" />
           </button>
        </div>

        <router-link :to="{ name: 'transaction_exchange_create' }">
          <BaseButton variant="primary">
            <FontAwesomeIcon icon="fa-solid fa-plus-circle" class="mr-2" /> Nueva Operación
          </BaseButton>
        </router-link>
      </div>
    </div>

    <!-- Panel de KPI v5 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="premium-card p-6 bg-white/[0.02]">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
            <FontAwesomeIcon icon="fa-solid fa-rotate" class="text-xl" />
          </div>
          <div>
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/30 block mb-1">Volumen Operativo</span>
            <span class="text-xs font-bold text-primary/60">Transacciones procesadas</span>
          </div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-4xl font-black text-white tracking-tighter">{{ totalExchanges }}</span>
          <span class="text-[0.6rem] font-black text-white/20 uppercase tracking-widest">Ejecuciones</span>
        </div>
      </div>

      <div class="premium-card p-6 border-success/5 bg-success/[0.01]">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success border border-success/10">
            <FontAwesomeIcon icon="fa-solid fa-chart-line" class="text-xl" />
          </div>
          <div>
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/30 block mb-1">Caudal Financiero</span>
            <span class="text-xs font-bold text-success/60">Tráfico total transado</span>
          </div>
        </div>
        <div class="flex items-baseline gap-1">
          <span class="text-xs font-black text-success/60 mr-1">$</span>
          <span class="text-4xl font-black text-white tracking-tighter">{{ formatMoney(totalVolumeUSD).split(',')[0] }}</span>
          <span class="text-lg font-bold text-white/20 tracking-tighter">.{{ formatMoney(totalVolumeUSD).split(',')[1] }}</span>
        </div>
      </div>

      <div class="premium-card p-6 border-info/5 bg-info/[0.01]">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-info/10 flex items-center justify-center text-info border border-info/10">
            <FontAwesomeIcon icon="fa-solid fa-hand-holding-dollar" class="text-xl" />
          </div>
          <div>
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/30 block mb-1">Ingreso Operativo</span>
            <span class="text-xs font-bold text-info/60">Comisiones brutas captadas</span>
          </div>
        </div>
        <div class="flex items-baseline gap-1">
          <span class="text-xs font-black text-info/60 mr-1">$</span>
          <span class="text-4xl font-black text-white tracking-tighter">{{ formatMoney(totalGrossProfit).split(',')[0] }}</span>
          <span class="text-lg font-bold text-white/20 tracking-tighter">.{{ formatMoney(totalGrossProfit).split(',')[1] }}</span>
        </div>
      </div>
    </div>

    <!-- Historial v5 -->
    <BaseCard title="Libro de Operaciones" subtitle="Auditoría detallada de flujos de caja e intercambios de divisa.">
      <BaseTable :headers="headers" :data="exchanges" :is-loading="isLoading">
        <tr v-for="row in exchanges" :key="row.id" class="group">
          
          <!-- Referencia -->
          <td>
            <div class="flex flex-col">
              <span class="text-xs font-black text-white/40 tracking-widest group-hover:text-primary transition-colors">#{{ row.number }}</span>
              <span class="text-[0.6rem] font-mono text-white/20 uppercase tracking-tighter mt-1">{{ row.date_fmt }}</span>
            </div>
          </td>

          <!-- Cliente -->
          <td class="font-bold text-white">
            <span class="text-sm tracking-tight leading-tight">{{ row.client_name }}</span>
          </td>

          <!-- Tipo -->
          <td>
            <span 
              class="px-2.5 py-1 rounded-lg text-[0.6rem] font-black uppercase tracking-[0.15em] border"
              :class="row.is_purchase ? 'bg-info/5 text-info border-info/20' : 'bg-secondary/5 text-white/40 border-white/10'"
            >
              {{ row.type_label }}
            </span>
          </td>

          <!-- Salida -->
          <td class="font-mono text-sm text-danger/80">
            - {{ row.amount_out_fmt }}
          </td>

          <!-- Entrada -->
          <td class="font-mono text-sm text-success font-black">
            + {{ row.amount_in_fmt }}
          </td>

          <!-- Estado -->
          <td>
            <span 
              class="px-3 py-1.5 rounded-xl text-[0.6rem] font-black uppercase tracking-[0.2em] border"
              :class="row.status === 'completed' 
                ? 'bg-success/5 text-success border-success/20 shadow-[0_0_15px_rgba(46,204,113,0.05)]' 
                : 'bg-warning/5 text-warning border-warning/20 opacity-80'"
            >
              {{ row.status === 'completed' ? 'Ejecutada' : 'Pendiente' }}
            </span>
          </td>

          <!-- Acciones -->
          <td>
            <div class="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-all duration-300">
               <button 
                @click="openModal(row.id)" 
                class="w-9 h-9 rounded-xl bg-white/5 text-white/40 flex items-center justify-center transition-all hover:bg-white/10 hover:text-white active:scale-95"
                title="Auditar Detalle"
              >
                <FontAwesomeIcon icon="fa-solid fa-eye" />
              </button>
              <button 
                v-if="row.status === 'pending' && canApprove" 
                @click="handleDeliver(row)" 
                class="w-9 h-9 rounded-xl bg-success/10 text-success flex items-center justify-center transition-all hover:bg-success hover:text-white hover:shadow-lg active:scale-95 animate-pulse"
                title="Confirmar Entrega"
              >
                <FontAwesomeIcon icon="fa-solid fa-check-double" />
              </button>
            </div>
          </td>
        </tr>
      </BaseTable>
      
      <template #footer>
        <Pagination :pagination="pagination" @change-page="fetchExchanges" />
      </template>
    </BaseCard>

    <!-- Modal Detalle Premium -->
    <BaseModal :show="showDetailModal" title="Auditoría de Transacción" @close="showDetailModal = false">
      <div v-if="isLoadingDetail" class="py-12 flex flex-col items-center gap-4">
        <FontAwesomeIcon icon="fa-solid fa-circle-notch" spin size="2x" class="text-primary" />
        <p class="text-[0.6rem] font-black uppercase text-white/20 tracking-widest">Recuperando registros...</p>
      </div>

      <div v-else-if="selectedTx" class="space-y-8 py-2">
        <!-- Bloque Flujo Glass -->
        <div class="relative p-6 rounded-[2rem] bg-black/40 border border-white/5 overflow-hidden">
           <div class="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 blur-3xl"></div>
           
           <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
              <div class="space-y-2">
                 <span class="text-[0.6rem] font-bold text-white/20 uppercase tracking-widest">Origen (Sale)</span>
                 <p class="text-2xl font-black text-danger tracking-tighter">- {{ formatMoney(selectedTx.amount_sent, selectedTx.from_currency) }}</p>
              </div>
              <div class="space-y-2 text-right">
                 <span class="text-[0.6rem] font-bold text-white/20 uppercase tracking-widest">Destino (Entra)</span>
                 <p class="text-2xl font-black text-success tracking-tighter">+ {{ formatMoney(selectedTx.amount_total_in, selectedTx.to_currency) }}</p>
              </div>
           </div>
           
           <div class="mt-6 pt-4 border-t border-white/5 flex justify-center">
              <span class="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[0.65rem] font-black text-primary uppercase tracking-widest">
                {{ selectedTx.rate_label }}: {{ selectedTx.rate_used }}
              </span>
           </div>
        </div>

        <div class="grid grid-cols-2 gap-6 px-2">
           <div>
              <label class="text-[0.6rem] font-black text-white/30 uppercase tracking-[0.2em] mb-1 block">Cliente</label>
              <p class="font-bold text-white tracking-tight">{{ selectedTx.client_name }}</p>
           </div>
           <div class="text-right">
              <label class="text-[0.6rem] font-black text-white/30 uppercase tracking-[0.2em] mb-1 block">Referencia Interna</label>
              <p class="font-black text-primary tracking-widest">#{{ selectedTx.number }}</p>
           </div>
        </div>

        <!-- Profit Box Premium -->
        <div class="bg-success/[0.02] border border-success/10 rounded-2xl p-5 space-y-3">
           <h4 class="text-[0.65rem] font-black text-success/60 uppercase tracking-widest border-b border-success/5 pb-2">Rendimiento Operativo</h4>
           <div class="flex justify-between items-center text-sm">
              <span class="font-bold text-white/40">Utilidad Neta Real</span>
              <span class="text-xl font-black text-success tracking-tighter">{{ formatMoney(selectedTx.net_profit, selectedTx.from_currency) }}</span>
           </div>
        </div>
      </div>

      <template #footer>
          <BaseButton variant="secondary" outline class="w-full" @click="showDetailModal = false">Finalizar Auditoría</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>