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

const filteredAccounts = computed(() => {
  if (!selectedEntry.value || !selectedEntry.value.currency_code) {
    return transactionStore.getAccounts
  }
  // Filtra las cuentas que tengan la misma moneda que la deuda
  return transactionStore.getAccounts.filter(
    (acc) => acc.currency === selectedEntry.value.currency_code,
  )
})

// Headers de la tabla
const headers = [
  { key: 'date', label: 'Fecha' },
  { key: 'entity', label: 'Entidad' },
  { key: 'description', label: 'Descripción' },
  { key: 'ref', label: 'Referencia' },
  { key: 'amounts', label: 'Montos' },
  { key: 'status', label: 'Estado' },
]

// --- HELPERS VISUALES ---
const formatMoney = (amount, currency = 'USD') => {
  return Number(amount).toLocaleString('en-US', {
    style: 'currency',
    currency: currency,
  })
}

// --- CARGA DE DATOS ---
const fetchDashboard = async () => {
  loading.value = true
  try {
    const { data: summaryData } = await api.get('/ledger/summary')
    summary.value = summaryData

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

      let prettyType = 'Desconocido'
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

watch(
  [activeTab, searchQuery, startDate, endDate],
  () => {
    fetchDashboard()
  },
  { debounce: 600 },
)

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
</script>

<template>
  <div class="ledger-dashboard">
    <h1 class="page-title">Libro Mayor - Cuentas por Pagar / Cobrar</h1>

    <div class="summary-grid">
      <div
        class="summary-card payable"
        :class="{ active: activeTab === 'payable' }"
        @click="switchTab('payable')"
      >
        <div class="icon-box">
          <FontAwesomeIcon icon="fa-solid fa-arrow-up" />
        </div>
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
        <div class="icon-box">
          <FontAwesomeIcon icon="fa-solid fa-arrow-down" />
        </div>
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

    <div class="filters-bar">
      <div class="filters-flex">
        <div class="filter-item search-input">
          <BaseInput
            v-model="searchQuery"
            label="Buscar"
            placeholder="Descripción, entidad, referencia..."
            icon="fa-solid fa-magnifying-glass"
          />
        </div>

        <div class="filter-item date-input">
          <BaseInput v-model="startDate" label="Desde" type="date" />
        </div>

        <div class="filter-item date-input">
          <BaseInput v-model="endDate" label="Hasta" type="date" />
        </div>

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

    <div class="list-section">
      <div class="list-header">
        <h2>{{ activeTab === 'payable' ? 'Cuentas por Pagar' : 'Cuentas por Cobrar' }}</h2>
        <button class="btn-refresh" @click="fetchDashboard">
          <FontAwesomeIcon icon="fa-solid fa-sync" /> Actualizar
        </button>
      </div>

      <BaseTable :headers="headers" :data="entries" :isLoading="loading">
        <tr v-for="entry in entries" :key="entry.id">
          <td class="text-secondary">{{ entry.date }}</td>
          <td>
            <div class="entity-cell">
              <span class="entity-name">{{ entry.entity_name }}</span>
              <span class="entity-badge">{{ entry.entity_type }}</span>
            </div>
          </td>
          <td class="desc-cell">
            <span :title="entry.description">{{ entry.description }}</span>
          </td>
          <td>
            <span class="ref-tag">{{ entry.tx_number }}</span>
          </td>
          <td class="amount-cell">
            <div
              class="main-amount"
              :class="activeTab === 'payable' ? 'text-danger' : 'text-success'"
            >
              {{ formatMoney(entry.pending_amount, entry.currency_code) }}
            </div>
            <div class="sub-amount">
              <span v-if="entry.paid_amount > 0">
                Pagado: {{ formatMoney(entry.paid_amount, entry.currency_code) }}
              </span>
              <span class="total-line">
                Original: {{ formatMoney(entry.original_amount, entry.currency_code) }}
              </span>
            </div>
          </td>
          <td>
            <span :class="['status-pill', entry.display_status.toLowerCase()]">
              {{ entry.display_status }}
            </span>
          </td>
          <td class="actions-cell">
            <button v-if="entry.has_pending" class="btn-action" @click="openPayModal(entry)">
              {{ activeTab === 'payable' ? 'Abonar' : 'Cobrar' }}
            </button>
            <span v-else class="check-icon">✔</span>
          </td>
        </tr>
      </BaseTable>
    </div>

    <BaseModal :show="showPayModal" title="Registrar Abono" @close="showPayModal = false">
      <div v-if="selectedEntry">
        <div class="modal-alert">
          <FontAwesomeIcon icon="fa-solid fa-info-circle" />
          <div>
            <strong>{{ selectedEntry.entity_name }}</strong> ({{ selectedEntry.entity_type }})<br />
            {{ selectedEntry.description }}<br />
            <strong
              >Saldo pendiente:
              {{ formatMoney(selectedEntry.pending_amount, selectedEntry.currency_code) }}</strong
            >
          </div>
        </div>

        <BaseSelect
          label="Cuenta para el movimiento"
          :options="filteredAccounts"
          v-model="paymentForm.account_id"
          placeholder="Selecciona una cuenta"
          required
        />

        <p v-if="filteredAccounts.length === 0" class="text-danger text-sm mt-1">
          ⚠️ No tienes cuentas en {{ selectedEntry.currency_code }} para realizar este pago.
        </p>

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
/* --- TÍTULOS Y ESTRUCTURA --- */
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
  background: #1e1e1e;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  border: 1px solid #333;
  transition: all 0.2s;
}

.summary-card:hover,
.summary-card.active {
  border-color: var(--color-primary);
  background: #252525;
}

.summary-card .icon-box {
  font-size: 2.5rem;
  opacity: 0.8;
}

.summary-card.payable .icon-box {
  color: #ff5252;
}

.summary-card.receivable .icon-box {
  color: #4caf50;
}

.info h3 {
  margin: 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  color: #888;
  letter-spacing: 1px;
}

.info .amount {
  font-size: 1.8rem;
  font-weight: bold;
  margin-top: 5px;
}

/* --- FILTROS (RENOVADO CON FLEXBOX) --- */
.filters-bar {
  background: #1e1e1e;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #333;
}

.filters-flex {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  /* La magia: alinea todo al fondo del contenedor */
  align-items: flex-end;
}

/* Controla el ancho de los inputs para que se estiren ordenadamente */
.filter-item {
  flex: 1;
  min-width: 200px;
}

/* El input de búsqueda puede ser más ancho si hay espacio */
.search-input {
  flex: 2;
  min-width: 250px;
}

.date-input {
  flex: 1;
  min-width: 150px;
}

.filter-actions {
  display: flex;
  gap: 10px;
  /* Asegura que los botones no se estiren verticalmente */
  align-self: flex-end;
  padding-bottom: 1px;
  /* Ajuste fino por si los inputs tienen bordes extraños */
}

.btn-refresh,
.btn-clear {
  background: #2c2c2c;
  border: 1px solid #444;
  color: #ccc;
  padding: 0 15px;
  /* Padding lateral */
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 42px;
  /* Altura fija estándar para coincidir con inputs */
  white-space: nowrap;
}

.btn-refresh:hover {
  background: #333;
  color: var(--color-primary);
  border-color: var(--color-primary);
}

/* --- TABLA --- */
.list-section {
  background: #1e1e1e;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #333;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

td {
  vertical-align: middle;
  padding: 12px 8px;
  border-bottom: 1px solid #2c2c2c;
}

.text-secondary {
  color: #666;
  font-size: 0.9rem;
}

.entity-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.entity-name {
  font-weight: 600;
  color: #fff;
  font-size: 0.95rem;
}

.entity-badge {
  font-size: 0.7rem;
  background: #333;
  color: #aaa;
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.desc-cell {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #ccc;
  font-size: 0.9rem;
}

.ref-tag {
  font-family: 'Consolas', monospace;
  background: #111;
  color: var(--color-primary);
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 0.85rem;
  border: 1px solid #333;
}

.amount-cell {
  text-align: right;
}

.main-amount {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 2px;
}

.sub-amount {
  font-size: 0.75rem;
  color: #666;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.total-line {
  border-top: 1px dashed #333;
  padding-top: 1px;
  margin-top: 1px;
  display: inline-block;
}

.status-pill {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
}

.status-pill.pendiente {
  background: rgba(255, 82, 82, 0.15);
  color: #ff5252;
}

.status-pill.parcial {
  background: rgba(255, 193, 7, 0.15);
  color: #ffc107;
}

.status-pill.pagado {
  background: rgba(76, 175, 80, 0.15);
  color: #4caf50;
}

.actions-cell {
  text-align: center;
}

.btn-action {
  background: transparent;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  padding: 5px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-action:hover {
  background: var(--color-primary);
  color: #000;
  font-weight: bold;
}

.check-icon {
  color: #4caf50;
  font-size: 1.2rem;
}

.text-success {
  color: #4caf50 !important;
}

.text-danger {
  color: #ff5252 !important;
}

/* --- MODAL --- */
.modal-alert {
  background: rgba(240, 185, 11, 0.1);
  padding: 15px;
  border-radius: 6px;
  border-left: 3px solid var(--color-primary);
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 20px;
  color: #ddd;
}

.modal-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-cancel {
  background: transparent;
  border: 1px solid #444;
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

.btn-refresh {
  background: #2c2c2c;
  color: #ccc;
  padding: 0 15px;
  /* Padding lateral */
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  /* Altura fija estándar para coincidir con inputs */
}
</style>
