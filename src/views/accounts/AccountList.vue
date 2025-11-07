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
import AccountFormModal from '@/components/shared/AccountFormModal.vue'

const authStore = useAuthStore()
const permissionKey = 'manage_requests'

// Estado del Modal
const showAccountModal = ref(false)
const accountIdToEdit = ref(null)

// Estado de la Lista
const accounts = ref([])
const pagination = ref({})
const filters = ref({})
const isLoading = ref(false)

const tableHeaders = [
  { key: 'name', label: 'Nombre' },
  { key: 'currency_code', label: 'Divisa' },
  { key: 'balance', label: 'Balance Actual' },
  { key: 'details', label: 'Detalles' },
]

/**
 * Formatea un número a moneda (con corrección USDT).
 */
const formatCurrency = (value, currency = 'USD') => {
  if (value === null || value === undefined) value = 0

  // 🚨 CORRECCIÓN USDT: Usar USD para el formato si es USDT, ya que Intl.NumberFormat no lo soporta.
  const currencyCode = currency === 'USDT' ? 'USD' : currency

  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Carga la lista de cuentas.
 */
const fetchAccounts = async (page = 1) => {
  isLoading.value = true
  const params = { page: page, ...filters.value }

  try {
    const response = await api.get('/accounts', { params })
    accounts.value = response.data.data
    const { data, ...pagData } = response.data
    pagination.value = pagData
  } catch (error) {
    notify.error('Error al cargar la lista de cuentas.')
  } finally {
    isLoading.value = false
  }
}

const openCreateModal = () => {
  accountIdToEdit.value = null
  showAccountModal.value = true
}

const openEditModal = (accountId) => {
  accountIdToEdit.value = accountId
  showAccountModal.value = true
}

/**
 * Confirma y elimina una cuenta.
 */
const deleteAccount = async (accountId, accountName) => {
  if (!authStore.can(permissionKey)) {
    notify.error('No tienes permiso para eliminar cuentas.')
    return
  }

  const confirmed = await alert.confirm(
    `¿Eliminar cuenta ${accountName}?`,
    'Solo se pueden eliminar cuentas con balance en CERO.',
  )

  if (confirmed) {
    try {
      await api.delete(`/accounts/${accountId}`)
      notify.success('Cuenta eliminada correctamente.')
      fetchAccounts(pagination.value.current_page)
    } catch (error) {
      console.error('Error deleting account:', error)
      notify.error('No se pudo eliminar: La cuenta debe tener saldo cero.')
    }
  }
}

watch(filters, () => fetchAccounts(1), { deep: true })
onMounted(() => {
  fetchAccounts()
})
</script>

<template>
  <div class="account-list">
    <div class="header-actions">
      <h1>Cuentas de Caja Registradas</h1>
      <button v-if="authStore.can(permissionKey)" @click="openCreateModal" class="btn-primary">
        <FontAwesomeIcon icon="fa-solid fa-plus-circle" /> Crear Cuenta
      </button>
    </div>

    <FilterBar @update:filters="filters = $event" />

    <BaseCard title="Balances Actuales">
      <template v-if="accounts && accounts.length > 0">
        <BaseTable :headers="tableHeaders" :data="accounts" :is-loading="isLoading">
          <tr v-for="account in accounts" :key="account.id">
            <td>{{ account.name }}</td>
            <td>{{ account.currency_code }}</td>
            <td
              :class="{ 'text-danger': account.balance < 0, 'text-success': account.balance >= 0 }"
            >
              {{ formatCurrency(account.balance, account.currency_code) }}
            </td>
            <td>{{ account.details || 'N/A' }}</td>
            <td class="action-buttons">
              <template v-if="authStore.can(permissionKey)">
                <button
                  @click="openEditModal(account.id)"
                  class="btn-icon edit"
                  title="Editar Nombre/Detalles"
                >
                  <FontAwesomeIcon icon="fa-solid fa-pen-to-square" />
                </button>
                <button
                  @click="deleteAccount(account.id, account.name)"
                  class="btn-icon delete"
                  title="Eliminar cuenta (solo si saldo = 0)"
                >
                  <FontAwesomeIcon icon="fa-solid fa-trash" />
                </button>
              </template>
              <span v-else class="no-actions">No autorizado</span>
            </td>
          </tr>
        </BaseTable>
      </template>

      <div v-else-if="isLoading">
        <p class="loading-state">Cargando cuentas...</p>
      </div>

      <div v-else class="no-data-message">
        <p>No hay cuentas registradas. Utilice el botón "Crear Cuenta" para empezar.</p>
      </div>

      <template #footer>
        <Pagination :pagination="pagination" @change-page="fetchAccounts" />
      </template>
    </BaseCard>

    <AccountFormModal
      :show="showAccountModal"
      :account-id="accountIdToEdit"
      @close="showAccountModal = false"
      @saved="fetchAccounts(pagination.current_page || 1)"
    />
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
.no-actions {
  font-size: 0.85rem;
  opacity: 0.5;
}
.text-danger {
  color: var(--color-danger);
  font-weight: 600;
}
.text-success {
  color: var(--color-success);
  font-weight: 600;
}
.no-data-message,
.loading-state {
  text-align: center;
  padding: 30px;
  color: #aaa;
}
</style>
