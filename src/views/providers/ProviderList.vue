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
import ProviderFormModal from '@/components/shared/ProviderFormModal.vue'
import BalanceFormModal from '@/components/shared/BalanceFormModal.vue' // <--- 1. NUEVO IMPORT

const authStore = useAuthStore()
const permissionKey = 'manage_exchanges' // Usamos el permiso de transacciones

// Estado del Modal
const showProviderModal = ref(false)
const providerIdToEdit = ref(null)

// Estado del Modal de Saldo (NUEVO)
const showBalanceModal = ref(false)
const selectedProvider = ref(null)

// Estado de la Lista
const providers = ref([])
const pagination = ref({})
const filters = ref({})
const isLoading = ref(false)

const tableHeaders = [
  { key: 'name', label: 'Nombre' },
  { key: 'email', label: 'Email' },
  { key: 'current_balance', label: 'Saldo Disponible' }, // <--- 2. NUEVA COLUMNA
  { key: 'phone', label: 'Teléfono' },
  { key: 'created_at', label: 'Registro' },
]

/**
 * Carga la lista de proveedores desde la API.
 */
const fetchProviders = async (page = 1) => {
  isLoading.value = true
  const params = { page: page, ...filters.value }

  try {
    const response = await api.get('/providers', { params })
    providers.value = response.data.data
    const { data, ...pagData } = response.data
    pagination.value = pagData
  } catch (error) {
    notify.error('Error al cargar la lista de proveedores.')
  } finally {
    isLoading.value = false
  }
}

const openCreateModal = () => {
  providerIdToEdit.value = null
  showProviderModal.value = true
}

const openEditModal = (providerId) => {
  providerIdToEdit.value = providerId
  showProviderModal.value = true
}

// 3. NUEVA FUNCION: Abrir modal de saldo
const openBalanceModal = (provider) => {
  selectedProvider.value = provider
  showBalanceModal.value = true
}

// 4. NUEVA FUNCION: Formatear moneda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0)
}

/**
 * Confirma y elimina un proveedor.
 */
const deleteProvider = async (providerId, providerName) => {
  if (!authStore.can(permissionKey)) {
    notify.error('No tienes permiso para eliminar proveedores.')
    return
  }

  const confirmed = await alert.confirm(
    `¿Eliminar a ${providerName}?`,
    'Esta acción es irreversible y afectará transacciones históricas.',
  )

  if (confirmed) {
    try {
      await api.delete(`/providers/${providerId}`)
      notify.success('Proveedor eliminado correctamente.')
      fetchProviders(pagination.value.current_page)
    } catch (error) {
      console.error('Error deleting provider:', error)
    }
  }
}

watch(filters, () => fetchProviders(1), { deep: true })
onMounted(() => {
  fetchProviders()
})
</script>

<template>
  <div class="provider-list">
    <div class="header-actions">
      <h1>Proveedores Registrados</h1>
      <button v-if="authStore.can(permissionKey)" @click="openCreateModal" class="btn-primary">
        <FontAwesomeIcon icon="fa-solid fa-circle-user" /> Agregar Proveedor
      </button>
    </div>

    <FilterBar @update:filters="filters = $event" />

    <BaseCard title="Listado y Filtros">
      <BaseTable :headers="tableHeaders" :data="providers" :is-loading="isLoading">
        <tr v-for="provider in providers" :key="provider.id">
          <td>{{ provider.name }}</td>
          <td>{{ provider.email }}</td>

          <td style="font-weight: bold; color: #27ae60;">
            {{ formatCurrency(provider.current_balance) }}
          </td>

          <td>{{ provider.phone }}</td>
          <td>{{ new Date(provider.created_at).toLocaleDateString() }}</td>
          <td class="action-buttons">
            <template v-if="authStore.can(permissionKey)">

              <button @click="openBalanceModal(provider)" class="btn-icon add-funds" title="Agregar Saldo">
                <FontAwesomeIcon icon="fa-solid fa-wallet" />
              </button>

              <button @click="openEditModal(provider.id)" class="btn-icon edit">
                <FontAwesomeIcon icon="fa-solid fa-pen-to-square" />
              </button>
              <button @click="deleteProvider(provider.id, provider.name)" class="btn-icon delete">
                <FontAwesomeIcon icon="fa-solid fa-trash" />
              </button>
            </template>
            <span v-else class="no-actions">No autorizado</span>
          </td>
        </tr>
      </BaseTable>

      <template #footer>
        <Pagination :pagination="pagination" @change-page="fetchProviders" />
      </template>
    </BaseCard>

    <ProviderFormModal :show="showProviderModal" :provider-id="providerIdToEdit" @close="showProviderModal = false"
      @saved="fetchProviders(pagination.current_page || 1)" />

    <BalanceFormModal :show="showBalanceModal" resource="providers" :entity-id="selectedProvider?.id"
      :entity-name="selectedProvider?.name" @close="showBalanceModal = false"
      @saved="fetchProviders(pagination.current_page || 1)" />
  </div>
</template>

<style scoped>
/* Estilos reutilizados de ClientList.vue */
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

.btn-icon.add-funds {
  color: #27ae60;
}

.btn-icon.add-funds:hover {
  color: #219150;
  background-color: #e8f8f5;
  border-radius: 4px;
}

.no-actions {
  font-size: 0.85rem;
  opacity: 0.5;
}
</style>
