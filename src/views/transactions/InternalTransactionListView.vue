<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import BaseTable from '@/components/ui/BaseTable.vue'
import BaseModal from '@/components/shared/BaseModal.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// --- ESTADO ---
const transactions = ref([])
const isLoading = ref(false)
const pagination = ref({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })

// --- ESTADO DEL MODAL ---
const showDetailModal = ref(false)
const selectedTx = ref(null)
const isLoadingDetail = ref(false)

const headers = [
  { key: 'date', label: 'Fecha' },
  { key: 'type', label: 'Tipo' },
  { key: 'category', label: 'Categoría' },
  { key: 'account', label: 'Cuenta' },
  { key: 'amount', label: 'Monto' },
  { key: 'user', label: 'Responsable' },
  { key: 'actions', label: '' },
]

// --- HELPER: NORMALIZACIÓN DE DATOS ---
const normalizeInternalTx = (data) => {
  if (!data) return {}

  const account = data.account || {}
  const user = data.user || {}
  const isIncome = data.type === 'income'

  return {
    id: data.id,
    // Fechas
    date_raw: data.transaction_date,
    date_fmt: new Date(data.transaction_date).toLocaleDateString(),
    created_at: new Date(data.created_at).toLocaleString(),

    // Datos principales
    type: data.type,
    type_label: isIncome ? 'INGRESO' : 'EGRESO',
    is_income: isIncome,
    category: data.category || 'General',
    description: data.description || 'Sin notas adicionales',

    // Relaciones seguras
    account_name: account.name || 'Cuenta Eliminada',
    currency: account.currency_code || '',
    user_name: user.name || 'Usuario Eliminado',

    // Montos
    amount: parseFloat(data.amount || 0),
  }
}

// --- FORMATO DE MONEDA ---
const formatMoney = (amount, currency = '') => {
  const val = parseFloat(amount || 0).toFixed(2)
  return currency ? `${val} ${currency}` : val
}

// --- FETCH LISTA ---
const fetchTransactions = async (page = 1) => {
  isLoading.value = true
  try {
    const { data } = await api.get(`/transactions/internal?page=${page}`)

    transactions.value = data.data.map((tx) => {
      const norm = normalizeInternalTx(tx)
      return {
        ...tx,
        ...norm,
        amount_fmt: formatMoney(norm.amount, norm.currency),
      }
    })

    const { data: list, ...meta } = data
    pagination.value = meta
  } catch (e) {
    console.error('Error cargando caja:', e)
  } finally {
    isLoading.value = false
  }
}

// --- ABRIR MODAL ---
const openModal = async (id) => {
  showDetailModal.value = true
  isLoadingDetail.value = true
  selectedTx.value = null

  try {
    const { data } = await api.get(`/transactions/internal/${id}`) // Usa el nuevo show()
    selectedTx.value = normalizeInternalTx(data)
  } catch (e) {
    console.error(e)
    showDetailModal.value = false
  } finally {
    isLoadingDetail.value = false
  }
}

onMounted(() => fetchTransactions())
</script>

<template>
  <div class="list-view">
    <div class="list-header">
      <h1>Movimientos de Caja y Gastos</h1>
      <router-link :to="{ name: 'transaction_internal_create' }" class="btn-new">
        <FontAwesomeIcon icon="fa-solid fa-plus" /> Registrar Movimiento
      </router-link>
    </div>

    <div class="table-card">
      <BaseTable :headers="headers" :data="transactions" :is-loading="isLoading">
        <tr v-for="row in transactions" :key="row.id">
          <td>{{ row.date_fmt }}</td>
          <td>
            <span :class="['badge-type', row.is_income ? 'b-green' : 'b-red']">
              <FontAwesomeIcon
                :icon="row.is_income ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down'"
              />
              {{ row.type_label }}
            </span>
          </td>
          <td>{{ row.category }}</td>
          <td>{{ row.account_name }}</td>
          <td :class="['font-mono', row.is_income ? 'text-success' : 'text-danger']">
            {{ row.is_income ? '+' : '-' }} {{ row.amount_fmt }}
          </td>
          <td class="text-sm text-gray">{{ row.user_name }}</td>
          <td>
            <button @click="openModal(row.id)" class="btn-icon view-btn" title="Ver Detalle">
              <FontAwesomeIcon icon="fa-solid fa-eye" />
            </button>
          </td>
        </tr>
      </BaseTable>
      <Pagination :pagination="pagination" @change-page="fetchTransactions" />
    </div>

    <BaseModal
      :show="showDetailModal"
      title="Detalle de Movimiento"
      @close="showDetailModal = false"
    >
      <div v-if="isLoadingDetail" class="loading-modal">
        <FontAwesomeIcon icon="fa-solid fa-spinner" spin size="2x" />
      </div>

      <div v-else-if="selectedTx" class="modal-content-wrapper">
        <div class="modal-hero">
          <div :class="['icon-circle', selectedTx.is_income ? 'bg-success' : 'bg-danger']">
            <FontAwesomeIcon
              :icon="selectedTx.is_income ? 'fa-solid fa-sack-dollar' : 'fa-solid fa-receipt'"
            />
          </div>
          <h2>
            {{ selectedTx.is_income ? '+' : '-' }}
            {{ formatMoney(selectedTx.amount, selectedTx.currency) }}
          </h2>
          <span :class="['badge-lg', selectedTx.is_income ? 't-green' : 't-red']">
            {{ selectedTx.type_label }} - {{ selectedTx.category }}
          </span>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <label>Cuenta Afectada</label>
            <p>{{ selectedTx.account_name }}</p>
          </div>
          <div class="info-item">
            <label>Fecha del Movimiento</label>
            <p>{{ selectedTx.date_fmt }}</p>
          </div>
          <div class="info-item">
            <label>Registrado Por</label>
            <p>{{ selectedTx.user_name }}</p>
          </div>
          <div class="info-item">
            <label>Fecha de Registro</label>
            <p>{{ selectedTx.created_at }}</p>
          </div>
          <div class="info-item full-width">
            <label>Descripción / Notas</label>
            <div class="desc-box">
              {{ selectedTx.description }}
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn-close" @click="showDetailModal = false">Cerrar</button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
/* Layout */
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
}
.view-btn:hover {
  color: var(--color-primary);
}

/* Tabla */
.table-card {
  background: var(--color-secondary);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--color-border);
}
.font-mono {
  font-family: monospace;
  font-weight: bold;
}
.text-sm {
  font-size: 0.85rem;
}
.text-gray {
  color: #999;
}

/* Badges Tabla */
.badge-type {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: bold;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.b-green {
  background: rgba(14, 203, 129, 0.2);
  color: #0ecb81;
  border: 1px solid #0ecb81;
}
.b-red {
  background: rgba(246, 70, 93, 0.2);
  color: #f6465d;
  border: 1px solid #f6465d;
}

.text-success {
  color: var(--color-success);
}
.text-danger {
  color: var(--color-danger);
}

/* --- Estilos Modal --- */
.loading-modal {
  text-align: center;
  padding: 40px;
  color: #888;
}

.modal-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid #333;
}
.icon-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  margin-bottom: 10px;
  color: #fff;
}
.bg-success {
  background: var(--color-success);
}
.bg-danger {
  background: var(--color-danger);
}

.modal-hero h2 {
  font-size: 2rem;
  margin: 5px 0;
  color: #fff;
}
.badge-lg {
  font-size: 0.9rem;
  font-weight: bold;
  text-transform: uppercase;
}
.t-green {
  color: var(--color-success);
}
.t-red {
  color: var(--color-danger);
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}
.info-item label {
  font-size: 0.75rem;
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
.full-width {
  grid-column: 1 / -1;
}

.desc-box {
  background: #111;
  padding: 10px;
  border-radius: 6px;
  color: #ccc;
  font-size: 0.9rem;
  min-height: 60px;
  border: 1px solid #333;
}

.btn-close {
  width: 100%;
  background: transparent;
  border: 1px solid #555;
  color: #ccc;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 10px;
}
.btn-close:hover {
  background: #333;
  color: #fff;
}
</style>
