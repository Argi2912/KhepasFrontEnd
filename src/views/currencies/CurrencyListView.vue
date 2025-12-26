<script setup>
import { ref, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

import api from '@/services/api'
import alert from '@/services/alert'
import notify from '@/services/notify'

// Componentes
import BaseTable from '@/components/ui/BaseTable.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import Pagination from '@/components/ui/Pagination.vue'
import BaseCard from '@/components/shared/BaseCard.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import CurrencyFormModal from '@/views/currencies/CurrencyFormModal.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const authStore = useAuthStore()
const permissionKey = 'manage_exchanges'

// Estado del Modal
const showCurrencyModal = ref(false)
const currencyIdToEdit = ref(null)

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
  currencyIdToEdit.value = null
  showCurrencyModal.value = true
}

const openEditModal = (id) => {
  currencyIdToEdit.value = id
  showCurrencyModal.value = true
}

/**
 * Confirma y elimina una divisa.
 */
const deleteCurrency = async (id, name) => {
  if (!authStore.can(permissionKey)) {
    notify.error('No tienes permiso para eliminar divisas.')
    return
  }

  const confirmed = await alert.confirm(`¿Eliminar divisa ${name}?`, 'Confirmar Eliminación')

  if (confirmed) {
    try {
      await api.delete(`/currencies/${id}`)
      notify.success('Divisa eliminada correctamente.')
      fetchCurrencies(pagination.value.current_page)
    } catch (error) {
      console.error('Error deleting currency:', error)
      notify.error('No se pudo eliminar: Asegúrese de que no esté en uso.')
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
      <BaseButton v-if="authStore.can(permissionKey)" @click="openCreateModal" variant="primary">
        <FontAwesomeIcon icon="fa-solid fa-plus-circle" /> Crear Divisa
      </BaseButton>
    </div>

    <FilterBar @update:filters="filters = $event" placeholder="Buscar por código o nombre..." />

    <BaseCard title="Divisas Registradas">
      <template v-if="currencies && currencies.length > 0">
        <BaseTable :headers="tableHeaders" :data="currencies" :is-loading="isLoading">
          <tr v-for="currency in currencies" :key="currency.id">
            <td>{{ currency.code }}</td>
            <td>{{ currency.name }}</td>
            <td>{{ new Date(currency.created_at).toLocaleDateString() }}</td>
            <td class="action-buttons">
              <template v-if="authStore.can(permissionKey)">
                <BaseButton
                  @click="openEditModal(currency.id)"
                  variant="primary"
                  class="btn-sm"
                  title="Editar"
                >
                  <FontAwesomeIcon icon="fa-solid fa-pen-to-square" />
                </BaseButton>

                <BaseButton
                  @click="deleteCurrency(currency.id, currency.name)"
                  variant="danger"
                  class="btn-sm"
                  title="Eliminar"
                >
                  <FontAwesomeIcon icon="fa-solid fa-trash" />
                </BaseButton>
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
      :currency-id="currencyIdToEdit"
      @close="showCurrencyModal = false"
      @saved="fetchCurrencies(pagination.current_page || 1)"
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
}

.action-buttons {
  display: flex;
  gap: 8px;
}

/* Reducir el tamaño de los botones dentro de la tabla */
:deep(.btn-sm) {
  padding: 6px 10px !important;
  font-size: 0.9rem !important;
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
