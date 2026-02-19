<script setup>
import { ref, watch, onMounted } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'
import Swal from 'sweetalert2'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import BaseTable from '@/components/ui/BaseTable.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import Pagination from '@/components/ui/Pagination.vue'
import SuperadminUserFormModal from './SuperadminUserFormModal.vue'

// --- ESTADO ---
const users = ref([])
const pagination = ref({})
const filters = ref({})
const isLoading = ref(false)

const showEditModal = ref(false)
const selectedUser = ref(null)

const tableHeaders = [
  { key: 'status', label: 'Estado' },
  { key: 'name', label: 'Nombre' },
  { key: 'email', label: 'Email' },
  { key: 'tenant', label: 'Tenant' },
  { key: 'role', label: 'Rol' },
  { key: 'created_at', label: 'Registro' },
]

// --- API ---
const fetchUsers = async (page = 1) => {
  isLoading.value = true
  try {
    const params = { page, ...filters.value }
    const { data } = await api.get('/superadmin/users', { params })
    users.value = data.data
    const { data: list, ...meta } = data
    pagination.value = meta
  } catch (e) {
    notify.error('Error al cargar usuarios')
  } finally {
    isLoading.value = false
  }
}

// Editar usuario
const openEdit = (user) => {
  selectedUser.value = { ...user }
  showEditModal.value = true
}

// Cambiar contraseña
const changePassword = async (user) => {
  const { value: formValues } = await Swal.fire({
    title: `🔑 Cambiar Contraseña`,
    html: `
      <p style="color:#aaa;margin-bottom:15px;">Usuario: <strong style="color:#fff;">${user.name}</strong></p>
      <input id="swal-password" type="text" class="swal2-input" placeholder="Nueva contraseña" style="font-size:1rem;">
    `,
    background: '#1e2329',
    color: '#eee',
    showCancelButton: true,
    confirmButtonText: 'Cambiar Contraseña',
    confirmButtonColor: '#f0b90b',
    cancelButtonText: 'Cancelar',
    focusConfirm: false,
    preConfirm: () => {
      const password = document.getElementById('swal-password').value
      if (!password || password.length < 8) {
        Swal.showValidationMessage('La contraseña debe tener al menos 8 caracteres')
        return false
      }
      return password
    },
  })

  if (formValues) {
    try {
      await api.post(`/superadmin/users/${user.id}/reset-password`, {
        password: formValues,
      })

      await Swal.fire({
        title: '✅ Contraseña Cambiada',
        html: `
          <p style="color:#aaa;">La nueva contraseña de <strong style="color:#fff;">${user.name}</strong> es:</p>
          <div style="background:#2b3139;padding:12px 20px;border-radius:8px;margin:15px 0;border:1px solid #f0b90b;">
            <code style="font-size:1.3rem;color:#f0b90b;letter-spacing:1px;">${formValues}</code>
          </div>
          <p style="color:#888;font-size:0.85rem;">Compártela con el usuario por WhatsApp, llamada, etc.</p>
        `,
        background: '#1e2329',
        color: '#eee',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#0ecb81',
      })
    } catch (e) {
      notify.error('Error al cambiar la contraseña')
    }
  }
}

// Activar/Desactivar
const toggleUser = async (user) => {
  const action = user.is_active ? 'Desactivar' : 'Activar'
  const color = user.is_active ? '#d33' : '#0ecb81'

  const result = await Swal.fire({
    title: `¿${action} usuario?`,
    text: `Vas a ${action.toLowerCase()} a "${user.name}"`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: `Sí, ${action}`,
    confirmButtonColor: color,
    cancelButtonText: 'Cancelar',
    background: '#1e2329',
    color: '#eee',
  })

  if (result.isConfirmed) {
    try {
      await api.put(`/superadmin/users/${user.id}`, {
        is_active: !user.is_active,
      })
      notify.success(`Usuario ${action.toLowerCase()}do correctamente`)
      fetchUsers(pagination.value.current_page)
    } catch (e) {
      notify.error('Error al cambiar estado del usuario')
    }
  }
}

const getRoleClass = (role) => {
  const map = {
    admin_tenant: 'role-admin',
    cajero: 'role-cajero',
    analista: 'role-analista',
    corredor: 'role-corredor',
  }
  return map[role] || 'role-default'
}

watch(filters, () => fetchUsers(1), { deep: true })
onMounted(() => fetchUsers())
</script>

<template>
  <div class="sa-container">
    <div class="page-header">
      <h1>Gestión de Usuarios</h1>
      <span class="user-count" v-if="pagination.total">
        {{ pagination.total }} usuarios registrados
      </span>
    </div>

    <FilterBar @update:filters="filters = $event" placeholder="Buscar por nombre o email..." />

    <div class="table-card">
      <BaseTable :headers="tableHeaders" :data="users" :is-loading="isLoading">
        <tr v-for="user in users" :key="user.id" :class="{ 'row-inactive': !user.is_active }">
          <td>
            <span :class="['badge', user.is_active ? 'bg-success' : 'bg-danger']">
              {{ user.is_active ? 'ACTIVO' : 'INACTIVO' }}
            </span>
          </td>

          <td>
            <div class="user-name">{{ user.name }}</div>
            <span class="id-ref">ID: {{ user.id }}</span>
          </td>

          <td>
            <span class="email-text">{{ user.email }}</span>
          </td>

          <td>
            <span class="tenant-name-cell">{{ user.tenant }}</span>
          </td>

          <td>
            <span :class="['role-tag', getRoleClass(user.role)]">
              {{ user.role?.toUpperCase() || 'SIN ROL' }}
            </span>
          </td>

          <td>{{ new Date(user.created_at).toLocaleDateString() }}</td>

          <td class="actions-cell">
            <div class="actions-flex">
              <button @click="openEdit(user)" class="btn-icon btn-edit" title="Editar Info">
                <FontAwesomeIcon icon="fa-solid fa-pen-to-square" />
              </button>
              <button @click="changePassword(user)" class="btn-icon btn-key" title="Cambiar Contraseña">
                <FontAwesomeIcon icon="fa-solid fa-key" />
              </button>
              <button @click="toggleUser(user)" class="btn-icon"
                :class="user.is_active ? 'btn-disable' : 'btn-enable'"
                :title="user.is_active ? 'Desactivar' : 'Activar'">
                <FontAwesomeIcon :icon="user.is_active ? 'fa-solid fa-user-slash' : 'fa-solid fa-user-check'" />
              </button>
            </div>
          </td>
        </tr>
      </BaseTable>
      <Pagination :pagination="pagination" @change-page="fetchUsers" />
    </div>

    <SuperadminUserFormModal :show="showEditModal" :user="selectedUser" @close="showEditModal = false"
      @saved="fetchUsers(pagination.current_page || 1)" />
  </div>
</template>

<style scoped>
.sa-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  color: var(--color-text-light);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.page-header h1 {
  color: var(--color-primary);
  font-size: 1.8rem;
}

.user-count {
  background: var(--color-secondary);
  border: 1px solid var(--color-border);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  color: #aaa;
}

.table-card {
  background: var(--color-secondary);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--color-border);
}

.row-inactive {
  opacity: 0.5;
  background: rgba(255, 0, 0, 0.03);
}

.user-name {
  font-weight: bold;
  font-size: 1rem;
  color: #fff;
}

.id-ref {
  font-size: 0.75rem;
  color: #666;
  font-family: monospace;
}

.email-text {
  font-family: monospace;
  font-size: 0.9rem;
  color: var(--color-primary);
}

.tenant-name-cell {
  font-size: 0.9rem;
  color: #ccc;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
}

.bg-success {
  background: rgba(14, 203, 129, 0.2);
  color: #0ecb81;
}

.bg-danger {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

.role-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
}

.role-admin {
  background-color: #f7a600;
}

.role-cajero {
  background-color: #2ecc71;
}

.role-analista {
  background-color: #3498db;
}

.role-corredor {
  background-color: #9b59b6;
}

.role-default {
  background-color: #7f8c8d;
}

.actions-cell {
  text-align: right;
}

.actions-flex {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-icon {
  background: #222;
  border: 1px solid #444;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  cursor: pointer;
  transition: 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-edit {
  color: #3498db;
}

.btn-edit:hover {
  background: #3498db;
  color: #fff;
}

.btn-key {
  color: #f0b90b;
  border-color: #5a4500;
}

.btn-key:hover {
  background: #f0b90b;
  color: #000;
}

.btn-disable {
  color: #e74c3c;
}

.btn-disable:hover {
  background: #e74c3c;
  color: #fff;
}

.btn-enable {
  color: #0ecb81;
}

.btn-enable:hover {
  background: #0ecb81;
  color: #fff;
}
</style>
