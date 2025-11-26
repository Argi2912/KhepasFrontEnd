<script setup>
import { ref, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import alert from '@/services/alert'
import notify from '@/services/notify'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// Componentes
import BaseTable from '@/components/ui/BaseTable.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import Pagination from '@/components/ui/Pagination.vue'
import BaseCard from '@/components/shared/BaseCard.vue'
import BrokerFormModal from '@/components/shared/BrokerFormModal.vue'

const authStore = useAuthStore()
const permissionKey = 'manage_exchanges' // Permiso para gestionar brokers

// Estado del Modal
const showBrokerModal = ref(false)
const brokerIdToEdit = ref(null)

// Estado de la Lista
const brokers = ref([])
const pagination = ref({})
const filters = ref({})
const isLoading = ref(false)

// 🚨 ACTUALIZADO: Headers directos
const tableHeaders = [
  { key: 'name', label: 'Corredor' },
  { key: 'email', label: 'Email' },
  { key: 'commission', label: 'Comisión Base' },
  { key: 'created_at', label: 'Registro' },
  { key: 'actions', label: '' },
]

/**
 * Carga la lista de corredores desde la API.
 */
const fetchBrokers = async (page = 1) => {
  isLoading.value = true
  const params = { page: page, ...filters.value }

  try {
    const response = await api.get('/brokers', { params })

    // 🚨 CAMBIO: Asignación directa (ya no mapeamos desde 'user')
    brokers.value = response.data.data

    // Extraer paginación
    const { data, ...pagData } = response.data
    pagination.value = pagData
  } catch (error) {
    console.error(error)
    notify.error('Error al cargar la lista de corredores.')
  } finally {
    isLoading.value = false
  }
}

// --- MODALES ---
const openCreateModal = () => {
  brokerIdToEdit.value = null
  showBrokerModal.value = true
}

const openEditModal = (brokerId) => {
  brokerIdToEdit.value = brokerId
  showBrokerModal.value = true
}

/**
 * Elimina un corredor tras confirmación.
 */
const deleteBroker = async (brokerId, brokerName) => {
  if (!authStore.can(permissionKey)) {
    notify.error('No tienes permiso para eliminar corredores.')
    return
  }

  const confirmed = await alert.confirm(
    `¿Eliminar al Corredor ${brokerName}?`,
    'Esta acción es irreversible y podría afectar el historial si no se maneja con cuidado.',
  )

  if (confirmed) {
    try {
      await api.delete(`/brokers/${brokerId}`)
      notify.success('Corredor eliminado correctamente.')
      fetchBrokers(pagination.value.current_page)
    } catch (error) {
      console.error('Error deleting broker:', error)
      notify.error('No se pudo eliminar el corredor.')
    }
  }
}

watch(filters, () => fetchBrokers(1), { deep: true })

onMounted(() => {
  fetchBrokers()
})
</script>

<template>
  <div class="broker-list">
    <div class="header-actions">
      <h1>Corredores (Brokers)</h1>
      <button v-if="authStore.can(permissionKey)" @click="openCreateModal" class="btn-primary">
        <FontAwesomeIcon icon="fa-solid fa-user-plus" /> Registrar Corredor
      </button>
    </div>

    <FilterBar @update:filters="filters = $event" />

    <BaseCard title="Listado y Tasa de Comisión">
      <BaseTable :headers="tableHeaders" :data="brokers" :is-loading="isLoading">
        <tr v-for="broker in brokers" :key="broker.id">
          <td>
            <strong>{{ broker.name }}</strong>
            <div v-if="broker.document_id" class="sub-text">{{ broker.document_id }}</div>
          </td>
          <td>{{ broker.email || '---' }}</td>
          <td>
            <span class="badge-commission">{{ broker.default_commission_rate }}%</span>
          </td>
          <td>{{ new Date(broker.created_at).toLocaleDateString() }}</td>

          <td class="action-buttons">
            <template v-if="authStore.can(permissionKey)">
              <button
                @click="openEditModal(broker.id)"
                class="btn-icon edit"
                title="Editar Corredor"
              >
                <FontAwesomeIcon icon="fa-solid fa-pen-to-square" />
              </button>
              <button
                @click="deleteBroker(broker.id, broker.name)"
                class="btn-icon delete"
                title="Eliminar Corredor"
              >
                <FontAwesomeIcon icon="fa-solid fa-trash" />
              </button>
            </template>
            <span v-else class="no-actions">No autorizado</span>
          </td>
        </tr>
      </BaseTable>

      <template #footer>
        <Pagination :pagination="pagination" @change-page="fetchBrokers" />
      </template>
    </BaseCard>

    <BrokerFormModal
      :show="showBrokerModal"
      :broker-id="brokerIdToEdit"
      @close="showBrokerModal = false"
      @saved="fetchBrokers(pagination.current_page || 1)"
    />
  </div>
</template>

<style scoped>
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}
.header-actions h1 {
  font-size: 1.6rem;
  color: var(--color-primary);
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-secondary);
  padding: 10px 15px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: bold;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  cursor: pointer;
}
.btn-primary:hover {
  background-color: #ffc424;
}

.sub-text {
  font-size: 0.75rem;
  color: #888;
}

.badge-commission {
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.9rem;
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
  transition: transform 0.2s;
}
.btn-icon:hover {
  transform: scale(1.1);
}
.btn-icon.edit {
  color: #3498db;
}
.btn-icon.delete {
  color: var(--color-danger);
}

.no-actions {
  font-size: 0.85rem;
  opacity: 0.5;
  font-style: italic;
}
</style>
