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
import UserFormModal from '@/views/users/UserFormModal.vue'

const authStore = useAuthStore()
const permissionKey = 'manage_users'

// Estado del Modal
const showUserModal = ref(false)
const userIdToEdit = ref(null)

// Estado de la Lista
const users = ref([])
const pagination = ref({})
const filters = ref({})
const isLoading = ref(false)

const tableHeaders = [
  { key: 'name', label: 'Nombre' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Rol' },
  { key: 'created_at', label: 'Fecha de Creación' },
]

/**
 * Carga la lista de usuarios.
 */
const fetchUsers = async (page = 1) => {
  isLoading.value = true
  const params = { page: page, ...filters.value }

  try {
    // 🚨 El backend usa TenantUserController y UserResource
    const response = await api.get('/users', { params })
    // La respuesta paginada contiene 'data' y luego la paginación a nivel superior
    users.value = response.data.data
    const { data, ...pagData } = response.data
    pagination.value = pagData
  } catch (error) {
    notify.error('Error al cargar la lista de usuarios.')
  } finally {
    isLoading.value = false
  }
}

const openCreateModal = () => {
  userIdToEdit.value = null
  showUserModal.value = true
}

const openEditModal = (userId) => {
  userIdToEdit.value = userId
  showUserModal.value = true
}

/**
 * Confirma y elimina un usuario.
 */
const deleteUser = async (userId, userName) => {
  if (!authStore.can(permissionKey)) {
    notify.error('No tienes permiso para eliminar usuarios.')
    return
  }

  // No permitir eliminar al usuario actualmente logueado
  if (userId === authStore.authUser?.id) {
    notify.error('No puedes eliminar tu propia cuenta mientras estás activo.')
    return
  }

  const confirmed = await alert.confirm(`¿Eliminar usuario ${userName}?`, 'Confirmar Eliminación')

  if (confirmed) {
    try {
      await api.delete(`/users/${userId}`)
      notify.success('Usuario eliminado correctamente.')
      fetchUsers(pagination.value.current_page)
    } catch (error) {
      console.error('Error deleting user:', error)
      notify.error('No se pudo eliminar el usuario.')
    }
  }
}

watch(filters, () => fetchUsers(1), { deep: true })
onMounted(() => {
  fetchUsers()
})

/**
 * Función auxiliar para obtener el primer rol (UserResource devuelve roles como array de strings).
 */
const getPrimaryRole = (roles) => {
  if (roles && roles.length > 0) {
    // El UserResource devuelve un array de nombres de roles (ej: ['cajero'])
    return roles[0].toUpperCase()
  }
  return 'SIN ROL'
}
</script>

<template>
  <div class="user-list">
    <div class="header-actions">
      <h1>Gestión de Usuarios del Tenant</h1>
      <button v-if="authStore.can(permissionKey)" @click="openCreateModal" class="btn-primary">
        <FontAwesomeIcon icon="fa-solid fa-plus-circle" /> Crear Usuario
      </button>
    </div>

    <FilterBar @update:filters="filters = $event" placeholder="Buscar por nombre o email..." />

    <BaseCard title="Usuarios Registrados">
      <template v-if="users && users.length > 0">
        <BaseTable :headers="tableHeaders" :data="users" :is-loading="isLoading">
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>
              <!-- 🚨 Muestra el rol principal usando la data del UserResource -->
              <span
                :class="`role-tag role-${getPrimaryRole(user.roles).toLowerCase()}`"
                :title="`ID: ${user.id}`"
              >
                {{ getPrimaryRole(user.roles) }}
              </span>
            </td>
            <td>{{ new Date(user.created_at).toLocaleDateString() }}</td>
            <td class="action-buttons">
              <template v-if="authStore.can(permissionKey)">
                <button
                  @click="openEditModal(user.id)"
                  class="btn-icon edit"
                  title="Editar Usuario y Rol"
                >
                  <FontAwesomeIcon icon="fa-solid fa-pen-to-square" />
                </button>
                <button
                  @click="deleteUser(user.id, user.name)"
                  class="btn-icon delete"
                  title="Eliminar usuario"
                  :disabled="user.id === authStore.authUser?.id"
                >
                  <FontAwesomeIcon icon="fa-solid fa-trash" />
                </button>
              </template>
              <span v-else class="no-actions">N/A</span>
            </td>
          </tr>
        </BaseTable>
      </template>

      <div v-else-if="isLoading">
        <p class="loading-state">Cargando usuarios...</p>
      </div>

      <div v-else class="no-data-message">
        <p>No hay usuarios registrados.</p>
      </div>

      <template #footer>
        <Pagination :pagination="pagination" @change-page="fetchUsers" />
      </template>
    </BaseCard>

    <UserFormModal
      :show="showUserModal"
      :user-id="userIdToEdit"
      @close="showUserModal = false"
      @saved="fetchUsers(pagination.current_page || 1)"
    />
  </div>
</template>

<style scoped>
/* Estilos reutilizados de otros listados */
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
.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.no-actions {
  font-size: 0.85rem;
  opacity: 0.5;
}
/* Estilos para los roles según el seeder */
.role-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
}
.role-admin_tenant {
  background-color: #f7a600; /* Primary */
}
.role-cajero {
  background-color: #2ecc71; /* Success */
}
.role-analista {
  background-color: #3498db; /* Info */
}
.role-corredor {
  background-color: #9b59b6; /* Purple */
}
.role-none {
  background-color: #7f8c8d; /* Gray */
}
.no-data-message,
.loading-state {
  text-align: center;
  padding: 30px;
  color: #aaa;
}
</style>
