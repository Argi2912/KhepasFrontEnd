<script setup>
import { onMounted } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import BaseTable from '@/components/ui/BaseTable.vue'
import BaseModal from '@/components/shared/BaseModal.vue'
import Pagination from '@/components/ui/Pagination.vue'
import BaseCard from '@/components/shared/BaseCard.vue'
import { useInternalTransactionList } from '@/composables/transactions/useInternalTransactionList'

const {
  transactions,
  isLoading,
  isDownloading,
  pagination,
  showDetailModal,
  selectedTx,
  isLoadingDetail,
  fetchTransactions,
  downloadReport,
  downloadReceipt,
  openModal,
  formatMoney
} = useInternalTransactionList()

const headers = [
  { key: 'date', label: 'Estampa de Tiempo' },
  { key: 'person', label: 'Contraparte / Origen' },
  { key: 'category', label: 'Clasificación' },
  { key: 'account', label: 'Caja Operativa' },
  { key: 'amount', label: 'Flujo Neto' },
  { key: 'actions', label: '' },
]

onMounted(() => fetchTransactions())
</script>

<template>
  <div class="space-y-10 animate-premium-in pb-12">
    
    <!-- Header Premium -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
        <h1 class="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <span class="w-1.5 h-10 bg-primary rounded-full shadow-[0_0_20px_rgba(247,166,0,0.4)]"></span>
          Caja e <span class="text-gradient-primary">Ingresos</span>
        </h1>
        <p class="text-white/30 text-xs font-bold uppercase tracking-[0.2em] mt-2 ml-4">Control de gastos operativos y flujos internos</p>
      </div>

      <div class="flex items-center gap-4">
        <div class="flex items-center bg-white/[0.04] p-1.5 rounded-2xl border border-white/5 shadow-inner">
           <button @click="downloadReport('excel')" :disabled="isDownloading || isLoading" class="w-10 h-10 rounded-xl hover:bg-success/20 text-white/40 hover:text-success transition-all flex items-center justify-center disabled:opacity-30">
             <FontAwesomeIcon icon="fa-solid fa-file-excel" />
           </button>
           <button @click="downloadReport('pdf')" :disabled="isDownloading || isLoading" class="w-10 h-10 rounded-xl hover:bg-danger/20 text-white/40 hover:text-danger transition-all flex items-center justify-center disabled:opacity-30">
             <FontAwesomeIcon icon="fa-solid fa-file-pdf" />
           </button>
        </div>

        <router-link :to="{ name: 'transaction_internal_create' }">
          <button class="bg-primary hover:bg-primary-dark text-secondary px-6 py-3.5 rounded-2xl font-black transition-all shadow-[0_10px_30px_rgba(247,166,0,0.2)] flex items-center gap-3 group active:scale-95">
            <FontAwesomeIcon icon="fa-solid fa-plus-circle" class="text-lg group-hover:scale-110 transition-transform" /> 
            <span>Nuevo Registro</span>
          </button>
        </router-link>
      </div>
    </div>

    <!-- Directorio de Movimientos -->
    <BaseCard title="Libro de Movimientos Internos" subtitle="Auditoría de ingresos operativos y disposición de egresos de caja.">
        <BaseTable :headers="headers" :data="transactions" :is-loading="isLoading">
          <tr v-for="row in transactions" :key="row.id" class="group hover:bg-white/[0.01] transition-colors border-b border-white/[0.02] last:border-0">
            
            <!-- Fecha -->
            <td class="py-5">
              <div class="flex flex-col">
                <span class="text-xs font-bold text-white/80 tracking-tight leading-tight">{{ row.date_fmt }}</span>
                <span class="text-[0.6rem] font-black text-white/20 uppercase tracking-widest mt-0.5">{{ row.created_at.split(',')[1] }}</span>
              </div>
            </td>

            <!-- Contraparte -->
            <td>
              <div class="flex flex-col">
                <span class="text-sm font-bold text-white group-hover:text-primary transition-colors leading-tight">{{ row.person_name }}</span>
                <span class="text-[0.65rem] font-black text-white/20 uppercase tracking-tighter mt-0.5">{{ row.dueño || 'No especificado' }}</span>
              </div>
            </td>

            <!-- Clasificación -->
            <td>
              <span class="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-[0.65rem] font-bold text-white/50 uppercase tracking-tight">
                {{ row.category }}
              </span>
            </td>

            <!-- Cuenta -->
            <td>
               <div class="flex items-center gap-2">
                 <div class="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                 <span class="text-xs font-bold text-white/60 tracking-tight">{{ row.account_name }}</span>
               </div>
            </td>

            <!-- Monto -->
            <td>
              <div class="flex items-baseline gap-1" :class="row.is_income ? 'text-success' : 'text-danger/70'">
                <span class="text-[0.65rem] font-black">{{ row.is_income ? '+' : '-' }}</span>
                <span class="text-base font-black tracking-tighter">{{ row.amount_fmt.split('.')[0] }}</span>
                <span class="text-[0.65rem] font-bold opacity-40">.{{ row.amount_fmt.split('.')[1] || '00' }}</span>
              </div>
            </td>

            <!-- Acciones -->
            <td>
              <div class="flex justify-end pr-2 opacity-10 group-hover:opacity-100 transition-opacity duration-300">
                <button 
                  @click="openModal(row.id)" 
                  class="w-9 h-9 rounded-xl bg-white/5 text-white/40 flex items-center justify-center transition-all hover:bg-white/10 hover:text-white active:scale-95 border border-white/5"
                  title="Ver Detalle Técnico"
                >
                  <FontAwesomeIcon icon="fa-solid fa-fingerprint" />
                </button>
              </div>
            </td>
          </tr>
        </BaseTable>

        <template #footer>
          <div class="flex justify-between items-center px-4 py-2">
             <div class="text-[0.65rem] font-black text-white/10 uppercase tracking-widest hidden md:block">
               Sincronización de caja operativa lista
             </div>
             <Pagination :pagination="pagination" @change-page="fetchTransactions" />
          </div>
        </template>
    </BaseCard>

    <!-- Modal Premium -->
    <BaseModal :show="showDetailModal" title="Auditoría de Movimiento" @close="showDetailModal = false">
      <div v-if="isLoadingDetail" class="py-12 flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p class="text-[0.6rem] font-black uppercase text-white/20 tracking-[0.3em]">Recuperando registros...</p>
      </div>

      <div v-else-if="selectedTx" class="space-y-8 py-2">
        
        <!-- Impacto Financiero Card -->
        <div class="relative p-8 rounded-[2rem] bg-black/60 border border-white/5 overflow-hidden group">
           <div class="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-all duration-1000"></div>
           <div class="relative z-10 text-center space-y-2">
              <span class="text-[0.6rem] font-black text-white/20 uppercase tracking-[0.4em] block">Impacto en Disponibilidad</span>
              <div class="flex items-center justify-center gap-2">
                <span class="text-4xl font-black tracking-tighter" :class="selectedTx.is_income ? 'text-success' : 'text-danger'">
                  {{ selectedTx.is_income ? '+' : '-' }} {{ formatMoney(selectedTx.amount, selectedTx.currency).split('.')[0] }}
                </span>
                <span class="text-xl font-bold opacity-30 mt-2" :class="selectedTx.is_income ? 'text-success' : 'text-danger'">
                   .{{ formatMoney(selectedTx.amount, selectedTx.currency).split('.')[1] || '00' }}
                </span>
              </div>
              <span class="text-[0.6rem] font-black text-white/20 uppercase tracking-widest block pt-2">{{ selectedTx.currency }}</span>
           </div>
        </div>

        <!-- Meta Data Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 px-4">
           <div class="space-y-1">
              <label class="text-[0.55rem] font-black text-white/20 uppercase tracking-[0.2em] mb-1 block">Beneficiario / Pagador</label>
              <p class="font-bold text-white tracking-tight leading-tight">{{ selectedTx.person_name }}</p>
           </div>
           <div class="text-right space-y-1">
              <label class="text-[0.55rem] font-black text-white/20 uppercase tracking-[0.2em] mb-1 block">Clasificación</label>
              <span class="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[0.6rem] font-black text-primary uppercase">{{ selectedTx.category }}</span>
           </div>
           <div class="space-y-1">
              <label class="text-[0.55rem] font-black text-white/20 uppercase tracking-[0.2em] mb-1 block">Caja Operativa</label>
              <p class="text-xs font-bold text-white/80 tracking-tight">{{ selectedTx.account_name }}</p>
           </div>
           <div class="text-right space-y-1">
              <label class="text-[0.55rem] font-black text-white/20 uppercase tracking-[0.2em] mb-1 block">Auditor a Cargo</label>
              <p class="text-xs font-bold text-white/40 tracking-tight">{{ selectedTx.user_name }}</p>
           </div>
        </div>

        <!-- Notas Internas -->
        <div class="px-4">
          <div class="bg-white/[0.02] p-5 rounded-2xl border border-white/5 relative group">
             <FontAwesomeIcon icon="fa-solid fa-quote-left" class="absolute top-4 left-4 text-white/5 text-xl" />
             <label class="text-[0.55rem] font-black text-white/10 uppercase tracking-[0.3em] mb-3 block text-center">Notas Técnicas del Movimiento</label>
             <p class="text-xs text-white/60 leading-relaxed italic text-center px-4">
               "{{ selectedTx.description || 'Sin comentarios adicionales registrados en este movimiento.' }}"
             </p>
          </div>
        </div>

        <!-- Acciones de Modal -->
        <div class="flex gap-4 pt-4 border-t border-white/5">
           <button 
             @click="downloadReceipt(selectedTx.id)" 
             class="flex-1 bg-primary text-secondary px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-primary-dark hover:shadow-lg active:scale-95 flex items-center justify-center gap-3"
           >
             <FontAwesomeIcon icon="fa-solid fa-download" />
             Descargar Recibo
           </button>
           <button 
             @click="showDetailModal = false" 
             class="px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 font-black text-xs uppercase tracking-widest transition-all border border-white/5 active:scale-95"
           >
             Cerrar
           </button>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<style scoped>
.text-gradient-primary {
  background: linear-gradient(135deg, #f7a600, #ffdf6d);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.animate-premium-in {
  animation: slideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>