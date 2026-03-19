<script setup>
import BaseTable from '@/components/ui/BaseTable.vue'
import BaseModal from '@/components/shared/BaseModal.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useLedger } from '@/composables/finance/useLedger'

const {
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
  filteredAccounts,
  formatMoney,
  isInterestRow,
  fetchDashboard,
  downloadReport,
  openPayModal,
  confirmPayment,
  switchTab,
  clearFilters
} = useLedger()

const headers = [
  { key: 'date', label: 'Fecha' },
  { key: 'entity', label: 'Entidad' },
  { key: 'description', label: 'Descripción' },
  { key: 'ref', label: 'Referencia' },
  { key: 'amounts', label: 'Montos' },
  { key: 'status', label: 'Estado' },
  { key: 'actions', label: '' },
]
</script>

<template>
  <div class="ledger-dashboard animate-premium-in">
    <div class="flex justify-between items-center mb-10">
      <div>
        <h1 class="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <span class="w-1.5 h-10 bg-primary rounded-full"></span>
          Libro Mayor <span class="text-white/20">&</span> <span class="text-gradient-primary">Tesorería</span>
        </h1>
        <p class="text-white/30 text-[0.65rem] font-bold uppercase tracking-[0.2em] mt-2 ml-4">Monitor global de cuentas por pagar y cobrar</p>
      </div>
      <div class="flex gap-4">
          <button @click="downloadReport('excel')" :disabled="isDownloading" class="w-12 h-12 rounded-2xl bg-success/10 text-success border border-success/10 flex items-center justify-center hover:bg-success hover:text-white transition-all shadow-lg active:scale-95" title="Exportar Excel">
            <FontAwesomeIcon icon="fa-solid fa-file-excel" />
          </button>
          <button @click="downloadReport('pdf')" :disabled="isDownloading" class="w-12 h-12 rounded-2xl bg-danger/10 text-danger border border-danger/10 flex items-center justify-center hover:bg-danger hover:text-white transition-all shadow-lg active:scale-95" title="Exportar PDF">
            <FontAwesomeIcon icon="fa-solid fa-file-pdf" />
          </button>
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card payable" :class="{ active: activeTab === 'payable' }" @click="switchTab('payable')">
        <div class="icon-box">
          <FontAwesomeIcon icon="fa-solid fa-arrow-trend-up" />
        </div>
        <div class="info">
          <h3>TOTAL POR PAGAR</h3>
          <div class="amount text-danger">
            ${{ (summary.payable_total || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 }) }}
          </div>
        </div>
        <div class="active-indicator" v-if="activeTab === 'payable'"></div>
      </div>

      <div class="summary-card receivable" :class="{ active: activeTab === 'receivable' }" @click="switchTab('receivable')">
        <div class="icon-box">
          <FontAwesomeIcon icon="fa-solid fa-arrow-trend-down" />
        </div>
        <div class="info">
          <h3>TOTAL POR COBRAR</h3>
          <div class="amount text-success">
            ${{ (summary.receivable_total || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 }) }}
          </div>
        </div>
        <div class="active-indicator" v-if="activeTab === 'receivable'"></div>
      </div>
    </div>

    <!-- Filtros Inteligentes -->
    <div class="premium-card p-6 bg-white/[0.02] border border-white/5 mb-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
        <div class="md:col-span-2">
          <BaseInput v-model="searchQuery" label="Buscar Operación" placeholder="Entidad, descripción o referencia..." icon="fa-solid fa-magnifying-glass" />
        </div>
        <div>
          <BaseInput v-model="startDate" label="Desde" type="date" />
        </div>
        <div>
          <BaseInput v-model="endDate" label="Hasta" type="date" />
        </div>
      </div>
      <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
        <button class="px-6 py-2.5 rounded-xl bg-white/5 text-white/40 font-black text-[0.65rem] uppercase tracking-widest hover:bg-white/10 transition-all" @click="clearFilters">
          <FontAwesomeIcon icon="fa-solid fa-rotate-left" class="mr-2" /> Limpiar
        </button>
        <button class="px-8 py-2.5 rounded-xl bg-primary text-secondary font-black text-[0.65rem] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all" @click="fetchDashboard(1)">
          <FontAwesomeIcon icon="fa-solid fa-filter" class="mr-2" /> Filtrar Registros
        </button>
      </div>
    </div>

    <div class="list-section">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-black text-white px-2">
            <span class="text-primary mr-1">/</span> {{ activeTab === 'payable' ? 'Pendientes de Pago' : 'Pendientes de Cobro' }}
        </h2>
        <button class="w-10 h-10 rounded-xl bg-white/5 text-white/20 hover:text-primary transition-all" @click="fetchDashboard(paginationData.current_page || 1)">
          <FontAwesomeIcon icon="fa-solid fa-sync" :spin="loading" />
        </button>
      </div>

      <BaseTable :headers="headers" :data="entries" :isLoading="loading">
        <tr v-for="entry in entries" :key="entry.id" class="group hover:bg-white/[0.01] transition-colors border-b border-white/[0.02]">
          <td class="py-5 px-4">
            <div class="flex flex-col">
              <span class="text-xs font-black text-white/40 uppercase tracking-widest">{{ entry.date.split(' de ')[0] }}</span>
              <span class="text-[0.6rem] font-bold text-white/20">{{ entry.date.split(' de ')[1] }}</span>
            </div>
          </td>
          <td class="px-4">
            <div class="flex flex-col gap-1">
              <span class="font-bold text-white group-hover:text-primary transition-colors">{{ entry.entity_name }}</span>
              <span class="text-[0.6rem] font-black text-white/20 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded w-fit">{{ entry.entity_type }}</span>
            </div>
          </td>
          <td class="px-4 max-w-[200px]">
            <div v-if="isInterestRow(entry.description)" class="flex items-center gap-2">
              <span class="bg-primary/20 text-primary text-[0.5rem] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">Interés</span>
              <span class="text-sm text-white/60 truncate" :title="entry.description">{{ entry.description }}</span>
            </div>
            <span v-else class="text-sm text-white/60 truncate block" :title="entry.description">{{ entry.description }}</span>
          </td>
          <td class="px-4">
            <span class="font-mono text-[0.7rem] text-primary/40 bg-primary/5 px-2 py-1 rounded border border-primary/10">{{ entry.tx_number }}</span>
          </td>
          <td class="px-4 text-right">
            <div class="flex flex-col">
              <span class="text-base font-black tracking-tighter" :class="activeTab === 'payable' ? 'text-danger' : 'text-success'">
                {{ formatMoney(entry.pending_amount, entry.currency_code) }}
              </span>
              <div class="flex flex-col text-[0.6rem] font-bold text-white/20 uppercase">
                <span v-if="entry.paid_amount > 0">Abonado: {{ formatMoney(entry.paid_amount, entry.currency_code) }}</span>
                <span>Original: {{ formatMoney(entry.original_amount, entry.currency_code) }}</span>
              </div>
            </div>
          </td>
          <td class="px-4 text-center">
            <span :class="['px-3 py-1 rounded-lg text-[0.6rem] font-black uppercase tracking-widest border transition-all', 
              entry.display_status === 'Pendiente' ? 'bg-danger/5 text-danger border-danger/20' : 
              entry.display_status === 'Parcial' ? 'bg-warning/5 text-warning border-warning/20' : 
              'bg-success/5 text-success border-success/20']">
              {{ entry.display_status }}
            </span>
          </td>
          <td class="px-4 text-right">
            <button v-if="entry.has_pending" class="px-4 py-1.5 rounded-lg bg-primary/10 text-primary text-[0.65rem] font-black uppercase tracking-widest hover:bg-primary hover:text-secondary transition-all" @click="openPayModal(entry)">
              {{ activeTab === 'payable' ? 'Abonar' : 'Cobrar' }}
            </button>
            <span v-else class="text-success text-lg">
                <FontAwesomeIcon icon="fa-solid fa-circle-check" />
            </span>
          </td>
        </tr>
      </BaseTable>

      <div class="mt-8 flex justify-between items-center px-4" v-if="paginationData && paginationData.total > 0">
        <span class="text-[0.65rem] font-black text-white/10 uppercase tracking-widest hidden md:block">Registros: {{ paginationData.total }}</span>
        <Pagination :pagination="paginationData" @change-page="fetchDashboard" />
      </div>
    </div>

    <!-- Modal de Pago/Cobro -->
    <BaseModal :show="showPayModal" title="Sincronización de Pagos" @close="showPayModal = false">
      <div v-if="selectedEntry" class="space-y-8 py-2">
        <div class="bg-secondary/40 p-5 rounded-2xl border border-white/5 relative overflow-hidden">
          <div class="absolute -right-4 -top-4 text-6xl opacity-5">💰</div>
          <div class="flex flex-col gap-1 relative z-10">
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/20">Liquidación para</span>
            <span class="text-lg font-black text-white tracking-tight">{{ selectedEntry.entity_name }}</span>
            <div class="mt-4 pt-4 border-t border-white/5 flex justify-between items-baseline">
                <span class="text-[0.65rem] font-bold text-white/40 uppercase tracking-widest">Saldo Pendiente:</span>
                <span class="text-xl font-black text-primary tracking-tighter">{{ formatMoney(selectedEntry.pending_amount, selectedEntry.currency_code) }}</span>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <BaseSelect label="Cuenta para el movimiento" :options="filteredAccounts" v-model="paymentForm.account_id" placeholder="Selecciona el origen/destino..." required />
          
          <div v-if="filteredAccounts.length === 0" class="p-4 rounded-xl bg-danger/10 border border-danger/20 flex items-center gap-3 text-danger">
            <FontAwesomeIcon icon="fa-solid fa-triangle-exclamation" />
            <p class="text-[0.65rem] font-black uppercase tracking-widest">No hay cuentas disponibles en {{ selectedEntry.currency_code }}</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
             <BaseInput label="Monto a Procesar" type="number" step="0.01" v-model.number="paymentForm.amount" placeholder="0.00" required />
             <BaseInput label="Código de Referencia" type="text" v-model="paymentForm.description" placeholder="Ej: Zelle #9090" />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-4 w-full">
          <button class="flex-1 py-3 rounded-xl bg-white/5 text-white/40 font-black text-[0.65rem] uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5" @click="showPayModal = false">Cancelar</button>
          <button class="flex-2 py-3 px-8 rounded-xl bg-primary text-secondary font-black text-[0.65rem] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50" @click="confirmPayment" :disabled="isProcessing">
            <FontAwesomeIcon v-if="isProcessing" icon="fa-solid fa-circle-notch" spin class="mr-2" />
            {{ activeTab === 'payable' ? 'Confirmar Pago' : 'Confirmar Cobro' }}
          </button>
        </div>
      </template>
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

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.summary-card {
  background: rgba(255, 255, 255, 0.02);
  padding: 32px;
  border-radius: 2rem;
  display: flex;
  align-items: center;
  gap: 24px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.summary-card:hover {
  background: rgba(255, 255, 255, 0.04);
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.1);
}

.summary-card.active {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--color-primary);
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5);
}

.summary-card .icon-box {
  font-size: 2.5rem;
  opacity: 0.8;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.summary-card.payable .icon-box { color: #ff5252; }
.summary-card.receivable .icon-box { color: #4caf50; }

.info h3 {
  margin: 0;
  font-size: 0.65rem;
  font-weight: 900;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.3);
  letter-spacing: 0.2em;
}

.info .amount {
  font-size: 2.2rem;
  font-weight: 900;
  margin-top: 4px;
  letter-spacing: -0.05em;
}

.active-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 8px;
  height: 8px;
  background: var(--color-primary);
  border-radius: 50%;
  box-shadow: 0 0 12px var(--color-primary);
}

.list-section {
  background: rgba(255, 255, 255, 0.02);
  padding: 32px;
  border-radius: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  min-height: 400px;
}

.premium-card {
  border-radius: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.animate-premium-in {
  animation: slideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>