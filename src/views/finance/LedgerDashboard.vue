<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useTransactionStore } from '@/stores/transaction'
import api from '@/services/api'
import notify from '@/services/notify'

import BaseTable from '@/components/ui/BaseTable.vue'
import BaseModal from '@/components/shared/BaseModal.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const transactionStore = useTransactionStore()

// --- ESTADO ---
const loading = ref(false)
const activeTab = ref('payable')
const summary = ref({ payable_total: 0, receivable_total: 0 })
const entries = ref([])

// --- FILTROS ---
const searchQuery = ref('')
const startDate = ref('')
const endDate = ref('')

// --- MODAL ABONO ---
const showPayModal = ref(false)
const selectedEntry = ref(null)
const paymentForm = ref({
  account_id: '',
  amount: '',
  description: '',
})
const isProcessing = ref(false)

// --- COMPUTADAS ---
const accountsOptions = computed(() => transactionStore.getAccounts)

// Headers (sin "Acciones" porque BaseTable la agrega sola)
const headers = [
  { key: 'date', label: 'Fecha' },
  { key: 'entity', label: 'Entidad' },
  { key: 'description', label: 'Descripción' },
  { key: 'ref', label: 'Referencia' },
  { key: 'amounts', label: 'Montos' },
  { key: 'status', label: 'Estado' },
]

// --- CARGA DE DATOS ---
const fetchDashboard = async () => {
  loading.value = true
  try {
    // Resumen
    const { data: summaryData } = await api.get('/ledger/summary')
    summary.value = summaryData

    // Listado con filtros
    const params = {
      type: activeTab.value,
      search: searchQuery.value.trim() || undefined,
      start_date: startDate.value || undefined,
      end_date: endDate.value || undefined,
      include_paid: false,
    }

    const { data: response } = await api.get('/ledger', { params })

    entries.value = response.data.map((item) => {
      const amount = parseFloat(item.amount || 0)
      const original = parseFloat(item.original_amount || amount)
      const paid = parseFloat(item.paid_amount || 0)
      const pending = Math.max(0, original - paid)

      let displayStatus = 'Pendiente'
      if (pending <= 0.01) {
        displayStatus = 'Pagado'
      } else if (paid > 0) {
        displayStatus = 'Parcial'
      }

      return {
        id: item.id,
        date: new Date(item.created_at).toLocaleDateString('es-VE'),
        description: item.description,
        amount,
        original_amount: original,
        paid_amount: paid,
        pending_amount: pending,
        display_status: displayStatus,
        has_pending: pending > 0.01,

        entity_name: item.entity
          ? item.entity.name || item.entity.alias || item.entity.user?.name || 'Sin nombre'
          : '---',
        entity_type: item.entity_type ? item.entity_type.split('\\').pop() : 'Desconocido',

        tx_number: item.transaction ? item.transaction.number : 'Manual',
      }
    })
  } catch (e) {
    console.error(e)
    notify.error('Error al cargar el libro mayor')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  transactionStore.fetchAllSupportData()
  fetchDashboard()
})

// Recargar automáticamente al cambiar filtros o tab (con debounce)
watch(
  [activeTab, searchQuery, startDate, endDate],
  () => {
    fetchDashboard()
  },
  { debounce: 600 },
)

// --- ACCIONES ---
const switchTab = (tab) => {
  activeTab.value = tab
}

const clearFilters = () => {
  searchQuery.value = ''
  startDate.value = ''
  endDate.value = ''
  fetchDashboard()
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
  if (!paymentForm.value.account_id) {
    notify.warning('Selecciona una cuenta')
    return
  }
  const amount = parseFloat(paymentForm.value.amount)
  if (amount <= 0 || amount > selectedEntry.value.pending_amount) {
    notify.warning('Monto inválido')
    return
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

const getStatusClass = (status) => {
  switch (status) {
    case 'Pagado':
      return 'text-success font-bold'
    case 'Parcial':
      return 'text-primary font-bold'
    default:
      return 'text-danger font-bold'
  }
}
</script>

<template>
  <div class="ledger-dashboard">
    <h1 class="page-title">Libro Mayor - Cuentas por Pagar / Cobrar</h1>

    <!-- Resumen -->
    <div class="summary-grid">
      <div
        class="summary-card payable"
        :class="{ active: activeTab === 'payable' }"
        @click="switchTab('payable')"
      >
        <div class="icon-box"><FontAwesomeIcon icon="fa-solid fa-arrow-up" /></div>
        <div class="info">
          <h3>Por Pagar</h3>
          <div class="amount text-danger">
            ${{
              (summary.payable_total || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })
            }}
          </div>
        </div>
      </div>

      <div
        class="summary-card receivable"
        :class="{ active: activeTab === 'receivable' }"
        @click="switchTab('receivable')"
      >
        <div class="icon-box"><FontAwesomeIcon icon="fa-solid fa-arrow-down" /></div>
        <div class="info">
          <h3>Por Cobrar</h3>
          <div class="amount text-success">
            ${{
              (summary.receivable_total || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })
            }}
          </div>
        </div>
      </div>
    </div>

    <!-- Barra de Filtros -->
    <div class="filters-bar">
      <div class="filters-grid">
        <BaseInput
          v-model="searchQuery"
          label="Buscar"
          placeholder="Descripción, entidad, referencia..."
          icon="fa-solid fa-magnifying-glass"
        />

        <BaseInput v-model="startDate" label="Desde" type="date" />

        <BaseInput v-model="endDate" label="Hasta" type="date" />

        <div class="filter-actions">
          <button class="btn-refresh" @click="fetchDashboard">
            <FontAwesomeIcon icon="fa-solid fa-filter" /> Aplicar
          </button>
          <button class="btn-clear" @click="clearFilters">
            <FontAwesomeIcon icon="fa-solid fa-rotate-left" /> Limpiar
          </button>
        </div>
      </div>
    </div>

    <!-- Tabla -->
    <div class="list-section">
      <div class="list-header">
        <h2>{{ activeTab === 'payable' ? 'Cuentas por Pagar' : 'Cuentas por Cobrar' }}</h2>
        <button class="btn-refresh" @click="fetchDashboard">
          <FontAwesomeIcon icon="fa-solid fa-sync" /> Actualizar
        </button>
      </div>

      <BaseTable :headers="headers" :data="entries" :isLoading="loading">
        <tr v-for="entry in entries" :key="entry.id">
          <td>{{ entry.date }}</td>
          <td>
            <div class="entity-cell">
              <div class="entity-name">{{ entry.entity_name }}</div>
              <div class="entity-badge">{{ entry.entity_type }}</div>
            </div>
          </td>
          <td>{{ entry.description }}</td>
          <td class="font-mono">{{ entry.tx_number }}</td>
          <td>
            <div>
              <div v-if="entry.original_amount > 0">
                <strong>Original:</strong> ${{ entry.original_amount.toFixed(2) }}<br />
                <strong>Pagado:</strong> ${{ entry.paid_amount.toFixed(2) }}<br />
                <strong>Pendiente:</strong> ${{ entry.pending_amount.toFixed(2) }}
              </div>
              <div v-else>${{ entry.amount.toFixed(2) }}</div>
            </div>
          </td>
          <td>
            <span :class="getStatusClass(entry.display_status)">
              {{ entry.display_status }}
            </span>
          </td>
          <!-- Acciones -->
          <td>
            <button
              v-if="entry.has_pending"
              class="btn-pay"
              :class="{ 'btn-collect': activeTab === 'receivable' }"
              @click="openPayModal(entry)"
            >
              <FontAwesomeIcon icon="fa-solid fa-money-bill" />
              {{ activeTab === 'payable' ? 'Abonar' : 'Cobrar' }}
            </button>
            <span v-else class="text-success font-bold">Completado</span>
          </td>
        </tr>
      </BaseTable>
    </div>

    <!-- Modal Abono -->
    <BaseModal :show="showPayModal" title="Registrar Abono" @close="showPayModal = false">
      <div v-if="selectedEntry">
        <div class="modal-alert">
          <FontAwesomeIcon icon="fa-solid fa-info-circle" />
          <div>
            <strong>{{ selectedEntry.entity_name }}</strong> ({{ selectedEntry.entity_type }})<br />
            {{ selectedEntry.description }}<br />
            <strong>Saldo pendiente: ${{ selectedEntry.pending_amount.toFixed(2) }}</strong>
          </div>
        </div>

        <BaseSelect
          label="Cuenta para el movimiento"
          :options="accountsOptions"
          v-model="paymentForm.account_id"
          placeholder="Selecciona una cuenta"
          required
        />

        <BaseInput
          label="Monto a abonar"
          type="number"
          step="0.01"
          v-model.number="paymentForm.amount"
          placeholder="0.00"
          required
        />

        <BaseInput
          label="Descripción (opcional)"
          type="text"
          v-model="paymentForm.description"
          placeholder="Ej: Abono parcial vía Zelle"
        />
      </div>

      <template #footer>
        <div class="modal-footer-actions">
          <button class="btn-cancel" @click="showPayModal = false">Cancelar</button>
          <button class="btn-confirm" @click="confirmPayment" :disabled="isProcessing">
            {{ isProcessing ? 'Procesando...' : 'Confirmar Abono' }}
          </button>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.page-title {
  font-size: 1.8rem;
  color: var(--color-primary);
  margin-bottom: 30px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.summary-card {
  background: var(--color-secondary);
  padding: 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  border: 1px solid var(--color-border);
  transition: all 0.2s;
}

.summary-card:hover,
.summary-card.active {
  border-color: var(--color-primary);
}

.summary-card .icon-box {
  font-size: 2.5rem;
  opacity: 0.8;
}

.summary-card.payable .icon-box {
  color: var(--color-danger);
}
.summary-card.receivable .icon-box {
  color: var(--color-success);
}

.info h3 {
  margin: 0;
  font-size: 0.9rem;
  text-transform: uppercase;
  color: #aaa;
}

.info .amount {
  font-size: 2rem;
  font-weight: bold;
  margin: 5px 0;
}

/* Barra de filtros */
.filters-bar {
  background: var(--color-secondary);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid var(--color-border);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 15px;
  align-items: end;
}

.filter-actions {
  display: flex;
  gap: 10px;
}

.btn-refresh,
.btn-clear {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-text-light);
  padding: 10px 15px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-refresh:hover,
.btn-clear:hover {
  background: var(--color-hover);
  color: var(--color-primary);
}

/* Lista */
.list-section {
  background: var(--color-secondary);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.entity-cell {
  display: flex;
  flex-direction: column;
}

.entity-name {
  font-weight: bold;
}

.entity-badge {
  font-size: 0.7rem;
  background: #333;
  color: #aaa;
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 2px;
}

.font-mono {
  font-family: monospace;
}

.text-success {
  color: var(--color-success);
}
.text-danger {
  color: var(--color-danger);
}
.text-primary {
  color: var(--color-primary);
}

.btn-pay {
  background: var(--color-danger);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-pay:hover {
  background: #c0392b;
}

.btn-collect {
  background: var(--color-success);
  color: #000;
}

.btn-collect:hover {
  background: #27ae60;
}

/* Modal */
.modal-alert {
  background: rgba(240, 185, 11, 0.1);
  padding: 15px;
  border-radius: 6px;
  border-left: 3px solid var(--color-primary);
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 20px;
}

.modal-alert svg {
  color: var(--color-primary);
  margin-top: 3px;
}

.modal-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-cancel {
  background: transparent;
  border: 1px solid #555;
  color: #ccc;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-confirm {
  background: var(--color-primary);
  color: #000;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
