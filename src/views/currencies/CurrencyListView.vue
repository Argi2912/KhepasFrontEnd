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
import CurrencyFormModal from '@/views/currencies/CurrencyFormModal.vue'

const authStore = useAuthStore()
const permissionKey = 'manage_exchanges' // Permiso para manejar divisas y tasas

// Estado del Modal
const showCurrencyModal = ref(false)
const currencyCodeToEdit = ref(null)

// Estado de la Lista
const currencies = ref([])
const pagination = ref({})
const filters = ref({})
const isLoading = ref(false)

const tableHeaders = [
  { key: 'code', label: 'Código' },
  { key: 'name', label: 'Nombre' },
  { key: 'created_at', label: 'Fecha de Creación' },
]

/**
 * Carga la lista de divisas.
 */
const fetchCurrencies = async (page = 1) => {
  isLoading.value = true
  const params = { page: page, ...filters.value }

  try {
    const response = await api.get('/currencies', { params })
    currencies.value = response.data.data
    const { data, ...pagData } = response.data
    pagination.value = pagData
  } catch (error) {
    notify.error('Error al cargar la lista de divisas.')
  } finally {
    isLoading.value = false
  }
}

const openCreateModal = () => {
  currencyCodeToEdit.value = null
  showCurrencyModal.value = true
}

const openEditModal = (code) => {
  currencyCodeToEdit.value = code
  showCurrencyModal.value = true
}

/**
 * Confirma y elimina una divisa.
 */
const deleteCurrency = async (code, name) => {
  if (!authStore.can(permissionKey)) {
    notify.error('No tienes permiso para eliminar divisas.')
    return
  }

  const confirmed = await alert.confirm(
    `¿Eliminar divisa ${code} - ${name}?`,
    'Confirmar Eliminación',
  )

  if (confirmed) {
    try {
      // Usamos el código de divisa como identificador para la API
      await api.delete(`/currencies/${code}`)
      notify.success('Divisa eliminada correctamente.')
      fetchCurrencies(pagination.value.current_page)
    } catch (error) {
      console.error('Error deleting currency:', error)
      notify.error('No se pudo eliminar: Asegúrese de que no esté en uso por cuentas o tasas.')
    }
  }
}

watch(filters, () => fetchCurrencies(1), { deep: true })
onMounted(() => {
  fetchCurrencies()
})
</script>

<template>
  <div class="currency-list">
    <div class="header-actions">
      <h1>Gestión de Divisas</h1>
      <button v-if="authStore.can(permissionKey)" @click="openCreateModal" class="btn-primary">
        <FontAwesomeIcon icon="fa-solid fa-plus-circle" /> Crear Divisa
      </button>
    </div>

    <FilterBar @update:filters="filters = $event" placeholder="Buscar por código o nombre..." />

    <BaseCard title="Divisas Registradas">
      <template v-if="currencies && currencies.length > 0">
        <BaseTable :headers="tableHeaders" :data="currencies" :is-loading="isLoading">
          <tr v-for="currency in currencies" :key="currency.code">
            <td>{{ currency.code }}</td>
            <td>{{ currency.name }}</td>
            <td>{{ new Date(currency.created_at).toLocaleDateString() }}</td>
            <td class="action-buttons">
              <template v-if="authStore.can(permissionKey)">
                <button
                  @click="openEditModal(currency.code)"
                  class="btn-icon edit"
                  title="Editar Nombre"
                >
                  <FontAwesomeIcon icon="fa-solid fa-pen-to-square" />
                </button>
                <button
                  @click="deleteCurrency(currency.code, currency.name)"
                  class="btn-icon delete"
                  title="Eliminar divisa"
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
        <p class="loading-state">Cargando divisas...</p>
      </div>

      <div v-else class="no-data-message">
        <p>No hay divisas registradas.</p>
      </div>

      <template #footer>
        <Pagination :pagination="pagination" @change-page="fetchCurrencies" />
      </template>
    </BaseCard>

    <CurrencyFormModal
      :show="showCurrencyModal"
      :currency-code="currencyCodeToEdit"
      @close="showCurrencyModal = false"
      @saved="fetchCurrencies(pagination.current_page || 1)"
    />
  </div>
</template>

<style scoped>
/* Estilos necesarios para la vista */
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
.btn-icon.delete {
  color: var(--color-danger);
}
.no-actions {
  font-size: 0.85rem;
  opacity: 0.5;
}
.no-data-message {
  text-align: center;
  padding: 30px;
  color: #aaa;
}
.loading-state {
  text-align: center;
  padding: 30px;
  color: var(--color-primary);
}
</style>
