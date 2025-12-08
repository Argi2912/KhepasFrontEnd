<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '@/services/api'
import BaseTable from '@/components/ui/BaseTable.vue'
import BaseModal from '@/components/shared/BaseModal.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useAuthStore } from '@/stores/auth'
import { useTransactionStore } from '@/stores/transaction'
import Swal from 'sweetalert2'

const authStore = useAuthStore()
const transactionStore = useTransactionStore()

// --- ESTADO ---
const exchanges = ref([])
const isLoading = ref(false)
const pagination = ref({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })

// --- ESTADO DEL MODAL ---
const showDetailModal = ref(false)
const selectedTx = ref(null)
const isLoadingDetail = ref(false)

const headers = [
  { key: 'number', label: 'Ref' },
  { key: 'date', label: 'Fecha' },
  { key: 'client', label: 'Cliente' },
  { key: 'type', label: 'Tipo' },
  { key: 'out', label: 'Salida (-)' },
  { key: 'in', label: 'Entrada (+)' },
  { key: 'status', label: 'Estado' },
  { key: 'actions', label: '' },
]

const canApprove = computed(() => {
  const user = authStore.user
  if (!user || !user.roles) return false
  const allowedRoles = ['admin', 'cajero', 'superadmin', 'admin_tenant']
  return user.roles.some((r) => allowedRoles.includes(r.name))
})

const handleDeliver = async (row) => {
  const result = await Swal.fire({
    title: '¿Confirmar Entrega?',
    text: `Se marcará la operación #${row.number} como COMPLETADA. Asegúrate de haber entregado el dinero.`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, Confirmar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#0ecb81',
    cancelButtonColor: '#d33',
  })

  if (result.isConfirmed) {
    isLoading.value = true
    try {
      await transactionStore.markAsDelivered(row.id)
      await fetchExchanges(pagination.value.current_page)
    } catch (e) {
      // Error handled in store
    } finally {
      isLoading.value = false
    }
  }
}

const formatMoney = (amount, currency = '') => {
  if (amount === null || amount === undefined) return '0.00'
  return parseFloat(amount).toFixed(2) + (currency ? ` ${currency}` : '')
}

const parseLaravelDate = (dateString) => {
  if (!dateString) return null
  const isoString = dateString.replace(' ', 'T')
  return new Date(isoString)
}

// 🚨 FUNCIÓN NORMALIZADORA (CORREGIDA) 🚨
const normalizeTransactionData = (data) => {
  const client = data.client || {}
  const broker = data.broker || {}
  const provider = data.provider || {}
  const admin = data.admin_user || data.adminUser || {}
  const fromAcc = data.from_account || data.fromAccount || {}
  const toAcc = data.to_account || data.toAccount || {}

  const buyRate = parseFloat(data.buy_rate || 0)
  const exRate = parseFloat(data.exchange_rate || 0)
  const isPurchase = buyRate > 0

  // --- CÁLCULOS FINANCIEROS ---
  const charged = parseFloat(data.commission_total_amount || 0)     // Ingreso Bruto
  const cost = parseFloat(data.commission_provider_amount || 0)     // Costo Prov
  const adminShare = parseFloat(data.commission_admin_amount || 0)  // Costo Admin
  const brokerShare = parseFloat(data.commission_broker_amount || 0)// Costo Broker

  // Utilidad Neta Real
  const netProfit = charged - cost - adminShare - brokerShare

  // Montos Base
  const amountBaseSent = parseFloat(data.amount_sent || 0)
  const amountBaseReceived = parseFloat(data.amount_received || 0)

  // ⚠️ CAMBIO AQUÍ: No sumamos la ganancia (charged).
  // Mostramos exactamente lo que se recibió (ej: $100).
  const amountTotalIn = amountBaseReceived

  const rawDate = parseLaravelDate(data.created_at)

  return {
    id: data.id,
    number: data.number,
    status: data.status,
    created_at: rawDate?.toLocaleString('es-VE') || 'N/A',
    date_fmt: rawDate?.toLocaleDateString() || 'N/A',

    type_label: isPurchase ? 'COMPRA' : 'INTERCAMBIO',
    is_purchase: isPurchase,

    client_name: client.name || 'Cliente Eliminado',
    broker_name: broker.name || 'N/A',
    provider_name: provider.name || 'N/A',
    admin_name: admin.name || 'Sistema',

    from_acc_name: fromAcc.name || 'Cuenta Origen',
    from_currency: fromAcc.currency_code || '---',
    amount_sent: amountBaseSent,

    to_acc_name: toAcc.name || 'Cuenta Destino',
    to_currency: toAcc.currency_code || '---',

    // Ambos campos reflejan el monto base puro
    amount_received: amountBaseReceived,
    amount_total_in: amountTotalIn,

    rate_used: isPurchase ? buyRate : exRate,
    rate_label: isPurchase ? 'Tasa Compra' : 'Tasa Cambio',

    comm_charged: charged,
    comm_cost: cost,
    comm_admin: adminShare,
    comm_broker: brokerShare,
    net_profit: netProfit,
  }
}

// --- API ---
const fetchExchanges = async (page = 1) => {
  isLoading.value = true
  try {
    const { data } = await api.get(`/transactions/exchanges?page=${page}`)
    exchanges.value = data.data.map((tx) => {
      const normalized = normalizeTransactionData(tx)
      return {
        ...tx,
        ...normalized,
        // Usamos amount_total_in que ahora es igual al base (100)
        amount_out_fmt: formatMoney(normalized.amount_sent, normalized.from_currency),
        amount_in_fmt: formatMoney(normalized.amount_total_in, normalized.to_currency),
      }
    })
    const { data: list, ...meta } = data
    pagination.value = meta
  } catch (e) {
    console.error('Error cargando lista:', e)
  } finally {
    isLoading.value = false
  }
}

const openModal = async (id) => {
  showDetailModal.value = true
  isLoadingDetail.value = true
  selectedTx.value = null
  try {
    const { data } = await api.get(`/transactions/exchanges/${id}`)
    selectedTx.value = normalizeTransactionData(data)
  } catch (e) {
    console.error(e)
    showDetailModal.value = false
  } finally {
    isLoadingDetail.value = false
  }
}

onMounted(() => fetchExchanges())
</script>

<template>
  <div class="list-view">
    <div class="list-header">
      <h1>Historial de Operaciones</h1>
      <router-link :to="{ name: 'transaction_exchange_create' }" class="btn-new">
        <FontAwesomeIcon icon="fa-solid fa-plus" /> Nueva Operación
      </router-link>
    </div>

    <div class="table-card">
      <BaseTable :headers="headers" :data="exchanges" :is-loading="isLoading">
        <tr v-for="row in exchanges" :key="row.id">
          <td><span class="ref-text">{{ row.number }}</span></td>
          <td>{{ row.date_fmt }}</td>
          <td>{{ row.client_name }}</td>
          <td>
            <span :class="['badge-type', row.is_purchase ? 'b-blue' : 'b-purple']">
              {{ row.type_label }}
            </span>
          </td>
          <td class="text-danger font-mono">{{ row.amount_out_fmt }}</td>
          <td class="text-success font-mono">{{ row.amount_in_fmt }}</td>
          <td>
            <span :class="['badge', `bg-${row.status === 'completed' ? 'success' : 'warning'}`]">
              {{ row.status ? row.status.toUpperCase() : '---' }}
            </span>
          </td>
          <td>
            <button @click="openModal(row.id)" class="btn-icon view-btn" title="Ver Detalle">
              <FontAwesomeIcon icon="fa-solid fa-eye" />
            </button>
            <button v-if="row.status === 'pending' && canApprove" @click="handleDeliver(row)" class="btn-icon check-btn"
              title="Confirmar Entrega">
              <FontAwesomeIcon icon="fa-solid fa-check-double" />
            </button>
          </td>
        </tr>
      </BaseTable>
      <Pagination :pagination="pagination" @change-page="fetchExchanges" />
    </div>

    <BaseModal :show="showDetailModal" title="Detalle de Transacción" @close="showDetailModal = false">
      <div v-if="isLoadingDetail" class="loading-modal">
        <FontAwesomeIcon icon="fa-solid fa-spinner" spin size="2x" />
        <p>Recuperando datos...</p>
      </div>

      <div v-else-if="selectedTx" class="modal-content-wrapper">
        <div class="modal-top-bar">
          <div class="ref-group">
            <h3>{{ selectedTx.number }}</h3>
            <span class="date">{{ selectedTx.created_at }}</span>
          </div>
          <span :class="['badge-lg', selectedTx.is_purchase ? 'b-blue' : 'b-purple']">
            {{ selectedTx.type_label }}
          </span>
        </div>

        <div class="flow-section">
          <div class="flow-card out">
            <span class="label">SALE DE ({{ selectedTx.from_acc_name }})</span>
            <span class="amount text-danger">
              - {{ formatMoney(selectedTx.amount_sent, selectedTx.from_currency) }}
            </span>
          </div>

          <div class="flow-arrow">
            <div class="arrow-line"></div>
            <FontAwesomeIcon icon="fa-solid fa-circle-right" />
            <span class="rate-pill">{{ selectedTx.rate_label }}: {{ selectedTx.rate_used }}</span>
          </div>

          <div class="flow-card in">
            <span class="label">ENTRA EN ({{ selectedTx.to_acc_name }})</span>
            <span class="amount text-success">
              + {{ formatMoney(selectedTx.amount_total_in, selectedTx.to_currency) }}
            </span>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <label>Cliente</label>
            <p>{{ selectedTx.client_name }}</p>
          </div>
          <div class="info-item">
            <label>Corredor / Broker</label>
            <p>{{ selectedTx.broker_name }}</p>
          </div>
          <div class="info-item">
            <label>Proveedor Liquidez</label>
            <p>{{ selectedTx.provider_name }}</p>
          </div>
          <div class="info-item">
            <label>Registrado Por</label>
            <p>{{ selectedTx.admin_name }}</p>
          </div>
        </div>

        <div class="financial-box">
          <h4>Desglose Financiero</h4>

          <div class="fin-row">
            <span>Comisión Cobrada (Bruto):</span>
            <strong class="text-success">+ {{ formatMoney(selectedTx.comm_charged) }}</strong>
          </div>
          <div class="fin-row" v-if="selectedTx.comm_cost > 0">
            <span>Costo Proveedor:</span>
            <strong class="text-danger">- {{ formatMoney(selectedTx.comm_cost) }}</strong>
          </div>
          <div class="fin-row" v-if="selectedTx.comm_admin > 0">
            <span>Costo Plataforma/Admin:</span>
            <strong class="text-danger">- {{ formatMoney(selectedTx.comm_admin) }}</strong>
          </div>
          <div class="fin-row" v-if="selectedTx.comm_broker > 0">
            <span>Comisión Corredor:</span>
            <strong class="text-danger">- {{ formatMoney(selectedTx.comm_broker) }}</strong>
          </div>

          <div class="fin-row total">
            <span>Utilidad Neta Real:</span>
            <strong :class="selectedTx.net_profit >= 0 ? 'text-success' : 'text-danger'">
              {{ formatMoney(selectedTx.net_profit, selectedTx.from_currency) }}
            </strong>
          </div>
        </div>
      </div>

      <div v-else class="error-state">
        <p>No se pudo cargar la información.</p>
      </div>

      <template #footer>
        <button class="btn-close" @click="showDetailModal = false">Cerrar</button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
/* --- Layout General --- */
.list-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  color: var(--color-text-light);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.list-header h1 {
  font-size: 1.6rem;
  color: var(--color-primary);
  margin: 0;
}

/* Botones */
.btn-new {
  background: var(--color-primary);
  color: #000;
  padding: 10px 20px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: 0.2s;
}

.btn-new:hover {
  background: #d4a000;
}

.btn-icon {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 1.1rem;
  transition: 0.2s;
}

.view-btn:hover {
  color: var(--color-primary);
}

.check-btn {
  color: var(--color-success);
}

.check-btn:hover {
  color: #0ecb81;
}

/* Tabla */
.table-card {
  background: var(--color-secondary);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--color-border);
}

.ref-text {
  font-family: monospace;
  font-weight: bold;
  color: #aaa;
}

.font-mono {
  font-family: monospace;
  letter-spacing: -0.5px;
}

/* Badges */
.badge-type {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: bold;
  text-transform: uppercase;
}

.b-blue {
  background: rgba(52, 152, 219, 0.2);
  color: #3498db;
  border: 1px solid #3498db;
}

.b-purple {
  background: rgba(155, 89, 182, 0.2);
  color: #9b59b6;
  border: 1px solid #9b59b6;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
}

.bg-success {
  background: rgba(14, 203, 129, 0.2);
  color: #0ecb81;
}

.bg-warning {
  background: rgba(243, 156, 18, 0.2);
  color: #f39c12;
}

/* --- Estilos Modal --- */
.loading-modal {
  text-align: center;
  padding: 40px;
  color: #888;
}

.modal-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #333;
}

.ref-group h3 {
  margin: 0;
  color: var(--color-primary);
  font-size: 1.5rem;
}

.ref-group .date {
  font-size: 0.85rem;
  color: #777;
}

.badge-lg {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: bold;
}

/* Gráfico de Flujo (Flow Chart) */
.flow-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #111;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
}

.flow-card {
  display: flex;
  flex-direction: column;
  z-index: 2;
  position: relative;
}

.flow-card.in {
  text-align: right;
}

.label {
  font-size: 0.7rem;
  color: #777;
  margin-bottom: 5px;
  text-transform: uppercase;
}

.amount {
  font-size: 1.3rem;
  font-weight: bold;
}

.flow-arrow {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.arrow-line {
  position: absolute;
  width: 60%;
  height: 2px;
  background: #333;
  top: 50%;
  z-index: 1;
}

.flow-arrow svg {
  font-size: 1.5rem;
  color: var(--color-primary);
  background: #111;
  z-index: 2;
  padding: 0 10px;
}

.rate-pill {
  margin-top: 35px;
  background: #222;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 0.75rem;
  border: 1px solid #444;
  z-index: 2;
  color: #aaa;
}

/* Grid de Información */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
}

.info-item label {
  font-size: 0.7rem;
  color: #666;
  text-transform: uppercase;
  display: block;
  margin-bottom: 4px;
}

.info-item p {
  margin: 0;
  font-weight: 600;
  color: #ddd;
}

/* Caja Financiera */
.financial-box {
  background: #1a1a1a;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #333;
}

.financial-box h4 {
  margin: 0 0 15px 0;
  font-size: 0.95rem;
  color: #aaa;
  border-bottom: 1px dashed #333;
  padding-bottom: 8px;
}

.fin-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
  margin-bottom: 6px;
}

.fin-row.total {
  border-top: 1px solid #444;
  padding-top: 12px;
  margin-top: 10px;
  font-size: 1.2rem;
}

.text-danger {
  color: var(--color-danger);
}

.text-success {
  color: var(--color-success);
}

.btn-close {
  width: 100%;
  background: transparent;
  border: 1px solid #555;
  color: #ccc;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.2s;
}

.btn-close:hover {
  background: #333;
  color: #fff;
}
</style>
