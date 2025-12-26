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
import ProviderFormModal from '@/components/shared/ProviderFormModal.vue'
import BalanceFormModal from '@/components/shared/BalanceFormModal.vue'

const authStore = useAuthStore()
const permissionKey = 'manage_exchanges'

// Estados Modales
const showProviderModal = ref(false)
const providerIdToEdit = ref(null)
const showBalanceModal = ref(false)
const selectedProvider = ref(null)

// Datos Tabla
const providers = ref([])
const pagination = ref({})
const filters = ref({})
const isLoading = ref(false)

// Definición de Columnas
const tableHeaders = [
  { key: 'name', label: 'Proveedor / Contacto' },
  { key: 'financials', label: 'Capital vs Disponible' }, // <--- COLUMNA COMBINADA
  { key: 'contact', label: 'Contacto' },
  { key: 'status', label: 'Estado' },
  { key: 'actions', label: 'Acciones' }
]

const fetchProviders = async (page = 1) => {
  isLoading.value = true
  const params = { page: page, ...filters.value }

  try {
    const response = await api.get('/providers', { params })
    providers.value = response.data.data
    const { data, ...pagData } = response.data
    pagination.value = pagData
  } catch (error) {
    notify.error('Error al cargar proveedores.')
  } finally {
    isLoading.value = false
  }
}

// Modales
const openCreateModal = () => {
  providerIdToEdit.value = null
  showProviderModal.value = true
}

const openEditModal = (providerId) => {
  providerIdToEdit.value = providerId
  showProviderModal.value = true
}

const openBalanceModal = (provider) => {
  selectedProvider.value = provider
  showBalanceModal.value = true
}

const deleteProvider = async (providerId, providerName) => {
  if (!authStore.can(permissionKey)) return notify.error('No autorizado.')

  if (await alert.confirm(`¿Eliminar a ${providerName}?`, 'Esto afectará el historial contable.')) {
    try {
      await api.delete(`/providers/${providerId}`)
      notify.success('Eliminado correctamente.')
      fetchProviders(pagination.value.current_page)
    } catch (error) {
      console.error(error)
      notify.error('No se pudo eliminar.')
    }
  }
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0)
}

watch(filters, () => fetchProviders(1), { deep: true })
onMounted(() => fetchProviders())
</script>

<template>
  <div class="provider-list">
    <div class="header-actions">
      <h1>Proveedores</h1>
      <button v-if="authStore.can(permissionKey)" @click="openCreateModal" class="btn-primary">
        <FontAwesomeIcon icon="fa-solid fa-circle-plus" /> Nuevo Proveedor
      </button>
    </div>

    <FilterBar @update:filters="filters = $event" />

    <BaseCard>
      <BaseTable :headers="tableHeaders" :data="providers" :is-loading="isLoading">
        <tr v-for="provider in providers" :key="provider.id">

          <td>
            <div class="provider-info">
              <span class="name">{{ provider.name }}</span>
              <span class="email">{{ provider.email }}</span>
            </div>
          </td>

          <td>
            <div class="financial-cell">
              <div class="row">
                <span class="label">Deuda Total:</span>
                <span class="amount debt">{{ formatCurrency(provider.current_balance) }}</span>
              </div>
              <div class="row">
                <span class="label">Disponible:</span>
                <span :class="['amount', provider.available_balance < 0 ? 'negative' : 'positive']">
                  {{ formatCurrency(provider.available_balance) }}
                </span>
              </div>
            </div>
          </td>

          <td>
            <div class="contact-info">
              <span v-if="provider.phone">{{ provider.phone }}</span>
              <span v-if="provider.contact_person" class="contact-person">
                <FontAwesomeIcon icon="fa-solid fa-user-tag" /> {{ provider.contact_person }}
              </span>
            </div>
          </td>

          <td>
            <span :class="['status-badge', provider.is_active ? 'active' : 'inactive']">
              {{ provider.is_active ? 'Activo' : 'Inactivo' }}
            </span>
          </td>

          <td class="actions-cell">
            <template v-if="authStore.can(permissionKey)">
              <button @click="openBalanceModal(provider)" class="btn-icon money" title="Gestionar Saldo">
                <FontAwesomeIcon icon="fa-solid fa-wallet" />
              </button>

              <button @click="openEditModal(provider.id)" class="btn-icon edit" title="Editar">
                <FontAwesomeIcon icon="fa-solid fa-pen" />
              </button>

              <button @click="deleteProvider(provider.id, provider.name)" class="btn-icon delete" title="Eliminar">
                <FontAwesomeIcon icon="fa-solid fa-trash" />
              </button>
            </template>
          </td>

        </tr>
      </BaseTable>

      <template #footer>
        <Pagination :pagination="pagination" @change-page="fetchProviders" />
      </template>
    </BaseCard>

    <ProviderFormModal :show="showProviderModal" :provider-id="providerIdToEdit" @close="showProviderModal = false"
      @saved="fetchProviders(pagination.current_page)" />

    <BalanceFormModal :show="showBalanceModal" resource="providers" :entity-id="selectedProvider?.id"
      :entity-name="selectedProvider?.name" :available-balance="selectedProvider?.available_balance"
      @close="showBalanceModal = false" @saved="fetchProviders(pagination.current_page)" />
  </div>
</template>

<style scoped>
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.btn-primary {
  background: var(--color-primary);
  color: #000;
  padding: 10px 15px;
  border-radius: 6px;
  font-weight: bold;
  border: none;
  cursor: pointer;
}

/* Estilos de Celdas */
.provider-info {
  display: flex;
  flex-direction: column;
}

.provider-info .name {
  font-weight: bold;
  color: #fff;
}

.provider-info .email {
  font-size: 0.85rem;
  color: #aaa;
}

.contact-info {
  display: flex;
  flex-direction: column;
  font-size: 0.9rem;
}

.contact-person {
  color: #888;
  font-size: 0.8rem;
  margin-top: 2px;
}

/* 🔥 ESTILOS FINANCIEROS 🔥 */
.financial-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.9rem;
}

.financial-cell .row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.financial-cell .label {
  color: #888;
  font-size: 0.8rem;
}

.financial-cell .debt {
  color: #ccc;
  font-weight: bold;
}

/* Deuda en Gris/Blanco */
.financial-cell .positive {
  color: #27ae60;
  font-weight: bold;
}

/* Disponible Verde */
.financial-cell .negative {
  color: #c0392b;
  font-weight: bold;
}

/* Disponible Rojo */

/* Badges */
.status-badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
}

.status-badge.active {
  background: rgba(39, 174, 96, 0.2);
  color: #27ae60;
}

.status-badge.inactive {
  background: rgba(192, 57, 43, 0.2);
  color: #c0392b;
}

/* Botones */
.actions-cell {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 5px;
  transition: 0.2s;
}

.btn-icon.money {
  color: #f1c40f;
}

/* Amarillo dinero */
.btn-icon.money:hover {
  color: #f39c12;
  background: rgba(241, 196, 15, 0.1);
  border-radius: 4px;
}

.btn-icon.edit {
  color: #3498db;
}

.btn-icon.delete {
  color: #e74c3c;
}
</style>