// src/views/protected/UserListView.vue

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Módulo de Usuarios</h1>
      <button class="btn-layout-primary" @click="openAddModal">Añadir Usuario</button>
    </div>

    <div class="search-bar-wrapper">
      <input
        type="text"
        class="search-input"
        placeholder="Buscar por nombre o correo..."
        v-model="searchQuery"
      />
    </div>

    <div class="content-table-wrapper">
      <table class="content-table">
        <thead></thead>
        <tbody v-if="userStore.loading">
          <tr>
            <td colspan="6" style="text-align: center">Cargando...</td>
          </tr>
        </tbody>
        <tbody v-else-if="userStore.users.length > 0">
          <tr v-for="user in userStore.users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.first_name }} {{ user.last_name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.phone_number || 'N/A' }}</td>
            <td>
              <span class="role-tag">{{ user.roles?.[0]?.name || 'N/A' }}</span>
            </td>
            <td>
              <button class="btn-edit" @click="openEditModal(user)">Editar</button>
              <button class="btn-delete" @click="confirmDelete(user)">Eliminar</button>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="6" style="text-align: center">No se encontraron usuarios.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <UserModal
      :is-visible="isModalVisible"
      :user-to-edit="currentUser"
      :is-loading="userStore.loading"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import UserModal from '@/components/common/UserModal.vue'
import Swal from 'sweetalert2' // <-- IMPORTAR SWEETALERT2

const userStore = useUserStore()
const searchQuery = ref('')
const isModalVisible = ref(false)
const currentUser = ref(null)
const debounceTimer = ref(null)

onMounted(() => {
  userStore.fetchUsers({})
})

watch(searchQuery, (newQuery) => {
  clearTimeout(debounceTimer.value)
  debounceTimer.value = setTimeout(() => {
    userStore.fetchUsers({ page: 1, search: newQuery })
  }, 500)
})

// --- Métodos del Modal (Sin cambios) ---
const openAddModal = () => {
  currentUser.value = null
  isModalVisible.value = true
}

const openEditModal = (user) => {
  currentUser.value = { ...user }
  isModalVisible.value = true
}

const closeModal = () => {
  isModalVisible.value = false
}

const handleSave = async (userData) => {
  try {
    if (userData.id) {
      await userStore.updateUser(userData)
    } else {
      await userStore.addUser(userData)
    }
    closeModal()
  } catch (error) {
    // No cerrar el modal si hay error
  }
}

// --- NUEVA LÓGICA DE ELIMINACIÓN CON SWEETALERT2 Y VALIDACIÓN ---
const confirmDelete = async (user) => {
  const result = await Swal.fire({
    title: `¿Eliminar a ${user.first_name} ${user.last_name}?`,
    text: `Esta acción es irreversible. Para confirmar, escribe la palabra "ELIMINAR" en la caja de abajo.`,
    icon: 'warning',
    input: 'text',
    inputPlaceholder: 'Escribe ELIMINAR',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    customClass: {
      confirmButton: 'btn-delete', // Usa tu clase CSS para el botón de eliminar
      cancelButton: 'btn-secondary',
    },
    // Validación de la palabra clave
    inputValidator: (value) => {
      if (value !== 'ELIMINAR') {
        return 'Debes escribir la palabra "ELIMINAR" en mayúsculas para confirmar.'
      }
    },
    // Estilo personalizado para SweetAlert
    background: 'var(--color-bg-secondary)',
    color: 'var(--color-text-primary)',
    confirmButtonColor: 'var(--color-bg-tertiary)', // Se sobrescribirá con btn-delete
  })

  if (result.isConfirmed) {
    try {
      await userStore.deleteUser(user.id)
      Swal.fire({
        title: '¡Eliminado!',
        text: `El usuario ${user.first_name} ha sido eliminado.`,
        icon: 'success',
        background: 'var(--color-bg-secondary)',
        color: 'var(--color-text-primary)',
        confirmButtonColor: 'var(--color-accent-yellow)',
      })
    } catch (error) {
      // Si la API devuelve un error (ej: usuario no encontrado), SweetAlert lo mostrará
      // Asumiendo que tu interceptor maneja errores. Si no, podrías poner:
      /*
      Swal.fire({
        title: 'Error',
        text: error.message || 'Hubo un error al eliminar el usuario.',
        icon: 'error',
        background: 'var(--color-bg-secondary)',
        color: 'var(--color-text-primary)',
        confirmButtonColor: 'var(--color-accent-yellow)',
      })
      */
    }
  }
}
// ... (El resto del script)
</script>

<style scoped>
/* ¡No se necesitan estilos aquí! Todo es manejado por layout.css */
</style>
