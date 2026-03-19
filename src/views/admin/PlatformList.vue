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

// Importar el Modal que acabamos de crear
import PlatformFormModal from '@/components/shared/PlatformFormModal.vue'

const showPlatformModal = ref(false)
const platformIdToEdit = ref(null)

const authStore = useAuthStore()
const permissionKey = 'manage_platforms' // (Recuerda crear este permiso en el backend)

const platforms = ref([])
const pagination = ref({})
const filters = ref({})
const isLoading = ref(false)

// Encabezados de tabla (idénticos a Cliente)
const tableHeaders = [
  { key: 'name', label: 'Nombre' },
  { key: 'email', label: 'Identificacion' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'created_at', label: 'Registro' },
]

/**
 * Carga la lista de plataformas desde la API.
 */
const fetchPlatforms = async (page = 1) => {
  isLoading.value = true
  const params = { page: page, ...filters.value }

  try {
    // Usar el nuevo endpoint de API
    const response = await api.get('/platforms', { params })
    platforms.value = response.data
    const { data, ...pagData } = response.data
    pagination.value = pagData
  } catch (error) {
    notify.error('Error al cargar la lista de plataformas.')
  } finally {
    isLoading.value = false
  }
}

/**
 * Abrir modal para Crear
 */
const openCreateModal = () => {
  platformIdToEdit.value = null // Crear
  showPlatformModal.value = true
}

/**
 * Abrir modal para Editar
 */
const openEditModal = (platformId) => {
  platformIdToEdit.value = platformId // Editar
  showPlatformModal.value = true
}

/**
 * Eliminar una plataforma
 */
const deletePlatform = async (platformId, platformName) => {
  if (!authStore.can(permissionKey)) {
    notify.error('No tienes permiso para eliminar plataformas.')
    return
  }

  const confirmed = await alert.confirm(
    `¿Eliminar plataforma ${platformName}?`,
    'Esta acción es irreversible.',
  )

  if (confirmed) {
    try {
      // Usar el endpoint correcto
      await api.delete(`/platforms/${platformId}`)
      notify.success('Plataforma eliminada correctamente.')
      fetchPlatforms(pagination.value.current_page || 1)
    } catch (error) {
      console.error('Error deleting platform:', error)
    }
  }
}

// Observadores y carga inicial
watch(filters, () => fetchPlatforms(1), { deep: true })
onMounted(() => {
  fetchPlatforms()
})
</script>

<template>
  <div class="platform-list">
    <div class="header-actions">
      <h1>Plataformas y administradores</h1>
      <button vButton-if="authStore.can(permissionKey)" @click="openCreateModal" class="btn-primary">
        <FontAwesomeIcon icon="fa-solid fa-plus" /> Agregar Plataforma
      </button>
    </div>

    <FilterBar @update:filters="filters = $event" />

    <BaseCard title="Listado y Filtros">
      <BaseTable :headers="tableHeaders" :data="platforms" :is-loading="isLoading">
        <tr v-for="platform in platforms" :key="platform.id">
          <td>{{ platform.name }}</td>
          <td>{{ platform.email }}</td>
          <td>{{ platform.phone }}</td>
          <td>{{ new Date(platform.created_at).toLocaleDateString() }}</td>
          <td class="action-buttons">
            <template v-if="authStore.can(permissionKey)">
              <button @click="openEditModal(platform.id)" class="btn-icon edit">
                <FontAwesomeIcon icon="fa-solid fa-pen-to-square" />
              </button>
              <button @click="deletePlatform(platform.id, platform.name)" class="btn-icon delete">
                <FontAwesomeIcon icon="fa-solid fa-trash" />
              </button>
            </template>
            <span v-else class="no-actions">No autorizado</span>
          </td>
        </tr>
      </BaseTable>

      <template #footer>
        <Pagination :pagination="pagination" @change-page="fetchPlatforms" />
      </template>
    </BaseCard>

    <PlatformFormModal
      :show="showPlatformModal"
      :platform-id="platformIdToEdit"
      @close="showPlatformModal = false"
      @saved="fetchPlatforms(pagination.current_page || 1)"
    />
  </div>
</template>

<style scoped>
/* Estilos 100% copiados de ClientList.vue */
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