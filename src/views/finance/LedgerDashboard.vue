<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTransactionStore } from '@/stores/transaction' // Para sacar las cuentas disponibles
import api from '@/services/api'
import notify from '@/services/notify'

// Componentes UI
import BaseTable from '@/components/ui/BaseTable.vue'
import BaseModal from '@/components/shared/BaseModal.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const transactionStore = useTransactionStore()

// --- ESTADO ---
const loading = ref(false)
const activeTab = ref('payable') // 'payable' (Debo) | 'receivable' (Me deben)
const summary = ref({ payable_total: 0, receivable_total: 0, top_debts: [] })
const entries = ref([])

// --- ESTADO DEL MODAL DE PAGO ---
const showPayModal = ref(false)
const selectedDebt = ref(null)
const paymentForm = ref({ account_id: '' })
const isProcessingPayment = ref(false)

// --- COMPUTADAS ---
const accountsOptions = computed(() => transactionStore.getAccounts) // Usamos el getter del store que ya formatea el saldo

const headers = [
  { key: 'date', label: 'Fecha' },
  { key: 'entity', label: 'Entidad / Actor' },
  { key: 'desc', label: 'Descripción' },
  { key: 'ref', label: 'Ref. Operación' },
  { key: 'amount', label: 'Monto' },
  { key: 'actions', label: '' },
]

// --- CARGA DE DATOS ---
const fetchDashboard = async () => {
  loading.value = true
  try {
    // 1. Cargar Resumen (Totales)
    const resSummary = await api.get('/ledger/summary')
    summary.value = resSummary.data

    // 2. Cargar Lista según el tab activo (solo pendientes)
    const resEntries = await api.get(`/ledger?status=pending&type=${activeTab.value}`)

    entries.value = resEntries.data.data.map((item) => ({
      id: item.id,
      date: new Date(item.created_at).toLocaleDateString(),
      description: item.description,
      amount: parseFloat(item.amount),
      // Lógica para mostrar nombre de Broker/Provider/Client de forma segura
      entity_name: item.entity ? item.entity.name || item.entity.user?.name || '---' : '---',
      entity_type: item.entity_type ? item.entity_type.split('\\').pop() : '', // "Broker", "Provider"
      // Referencia a la transacción original
      tx_number: item.transaction ? item.transaction.number : '---',
      currency: item.currency_code || 'USD',
    }))
  } catch (e) {
    console.error(e)
    notify.error('Error al cargar el libro mayor')
  } finally {
    loading.value = false
  }
}

// --- ACCIONES ---
const switchTab = (tab) => {
  activeTab.value = tab
  fetchDashboard()
}

const openPayModal = (row) => {
  selectedDebt.value = row
  paymentForm.value.account_id = '' // Resetear selección
  showPayModal.value = true
}

const confirmPayment = async () => {
  if (!paymentForm.value.account_id) {
    notify.warning('Selecciona una cuenta para realizar el pago')
    return
  }

  isProcessingPayment.value = true
  try {
    // Llamada al endpoint que creamos en el backend
    await api.post(`/ledger/${selectedDebt.value.id}/pay`, {
      account_id: paymentForm.value.account_id,
    })

    notify.success('Pago registrado exitosamente')
    showPayModal.value = false
    fetchDashboard() // Recargar datos para ver que desaparece de la lista
    transactionStore.fetchAllSupportData() // Recargar saldos globales
  } catch (error) {
    // El backend puede responder "Saldo insuficiente"
    const msg = error.response?.data?.message || 'Error al procesar el pago'
    notify.error(msg)
  } finally {
    isProcessingPayment.value = false
  }
}

// Helpers
const formatMoney = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

onMounted(() => {
  fetchDashboard()
  transactionStore.fetchAllSupportData() // Asegurar que tenemos cuentas
})
</script>

<template>
  <div class="ledger-dashboard">
    <div class="header-section">
      <h1>Cuentas por Pagar y Cobrar</h1>
      <p>Gestión de comisiones pendientes y deudas operativas.</p>
    </div>

    <div class="summary-grid">
      <div
        class="summary-card payable"
        :class="{ active: activeTab === 'payable' }"
        @click="switchTab('payable')"
      >
        <div class="icon-box"><FontAwesomeIcon icon="fa-solid fa-file-invoice-dollar" /></div>
        <div class="info">
          <h3>Por Pagar</h3>
          <p class="amount text-danger">{{ formatMoney(summary.payable_total) }}</p>
          <small>Comisiones a Brokers y Proveedores</small>
        </div>
      </div>

      <div
        class="summary-card receivable"
        :class="{ active: activeTab === 'receivable' }"
        @click="switchTab('receivable')"
      >
        <div class="icon-box"><FontAwesomeIcon icon="fa-solid fa-hand-holding-dollar" /></div>
        <div class="info">
          <h3>Por Cobrar</h3>
          <p class="amount text-success">{{ formatMoney(summary.receivable_total) }}</p>
          <small>Créditos a Clientes o Comisiones ganadas</small>
        </div>
      </div>
    </div>

    <div class="list-section">
      <div class="list-header">
        <h2>Detalle: {{ activeTab === 'payable' ? 'Deudas Pendientes' : 'Cobros Pendientes' }}</h2>
        <button class="btn-refresh" @click="fetchDashboard">
          <FontAwesomeIcon icon="fa-solid fa-rotate" /> Actualizar
        </button>
      </div>

      <BaseTable :headers="headers" :data="entries" :is-loading="loading">
        <tr v-for="row in entries" :key="row.id">
          <td>{{ row.date }}</td>
          <td>
            <div class="entity-cell">
              <span class="entity-name">{{ row.entity_name }}</span>
              <span class="entity-badge">{{ row.entity_type }}</span>
            </div>
          </td>
          <td>{{ row.description }}</td>
          <td class="font-mono">{{ row.tx_number }}</td>
          <td :class="activeTab === 'payable' ? 'text-danger' : 'text-success'" class="font-bold">
            {{ formatMoney(row.amount, row.currency) }}
          </td>
          <td>
            <button v-if="activeTab === 'payable'" @click="openPayModal(row)" class="btn-pay">
              Pagar
            </button>
            <button
              v-if="activeTab === 'receivable'"
              @click="openPayModal(row)"
              class="btn-collect"
            >
              Ingresar
            </button>
          </td>
        </tr>
      </BaseTable>
    </div>

    <BaseModal :show="showPayModal" title="Procesar Pago/Cobro" @close="showPayModal = false">
      <div v-if="selectedDebt" class="payment-modal-content">
        <div class="modal-alert">
          <FontAwesomeIcon icon="fa-solid fa-circle-info" />
          <p>
            Estás a punto de {{ activeTab === 'payable' ? 'pagar' : 'ingresar' }}
            <strong>{{ formatMoney(selectedDebt.amount, selectedDebt.currency) }}</strong>
            {{ activeTab === 'payable' ? 'a' : 'de' }}
            <strong>{{ selectedDebt.entity_name }}</strong
            >.
          </p>
        </div>

        <div class="form-group">
          <label>
            {{
              activeTab === 'payable'
                ? '¿De qué cuenta sale el dinero?'
                : '¿A qué cuenta entra el dinero?'
            }}
          </label>
          <BaseSelect
            v-model="paymentForm.account_id"
            :options="accountsOptions"
            label-by="name"
            track-by="id"
            placeholder="Seleccione una cuenta..."
          />
        </div>

        <div class="modal-footer-actions">
          <button class="btn-cancel" @click="showPayModal = false">Cancelar</button>
          <button class="btn-confirm" @click="confirmPayment" :disabled="isProcessingPayment">
            {{ isProcessingPayment ? 'Procesando...' : 'Confirmar Operación' }}
          </button>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<style scoped>
.ledger-dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  color: var(--color-text-light);
}
.header-section {
  margin-bottom: 30px;
}
.header-section h1 {
  color: var(--color-primary);
  margin-bottom: 5px;
}
.header-section p {
  opacity: 0.7;
}

/* Cards Resumen */
.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 40px;
}
.summary-card {
  background: var(--color-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  transition: 0.2s;
}
.summary-card:hover {
  transform: translateY(-3px);
}
.summary-card.active {
  border-color: var(--color-primary);
  background: rgba(255, 255, 255, 0.03);
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

/* Tabla */
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
.btn-refresh {
  background: none;
  border: 1px solid #555;
  color: #ccc;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}
.btn-refresh:hover {
  color: #fff;
  border-color: #fff;
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
  width: fit-content;
  margin-top: 2px;
}

.font-mono {
  font-family: monospace;
}
.font-bold {
  font-weight: bold;
}
.text-danger {
  color: var(--color-danger);
}
.text-success {
  color: var(--color-success);
}

/* Botones Acción Tabla */
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
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
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
