<script setup>
import { ref, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

import api from '@/services/api'
import notify from '@/services/notify'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
// Nota: 'date-fns' no está en los archivos, se asume que usa un formato local
// import { format } from 'date-fns'

import BaseTable from '@/components/ui/BaseTable.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import Pagination from '@/components/ui/Pagination.vue'
import BaseCard from '@/components/shared/BaseCard.vue'
import RateFormModal from '@/components/shared/ExchangeRateFormModal.vue'

const authStore = useAuthStore()
const permissionKey = 'manage_rates'

// Estado del Modal (Ahora gestiona edición también)
const showRateModal = ref(false)
const rateIdToEdit = ref(null) // Usado para edición

// Estado de la Lista
const rates = ref([])
const pagination = ref({})
const filters = ref({})
const isLoading = ref(false)

const tableHeaders = [
  { key: 'from_currency', label: 'Origen' },
  { key: 'to_currency', label: 'Destino' },
  { key: 'rate', label: 'Tasa (1 Origen = X Destino)' },
  { key: 'active', label: 'Estado' },
  { key: 'created_at', label: 'Fecha de Registro' },
]

/**
 * Carga la lista de tasas de cambio históricas.
 */
const fetchRates = async (page = 1) => {
  isLoading.value = true
  const params = { page: page, ...filters.value }

  try {
    const response = await api.get('/rates', { params })
    rates.value = response.data.data
    const { data, ...pagData } = response.data
    pagination.value = pagData
  } catch (error) {
    notify.error('Error al cargar la lista de tasas.')
  } finally {
    isLoading.value = false
  }
}

const openCreateModal = () => {
  rateIdToEdit.value = null // Modo Creación
  showRateModal.value = true
}

// 🚨 NUEVA FUNCIÓN: Abre el modal en modo edición
const openEditModal = (rateId) => {
  rateIdToEdit.value = rateId // Pasa el ID para cargar los datos
  showRateModal.value = true
}

watch(filters, () => fetchRates(1), { deep: true })
onMounted(() => {
  fetchRates()
})
</script>

<template>
  <div class="rates-list">
    <div class="header-actions">
      <h1>Historial de Tasas de Cambio</h1>
      <button v-if="authStore.can(permissionKey)" @click="openCreateModal" class="btn-primary">
        <FontAwesomeIcon icon="fa-solid fa-plus-circle" /> Registrar Nueva Tasa
      </button>
    </div>

    <FilterBar @update:filters="filters = $event" />

    <BaseCard title="Tasas Históricas">
      <template v-if="rates && rates.length > 0">
        <BaseTable :headers="tableHeaders" :data="rates" :is-loading="isLoading">
          <tr v-for="rate in rates" :key="rate.id">
            <td>{{ rate.from_currency }}</td>
            <td>{{ rate.to_currency }}</td>
            <td class="rate-value">{{ rate.rate }}</td>
            <td>
              <span :class="['rate-status', rate.is_active ? 'active' : 'inactive']">
                {{ rate.is_active ? 'Activa' : 'Reemplazada' }}
              </span>
            </td>
            <td>{{ new Date(rate.created_at).toLocaleString() }}</td>
            <td class="action-buttons">
              <template v-if="authStore.can(permissionKey)">
                <button
                  @click="openEditModal(rate.id)"
                  class="btn-icon edit"
                  title="Corregir tasa activa"
                >
                  <FontAwesomeIcon icon="fa-solid fa-pen-to-square" />
                </button>
              </template>
              <span v-else class="no-actions">N/A</span>
            </td>
          </tr>
        </BaseTable>
      </template>

      <div v-else-if="isLoading">
        <p class="loading-state">Cargando historial de tasas...</p>
      </div>

      <div v-else class="no-data-message">
        <p>
          No hay tasas de cambio registradas. Utilice el botón "Registrar Nueva Tasa" para empezar.
        </p>
      </div>

      <template #footer>
        <Pagination :pagination="pagination" @change-page="fetchRates" />
      </template>
    </BaseCard>

    <RateFormModal
      :show="showRateModal"
      :rate-id="rateIdToEdit"
      @close="showRateModal = false"
      @saved="fetchRates(1)"
    />
  </div>
</template>

<style scoped>
/* Estilos reutilizados de otros listados */
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}
.header-actions h1 {
  font-size: 1.6rem;
}
.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-secondary);
  padding: 10px 15px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: bold;
  transition: background-color 0.2s;
}
.btn-primary:hover {
  background-color: #ffc424;
}
.rate-value {
  font-weight: 600;
  color: var(--color-success);
}
.rate-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}
.rate-status.active {
  background-color: #0dcf9230;
  color: var(--color-success);
}
.rate-status.inactive {
  background-color: #aaa33030;
  color: #aaa;
}
.action-buttons {
  display: flex;
  gap: 8px;
}
.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 5px;
  transition: color 0.2s;
}
.btn-icon.edit {
  color: #3498db;
}
.btn-icon.edit:hover {
  color: #2980b9;
}
.no-actions {
  font-size: 0.85rem;
  opacity: 0.5;
}
.no-data-message,
.loading-state {
  text-align: center;
  padding: 30px;
  color: #aaa;
}
</style>
