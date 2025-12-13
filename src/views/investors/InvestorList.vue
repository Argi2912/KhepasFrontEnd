<script setup>
import { ref, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import alert from '@/services/alert'
import notify from '@/services/notify'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// Componentes UI
import BaseTable from '@/components/ui/BaseTable.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import Pagination from '@/components/ui/Pagination.vue'
import BaseCard from '@/components/shared/BaseCard.vue'
import InvestorFormModal from '@/components/shared/InvestorFormModal.vue'
import BalanceFormModal from '@/components/shared/BalanceFormModal.vue' // <--- 1. NUEVO IMPORT

const authStore = useAuthStore()
const permissionKey = 'manage_exchanges'

const showInvestorModal = ref(false)
const investorIdToEdit = ref(null)

// Estado para la Billetera (NUEVO)
const showBalanceModal = ref(false)
const selectedInvestor = ref(null)

const investors = ref([])
const pagination = ref({})
const filters = ref({})
const isLoading = ref(false)

const tableHeaders = [
  { key: 'name', label: 'Nombre Completo' },
  { key: 'alias', label: 'Alias' },
  { key: 'current_balance', label: 'Capital / Saldo' }, // <--- 2. NUEVA COLUMNA
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'status', label: 'Estado' },
  { key: 'created_at', label: 'Registrado' },
  { key: 'actions', label: '' },
]

const fetchInvestors = async (page = 1) => {
  isLoading.value = true
  const params = { page, ...filters.value }

  try {
    const response = await api.get('/investors', { params })
    investors.value = response.data.data
    const { data, ...pagData } = response.data
    pagination.value = pagData
  } catch (error) {
    console.error(error)
    notify.error('Error al cargar inversionistas.')
  } finally {
    isLoading.value = false
  }
}

const openCreateModal = () => {
  investorIdToEdit.value = null
  showInvestorModal.value = true
}

const openEditModal = (id) => {
  investorIdToEdit.value = id
  showInvestorModal.value = true
}

// NUEVO: Abrir modal de saldo
const openBalanceModal = (investor) => {
  selectedInvestor.value = investor
  showBalanceModal.value = true
}

// NUEVO: Formato de moneda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0)
}

const deleteInvestor = async (id, name) => {
  if (!authStore.can(permissionKey)) {
    notify.error('No tienes permiso para eliminar inversionistas.')
    return
  }

  const confirmed = await alert.confirm(
    `¿Eliminar al inversionista "${name}"?`,
    'Esta acción eliminará al inversionista y podría afectar reportes históricos.',
  )

  if (!confirmed) return

  try {
    await api.delete(`/investors/${id}`)
    notify.success('Inversionista eliminado correctamente.')
    fetchInvestors(pagination.value.current_page || 1)
  } catch (error) {
    const msg = error.response?.data?.data?.message || 'No se pudo eliminar.'
    notify.error(msg)
  }
}

watch(filters, () => fetchInvestors(1), { deep: true })
onMounted(() => fetchInvestors())
</script>

<template>
  <div class="investor-list">
    <div class="header-actions">
      <h1>Inversionistas</h1>
      <button v-if="authStore.can(permissionKey)" @click="openCreateModal" class="btn-primary">
        <FontAwesomeIcon icon="fa-solid fa-user-plus" /> Registrar Inversionista
      </button>
    </div>

    <FilterBar @update:filters="filters = $event" />

    <BaseCard title="Listado de Inversionistas">
      <BaseTable :headers="tableHeaders" :data="investors" :is-loading="isLoading">
        <tr v-for="investor in investors" :key="investor.id">
          <td>
            <strong>{{ investor.name }}</strong>
          </td>
          <td>
            <span class="badge" v-if="investor.alias">{{ investor.alias }}</span>
            <span v-else class="text-muted">—</span>
          </td>

          <td style="font-weight: bold; color: #27ae60;">
            {{ formatCurrency(investor.current_balance) }}
          </td>

          <td>{{ investor.email || '—' }}</td>
          <td>{{ investor.phone || '—' }}</td>
          <td>
            <span class="badge" :class="investor.is_active ? 'badge-success' : 'badge-danger'">
              {{ investor.is_active ? 'Activo' : 'Inactivo' }}
            </span>
          </td>
          <td>{{ new Date(investor.created_at).toLocaleDateString() }}</td>
          <td class="action-buttons">

            <button @click="openBalanceModal(investor)" class="btn-icon add-funds" title="Agregar Capital">
              <FontAwesomeIcon icon="fa-solid fa-wallet" />
            </button>

            <template v-if="authStore.can(permissionKey)">
              <button @click="openEditModal(investor.id)" class="btn-icon edit" title="Editar">
                <FontAwesomeIcon icon="fa-solid fa-pen-to-square" />
              </button>
              <button @click="deleteInvestor(investor.id, investor.name)" class="btn-icon delete" title="Eliminar">
                <FontAwesomeIcon icon="fa-solid fa-trash" />
              </button>
            </template>
            <span v-else class="no-actions">Sin permiso</span>
          </td>
        </tr>
      </BaseTable>

      <template #footer>
        <Pagination :pagination="pagination" @change-page="fetchInvestors" />
      </template>
    </BaseCard>

    <InvestorFormModal :show="showInvestorModal" :investor-id="investorIdToEdit" @close="showInvestorModal = false"
      @saved="fetchInvestors(pagination.current_page || 1)" />

    <BalanceFormModal :show="showBalanceModal" resource="investors" :entity-id="selectedInvestor?.id"
      :entity-name="selectedInvestor?.name" @close="showBalanceModal = false"
      @saved="fetchInvestors(pagination.current_page || 1)" />
  </div>
</template>

<style scoped>
/* Tus estilos originales */
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.header-actions h1 {
  font-size: 1.8rem;
  color: var(--color-primary);
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-primary:hover {
  background-color: #e6b800;
  transform: translateY(-1px);
}

.badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.badge-success {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

.badge-danger {
  background: rgba(220, 53, 69, 0.2);
  color: #dc3545;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: rgba(0, 0, 0, 0.05);
}

.btn-icon.edit {
  color: #3498db;
}

.btn-icon.delete {
  color: #e74c3c;
}

/* NUEVO ESTILO PARA BOTON SALDO */
.btn-icon.add-funds {
  color: #27ae60;
}

.btn-icon.add-funds:hover {
  color: #219150;
  background-color: #e8f8f5;
}

.no-actions {
  font-size: 0.8rem;
  color: #999;
  font-style: italic;
}
</style>