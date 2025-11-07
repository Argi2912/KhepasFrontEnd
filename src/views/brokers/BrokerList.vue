<script setup>
import { ref, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

import api from '@/services/api'
import alert from '@/services/alert'
import notify from '@/services/notify'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import BaseTable from '@/components/ui/BaseTable.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import Pagination from '@/components/ui/Pagination.vue'
import BaseCard from '@/components/shared/BaseCard.vue'
import BrokerFormModal from '@/components/shared/BrokerFormModal.vue' // 🚨 Importar Modal

const authStore = useAuthStore()
const permissionKey = 'manage_requests' // Permiso para gestionar brokers

// Estado del Modal
const showBrokerModal = ref(false)
const brokerIdToEdit = ref(null)

// Estado de la Lista
const brokers = ref([])
const pagination = ref({})
const filters = ref({})
const isLoading = ref(false)

const tableHeaders = [
  { key: 'user_name', label: 'Corredor' },
  { key: 'email', label: 'Email' },
  { key: 'commission', label: 'Comisión Base' },
  { key: 'created_at', label: 'Registro' },
]

/**
 * Carga la lista de corredores, incluyendo datos del usuario.
 */
const fetchBrokers = async (page = 1) => {
  isLoading.value = true
  const params = { page: page, ...filters.value }

  try {
    const response = await api.get('/brokers', { params })
    // Mapeamos para aplanar la data de user
    brokers.value = response.data.data.map((b) => ({
      ...b,
      user_name: b.user ? b.user.name : 'N/A',
      email: b.user ? b.user.email : 'N/A',
    }))

    const { data, ...pagData } = response.data
    pagination.value = pagData
  } catch (error) {
    notify.error('Error al cargar la lista de corredores.')
  } finally {
    isLoading.value = false
  }
}

const openCreateModal = () => {
  brokerIdToEdit.value = null
  showBrokerModal.value = true
}

const openEditModal = (brokerId) => {
  brokerIdToEdit.value = brokerId
  showBrokerModal.value = true
}

/**
 * Confirma y elimina un corredor.
 */
const deleteBroker = async (brokerId, brokerName) => {
  if (!authStore.can(permissionKey)) {
    notify.error('No tienes permiso para eliminar corredores.')
    return
  }

  const confirmed = await alert.confirm(
    `¿Eliminar al Corredor ${brokerName}?`,
    'Esta acción es irreversible y puede romper transacciones históricas.',
  )

  if (confirmed) {
    try {
      await api.delete(`/brokers/${brokerId}`)
      notify.success('Corredor eliminado correctamente.')
      fetchBrokers(pagination.value.current_page)
    } catch (error) {
      console.error('Error deleting broker:', error)
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
          <td>{{ broker.user_name }}</td>
          <td>{{ broker.email }}</td>
          <td>{{ broker.default_commission_rate }}%</td>
          <td>{{ new Date(broker.created_at).toLocaleDateString() }}</td>
          <td class="action-buttons">
            <template v-if="authStore.can(permissionKey)">
              <button @click="openEditModal(broker.id)" class="btn-icon edit" title="Editar Tasa">
                <FontAwesomeIcon icon="fa-solid fa-pen-to-square" />
              </button>
              <button
                @click="deleteBroker(broker.id, broker.user_name)"
                class="btn-icon delete"
                title="Eliminar corredor"
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
/* Estilos reutilizados de ClientList/ProviderList.vue */
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
.btn-icon.delete {
  color: var(--color-danger);
}
.btn-icon.delete:hover {
  color: #c0392b;
}
.no-actions {
  font-size: 0.85rem;
  opacity: 0.5;
}
</style>
