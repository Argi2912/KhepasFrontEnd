// src/views/clients/ClientList.vue (CÓDIGO COMPLETO)

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
import ClientFormModal from '@/components/shared/ClientFormModal.vue' // 🚨 IMPORTANTE

const authStore = useAuthStore()
const permissionKey = 'manage_clients'

// Estado del Modal
const showClientModal = ref(false)
const clientIdToEdit = ref(null) // Usamos null para Crear, ID para Editar

// Estado de la Lista
const clients = ref([])
const pagination = ref({})
const filters = ref({})
const isLoading = ref(false)

const tableHeaders = [
  { key: 'name', label: 'Nombre' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'created_at', label: 'Registro' },
]

/**
 * Carga la lista de clientes desde la API.
 */
const fetchClients = async (page = 1) => {
  isLoading.value = true
  const params = { page: page, ...filters.value }

  try {
    const response = await api.get('/clients', { params })
    clients.value = response.data.data
    const { data, ...pagData } = response.data
    pagination.value = pagData
  } catch (error) {
    notify.error('Error al cargar la lista de clientes.')
  } finally {
    isLoading.value = false
  }
}

/**
 * Lógica para abrir el modal en modo CREAR.
 */
const openCreateModal = () => {
  clientIdToEdit.value = null // Crear
  showClientModal.value = true
}

/**
 * Lógica para abrir el modal en modo EDITAR.
 */
const openEditModal = (clientId) => {
  clientIdToEdit.value = clientId // Editar
  showClientModal.value = true
}

/**
 * Confirma y elimina un cliente.
 */
const deleteClient = async (clientId, clientName) => {
  if (!authStore.can(permissionKey)) {
    notify.error('No tienes permiso para eliminar clientes.')
    return
  }
  // Lógica de eliminación...
  const confirmed = await alert.confirm(
    `¿Eliminar a ${clientName}?`,
    'Esta acción es irreversible y afectará transacciones históricas.',
  )

  if (confirmed) {
    try {
      await api.delete(`/clients/${clientId}`)
      notify.success('Cliente eliminado correctamente.')
      fetchClients(pagination.value.current_page)
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }
}

watch(filters, () => fetchClients(1), { deep: true })
onMounted(() => {
  fetchClients()
})
</script>

<template>
  <div class="client-list">
    <div class="header-actions">
      <h1>Clientes Registrados</h1>
      <button v-if="authStore.can(permissionKey)" @click="openCreateModal" class="btn-primary">
        <FontAwesomeIcon icon="fa-solid fa-user-plus" /> Agregar Cliente
      </button>
    </div>

    <FilterBar @update:filters="filters = $event" />

    <BaseCard title="Listado y Filtros">
      <BaseTable :headers="tableHeaders" :data="clients" :is-loading="isLoading">
        <tr v-for="client in clients" :key="client.id">
          <td>{{ client.name }}</td>
          <td>{{ client.email }}</td>
          <td>{{ client.phone }}</td>
          <td>{{ new Date(client.created_at).toLocaleDateString() }}</td>
          <td class="action-buttons">
            <template v-if="authStore.can(permissionKey)">
              <button @click="openEditModal(client.id)" class="btn-icon edit">
                <FontAwesomeIcon icon="fa-solid fa-pen-to-square" />
              </button>
              <button @click="deleteClient(client.id, client.name)" class="btn-icon delete">
                <FontAwesomeIcon icon="fa-solid fa-trash" />
              </button>
            </template>
            <span v-else class="no-actions">No autorizado</span>
          </td>
        </tr>
      </BaseTable>

      <template #footer>
        <Pagination :pagination="pagination" @change-page="fetchClients" />
      </template>
    </BaseCard>

    <ClientFormModal
      :show="showClientModal"
      :client-id="clientIdToEdit"
      @close="showClientModal = false"
      @saved="fetchClients(pagination.current_page || 1)"
    />
  </div>
</template>

<style scoped>
/* Estilos reutilizados... */
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
