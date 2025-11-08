// src/views/transactions/CurrencyExchangeListView.vue

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTransactionStore } from '@/stores/transaction'
import api from '@/services/api'
import notify from '@/services/notify'

// 🚨 Componentes de UI Compartidos y de Diseño
import BaseCard from '@/components/shared/BaseCard.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import BaseModal from '@/components/shared/BaseModal.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const router = useRouter()
const transactionStore = useTransactionStore()

// --- ESTADO DEL MODAL DE DETALLE ---
const showModal = ref(false)
const selectedTransaction = ref(null)
const fetchingDetail = ref(false)

// --- ESTADO DE LA LISTA ---
const exchanges = ref([])
const loading = ref(false)
const pagination = ref({
  current_page: 1,
  last_page: 1,
  total: 0,
  from: 0,
  to: 0,
})

// --- ESTADO DE LOS FILTROS ---
const combinedFilters = ref({
  client_id: null,
  broker_id: null,
  // search, start_date, end_date serán actualizados por FilterBar
})

// --- CONFIGURACIÓN DE LA TABLA (Para BaseTable.vue) ---
const tableHeaders = [
  { key: 'number', label: '#' },
  { key: 'created_at', label: 'Fecha' },
  { key: 'client', label: 'Cliente' },
  { key: 'broker', label: 'Corredor' },
  { key: 'sent_amount', label: 'Envía' },
  { key: 'received_amount', label: 'Recibe' },
  { key: 'exchange_rate', label: 'Tasa' },
  { key: 'status', label: 'Estado' },
]

// --- GETTERS Y HELPERS ---
const clientsOptions = computed(() =>
  transactionStore.getClients.map((c) => ({ id: c.id, name: c.name })),
)

const brokersOptions = computed(() =>
  transactionStore.getBrokers.map((b) => ({
    id: b.id,
    name: b.name.split('(')[0].trim(),
  })),
)

/**
 * Helper para formatear montos en el modal de detalle, extrayendo la divisa del nombre de la cuenta.
 */
const formatDetailAmount = (amount, account) => {
  if (amount == null || !account) return 'N/A'
  // Extraer divisa: 'Mercantil (VES)' -> 'VES'
  const currencyMatch = account.name?.match(/\((.*?)\)/)
  const currency = currencyMatch ? currencyMatch[1] : 'USD'
  return transactionStore.formatCurrency(amount, currency)
}

// --- ACCIONES DE LISTA ---

/**
 * Carga las transacciones y mapea los datos para la tabla.
 */
const fetchCurrencyExchanges = async (page = 1) => {
  loading.value = true

  const params = {
    page: page,
    ...combinedFilters.value,
  }

  try {
    // URL CORREGIDA: /transactions/currency-exchange
    const response = await api.get('/transactions/currency-exchange', { params })

    exchanges.value = response.data.data.map((ex) => {
      // Lógica de inferencia de divisas y valores seguros
      const fromCurrencyMatch = ex.from_account?.name?.match(/\((.*?)\)/)
      const toCurrencyMatch = ex.to_account?.name?.match(/\((.*?)\)/)

      const from_currency = fromCurrencyMatch ? fromCurrencyMatch[1] : (ex.from_currency ?? 'USD')
      const to_currency = toCurrencyMatch ? toCurrencyMatch[1] : (ex.to_currency ?? 'USD')

      // El campo 'amount_sent' no está en el JSON de la API, lo ponemos a null/0.
      const amount_sent = ex.amount_sent ?? 0

      return {
        ...ex,
        // Datos formateados para la tabla
        sent_amount: transactionStore.formatCurrency(amount_sent, from_currency),
        received_amount: transactionStore.formatCurrency(ex.amount_received, to_currency),

        // Acceso seguro a relaciones anidadas
        client: ex.client?.name ?? `ID ${ex.client_id ?? 'N/A'}`,
        broker: ex.broker?.user?.name ?? `ID ${ex.broker_id ?? 'N/A'}`,

        created_at: ex.created_at ? new Date(ex.created_at).toLocaleDateString() : 'N/A',
        exchange_rate: ex.exchange_rate ? parseFloat(ex.exchange_rate).toFixed(4) : 'N/A',
        status: ex.status ?? 'pending', // Default para 'status'
      }
    })

    const { data, ...paginationData } = response.data
    pagination.value = paginationData
  } catch (error) {
    notify.error('Error al cargar el historial de cambios.')
    console.error('API Error:', error)
  } finally {
    loading.value = false
  }
}

/**
 * Maneja los filtros provenientes del FilterBar.vue
 */
const handleFilterBarUpdate = (newBarFilters) => {
  // Fusión de los filtros: selects (existentes) + inputs (nuevos)
  combinedFilters.value = {
    ...combinedFilters.value,
    ...newBarFilters,
  }
  // Recargar siempre desde la página 1
  fetchCurrencyExchanges(1)
}

/**
 * Maneja el cambio de página desde el componente Pagination.vue
 */
const handlePageChange = (page) => {
  fetchCurrencyExchanges(page)
}

// --- ACCIONES DE MODAL ---

/**
 * Carga los detalles de una transacción específica (el endpoint 'show') y muestra el modal.
 */
const openDetailModal = async (id) => {
  fetchingDetail.value = true
  selectedTransaction.value = null

  try {
    // Llama al endpoint SHOW para obtener todas las relaciones
    const response = await api.get(`/transactions/currency-exchange/${id}`)
    selectedTransaction.value = response.data
    showModal.value = true
  } catch (error) {
    notify.error('Error al cargar el detalle de la transacción.')
    console.error('Detail API Error:', error)
  } finally {
    fetchingDetail.value = false
  }
}

const closeDetailModal = () => {
  showModal.value = false
  selectedTransaction.value = null
}

// --- CICLO DE VIDA Y WATCHERS ---

onMounted(async () => {
  // Carga inicial de datos de apoyo (clientes, brokers)
  await transactionStore.fetchAllSupportData()
  // Carga inicial de la lista
  fetchCurrencyExchanges()
})

// Observa cambios en los selects (client_id, broker_id) para recargar la lista
watch([() => combinedFilters.value.client_id, () => combinedFilters.value.broker_id], () => {
  fetchCurrencyExchanges(1)
})
</script>

<template>
  <div class="currency-exchange-list-view">
    <h1>Historial de Solicitudes de Cambio de Divisas</h1>

    <FilterBar @update:filters="handleFilterBarUpdate" />

    <BaseCard class="mb-4">
      <h3>Filtros Adicionales</h3>
      <div class="row g-3">
        <div class="col-md-6">
          <BaseSelect
            v-model="combinedFilters.client_id"
            label="Cliente"
            name="client_id"
            :options="clientsOptions"
            label-by="name"
            track-by="id"
            placeholder="Filtrar por Cliente"
          />
        </div>
        <div class="col-md-6">
          <BaseSelect
            v-model="combinedFilters.broker_id"
            label="Corredor"
            name="broker_id"
            :options="brokersOptions"
            label-by="name"
            track-by="id"
            placeholder="Filtrar por Corredor"
          />
        </div>
      </div>
    </BaseCard>

    <BaseCard>
      <div class="d-flex justify-content-end align-items-center mb-3">
        <BaseButton @click="router.push({ name: 'transaction_exchange_create' })" variant="primary">
          <FontAwesomeIcon icon="fa-solid fa-plus" /> Nueva Transacción
        </BaseButton>
      </div>

      <BaseTable :headers="tableHeaders" :data="exchanges" :is-loading="loading">
        <tr v-for="ex in exchanges" :key="ex.id">
          <td>{{ ex.number }}</td>
          <td>{{ ex.created_at }}</td>
          <td>{{ ex.client }}</td>
          <td>{{ ex.broker }}</td>
          <td>{{ ex.sent_amount }}</td>
          <td>{{ ex.received_amount }}</td>
          <td>{{ ex.exchange_rate }}</td>
          <td>
            <span :class="['badge', `bg-${ex.status === 'completed' ? 'success' : 'warning'}`]">
              {{ ex.status }}
            </span>
          </td>
          <td>
            <button @click="openDetailModal(ex.id)" class="action-btn view-btn">
              <FontAwesomeIcon icon="fa-solid fa-eye" />
            </button>
          </td>
        </tr>
      </BaseTable>

      <Pagination :pagination="pagination" @change-page="handlePageChange" />
    </BaseCard>

    <BaseModal
      :show="showModal"
      @close="closeDetailModal"
      :title="`Detalle de Transacción ${selectedTransaction?.number ?? ''}`"
    >
      <div v-if="fetchingDetail" class="text-center p-4">
        <FontAwesomeIcon icon="fa-solid fa-spinner" spin size="2x" />
        <p class="mt-2">Cargando detalles...</p>
      </div>

      <div v-else-if="selectedTransaction" class="transaction-detail-content">
        <div class="detail-section">
          <h4 class="section-title">Información Principal</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <strong>Número:</strong> <span>{{ selectedTransaction.number }}</span>
            </div>
            <div class="detail-item">
              <strong>Fecha:</strong>
              <span>{{ new Date(selectedTransaction.created_at).toLocaleDateString() }}</span>
            </div>
            <div class="detail-item">
              <strong>Estado:</strong>
              <span
                :class="[
                  'badge',
                  `bg-${selectedTransaction.status === 'completed' ? 'success' : 'warning'}`,
                ]"
              >
                {{ selectedTransaction.status ?? 'pending' }}
              </span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4 class="section-title">Partes Involucradas</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <strong>Cliente:</strong> <span>{{ selectedTransaction.client?.name }}</span>
            </div>
            <div class="detail-item">
              <strong>Corredor:</strong>
              <span>{{ selectedTransaction.broker?.user?.name ?? 'N/A' }}</span>
            </div>
            <div class="detail-item">
              <strong>Administrador:</strong>
              <span>{{ selectedTransaction.admin_user?.name ?? 'N/A' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4 class="section-title">Movimiento y Comisiones</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <strong>Cuenta Origen:</strong>
              <span>{{ selectedTransaction.from_account?.name }}</span>
            </div>
            <div class="detail-item">
              <strong>Monto Enviado:</strong>
              <span>{{
                formatDetailAmount(
                  selectedTransaction.amount_sent,
                  selectedTransaction.from_account,
                )
              }}</span>
            </div>

            <div class="detail-item">
              <strong>Cuenta Destino:</strong>
              <span>{{ selectedTransaction.to_account?.name }}</span>
            </div>
            <div class="detail-item">
              <strong>Monto Recibido:</strong>
              <span>{{
                formatDetailAmount(
                  selectedTransaction.amount_received,
                  selectedTransaction.to_account,
                )
              }}</span>
            </div>

            <div class="detail-item">
              <strong>Comisión Cobrada:</strong>
              <span>{{ selectedTransaction.commission_charged_pct }}%</span>
            </div>
            <div class="detail-item">
              <strong>Comisión Admin:</strong>
              <span>{{ selectedTransaction.commission_admin_pct }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="!fetchingDetail" class="p-4">
        No se encontraron los detalles de la transacción.
      </div>

      <template #footer>
        <BaseButton @click="closeDetailModal" variant="secondary" :disabled="fetchingDetail">
          Cerrar
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
/* Estilos se mantienen */
.mb-4 {
  margin-bottom: 1.5rem;
}
.badge {
  padding: 0.4em 0.6em;
  border-radius: 0.375rem;
  font-size: 0.75em;
  font-weight: 700;
}
.bg-success {
  background-color: #2ecc71;
  color: #fff;
}
.bg-warning {
  background-color: #f39c12;
  color: #fff;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 5px;
  transition: color 0.2s;
}
.view-btn {
  color: var(--color-primary);
}
.view-btn:hover {
  color: #3498db;
}

/* Estilos específicos del modal de detalle */
.transaction-detail-content {
  padding: 20px;
}

.detail-section {
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--color-border);
}

.detail-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  color: var(--color-primary);
  font-size: 1.1rem;
  margin-bottom: 15px;
  font-weight: 600;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px 20px;
}

.detail-item strong {
  display: block;
  font-weight: 500;
  font-size: 0.85rem;
  opacity: 0.7;
  margin-bottom: 3px;
}

.detail-item span {
  display: block;
  font-size: 1rem;
  color: var(--color-text-light);
}
</style>
