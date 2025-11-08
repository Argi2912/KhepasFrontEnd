// src/views/transactions/CurrencyExchangeListView.vue

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTransactionStore } from '@/stores/transaction'
import api from '@/services/api'
import notify from '@/services/notify'
import BaseCard from '@/components/shared/BaseCard.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const router = useRouter()
const transactionStore = useTransactionStore()

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
  search: '', // Del FilterBar
  start_date: null, // Del FilterBar
  end_date: null, // Del FilterBar
})

// --- CONFIGURACIÓN DE LA TABLA ---
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

// --- GETTERS DE DATOS DE APOYO PARA FILTROS ---
const clientsOptions = computed(() =>
  transactionStore.getClients.map((c) => ({ id: c.id, name: c.name })),
)

const brokersOptions = computed(() =>
  transactionStore.getBrokers.map((b) => ({
    id: b.id,
    name: b.name.split('(')[0].trim(),
  })),
)

// --- ACCIONES ---

/**
 * Carga las transacciones aplicando los filtros actuales.
 */
const fetchCurrencyExchanges = async (page = 1) => {
  loading.value = true

  const params = {
    page: page,
    ...combinedFilters.value,
  }

  try {
    // 🚨 CORRECCIÓN DE RUTA: Usa el endpoint correcto: /transactions/currency-exchange
    const response = await api.get('/transactions/currency-exchange', { params })

    // Mapeo de datos robusto para prevenir fallos en el renderizado
    exchanges.value = response.data.data.map((ex) => {
      // 🚨 INFERIR DIVISAS: Extraer la divisa del nombre de la cuenta (Ej: "Mercantil (VES)" -> "VES")
      const fromCurrencyMatch = ex.from_account?.name?.match(/\((.*?)\)/)
      const toCurrencyMatch = ex.to_account?.name?.match(/\((.*?)\)/)

      const from_currency = fromCurrencyMatch ? fromCurrencyMatch[1] : (ex.from_currency ?? 'USD')
      const to_currency = toCurrencyMatch ? toCurrencyMatch[1] : (ex.to_currency ?? 'USD')

      // Los campos 'amount_sent' y 'status' pueden faltar en el JSON de respuesta.
      const amount_sent = ex.amount_sent ?? null

      return {
        ...ex,
        // Formateo de montos usando el helper del store
        sent_amount: transactionStore.formatCurrency(amount_sent, from_currency),
        received_amount: transactionStore.formatCurrency(ex.amount_received, to_currency),

        // Acceso seguro a propiedades anidadas
        client: ex.client?.name ?? `ID ${ex.client_id ?? 'N/A'}`,
        // El JSON de ejemplo no tiene 'broker.user', usamos un fallback
        broker: ex.broker?.user?.name ?? `ID ${ex.broker_id ?? 'N/A'}`,

        created_at: ex.created_at ? new Date(ex.created_at).toLocaleDateString() : 'N/A',
        exchange_rate: ex.exchange_rate ? parseFloat(ex.exchange_rate).toFixed(4) : 'N/A',
        status: ex.status ?? 'pending', // Asume 'pending' si el campo 'status' no existe
      }
    })

    // Actualiza el objeto de paginación
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
  // Fusión de los filtros del BaseSelect y el FilterBar
  combinedFilters.value = {
    ...combinedFilters.value,
    ...newBarFilters,
  }
  // Recargar desde la página 1 cada vez que cambian los filtros
  fetchCurrencyExchanges(1)
}

/**
 * Maneja el cambio de página desde el componente Pagination.vue
 */
const handlePageChange = (page) => {
  fetchCurrencyExchanges(page)
}

// --- CICLO DE VIDA ---

onMounted(async () => {
  // Asegura que los datos de apoyo para los filtros estén cargados
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
            <router-link
              :to="{ name: 'transaction_exchange_show', params: { id: ex.id } }"
              class="action-btn view-btn"
            >
              <FontAwesomeIcon icon="fa-solid fa-eye" />
            </router-link>
          </td>
        </tr>
      </BaseTable>

      <Pagination :pagination="pagination" @change-page="handlePageChange" />
    </BaseCard>
  </div>
</template>

<style scoped>
/* Estilos adicionales si son necesarios */
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
</style>
