<script setup>
import { onMounted } from 'vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import Pagination from '@/components/ui/Pagination.vue'
import BaseCard from '@/components/shared/BaseCard.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useExchangeList } from '@/composables/transactions/useExchangeList'

const {
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
} = useExchangeList()

const headers = [
  { key: 'number', label: 'Estructura / Referencia' },
  { key: 'client', label: 'Contraparte' },
  { key: 'type', label: 'Operación' },
  { key: 'out', label: 'Salida de Capital' },
  { key: 'in', label: 'Entrada de Capital' },
  { key: 'status', label: 'Estado' },
  { key: 'actions', label: '' },
]

onMounted(() => fetchExchanges())
</script>

<template>
  <div class="space-y-10 animate-premium-in pb-12 overflow-hidden">
    
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

    <BaseCard title="Libro de Operaciones" subtitle="Auditoría detallada de flujos de caja e intercambios de divisa.">
      <BaseTable :headers="headers" :data="exchanges" :is-loading="isLoading">
        <tr v-for="row in exchanges" :key="row.id" class="group">
          <td>
            <div class="flex flex-col">
              <span class="text-xs font-black text-white/40 tracking-widest group-hover:text-primary transition-colors">#{{ row.number }}</span>
              <span class="text-[0.6rem] font-mono text-white/20 uppercase tracking-tighter mt-1">{{ row.date_fmt }}</span>
            </div>
          </td>
          <td class="font-bold text-white">
            <span class="text-sm tracking-tight leading-tight">{{ row.client_name }}</span>
          </td>
          <td>
            <span 
              class="px-2.5 py-1 rounded-lg text-[0.6rem] font-black uppercase tracking-[0.15em] border"
              :class="row.is_purchase ? 'bg-info/5 text-info border-info/20' : 'bg-secondary/5 text-white/40 border-white/10'"
            >
              {{ row.type_label }}
            </span>
          </td>
          <td class="font-mono text-sm text-danger/80">
            - {{ row.amount_out_fmt }}
          </td>
          <td class="font-mono text-sm text-success font-black">
            + {{ row.amount_in_fmt }}
          </td>
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

    <BaseModal :show="showDetailModal" title="Auditoría de Transacción" @close="showDetailModal = false">
      <div v-if="isLoadingDetail" class="py-12 flex flex-col items-center gap-4">
        <FontAwesomeIcon icon="fa-solid fa-circle-notch" spin size="2x" class="text-primary" />
        <p class="text-[0.6rem] font-black uppercase text-white/20 tracking-widest">Recuperando registros...</p>
      </div>

      <div v-else-if="selectedTx" class="space-y-8 py-2">
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

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 px-2">
           <div>
              <label class="text-[0.6rem] font-black text-white/30 uppercase tracking-[0.2em] mb-1 block">Cliente</label>
              <p class="font-bold text-white tracking-tight">{{ selectedTx.client_name }}</p>
           </div>
           <div class="text-right">
              <label class="text-[0.6rem] font-black text-white/30 uppercase tracking-[0.2em] mb-1 block">Referencia Interna</label>
              <p class="font-black text-primary tracking-widest">#{{ selectedTx.number }}</p>
           </div>
        </div>

        <div class="bg-success/[0.02] border border-success/10 rounded-2xl p-5 space-y-3">
           <h4 class="text-[0.65rem] font-black text-success/60 uppercase tracking-widest border-b border-success/5 pb-2">Rendimiento Operativo</h4>
           <div class="flex justify-between items-center text-sm">
              <span class="font-bold text-white/40">Utilidad Neta Real</span>
              <span class="text-xl font-black text-success tracking-tighter">{{ formatMoney(selectedTx.net_profit, selectedTx.from_currency) }}</span>
           </div>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-3 w-full">
          <BaseButton variant="primary" class="flex-1" @click="downloadReceipt(selectedTx.id)">
            <FontAwesomeIcon icon="fa-solid fa-download" class="mr-2" /> Recibo
          </BaseButton>
          <BaseButton variant="secondary" outline class="flex-1" @click="showDetailModal = false">Cerrar</BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.text-gradient-primary {
  background: linear-gradient(135deg, #f7a600, #f0b90b);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.premium-card {
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.premium-card:hover {
  background: rgba(255, 255, 255, 0.03);
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.08);
}
</style>