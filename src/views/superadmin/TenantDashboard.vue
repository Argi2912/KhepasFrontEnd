<script setup>
import { ref, onMounted, reactive } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'
import Swal from 'sweetalert2'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// Componentes Base
import BaseTable from '@/components/ui/BaseTable.vue'
import BaseModal from '@/components/shared/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import Pagination from '@/components/ui/Pagination.vue'

// --- ESTADO ---
const stats = ref({
  total_tenants: 0,
  active_tenants: 0,
  inactive_tenants: 0,
  total_users: 0,
})
const tenants = ref([])
const isLoading = ref(false)
const pagination = ref({ current_page: 1, last_page: 1, total: 0 })
const showModal = ref(false)
const isSubmitting = ref(false)

// Formulario reactivo
const form = reactive({
  name: '',
  admin_name: '',
  admin_email: '',
  password: '',
})

const headers = [
  { key: 'status', label: 'Estado' },
  { key: 'name', label: 'Negocio / Tenant' },
  { key: 'users', label: 'Usuarios' }, // Nueva columna
  { key: 'admin', label: 'Admin Responsable' },
  { key: 'created_at', label: 'Registro' },
]

// --- API ---

// 1. Cargar Estadísticas (KPIs)
const fetchStats = async () => {
  try {
    const { data } = await api.get('/superadmin/stats')
    stats.value = data
  } catch (e) {
    console.error(e)
  }
}

// 2. Cargar Lista de Tenants
const fetchTenants = async (page = 1) => {
  isLoading.value = true
  try {
    const { data } = await api.get(`/superadmin/tenants?page=${page}`)

    tenants.value = data.data.map((t) => {
      const adminUser = t.users && t.users.length > 0 ? t.users[0] : null
      return {
        ...t,
        admin_info: adminUser ? `${adminUser.name}` : 'Sin Asignar',
        admin_email: adminUser ? adminUser.email : '',
        created_fmt: new Date(t.created_at).toLocaleDateString(),
        // Badge color logic
        status_class: t.is_active ? 'bg-success' : 'bg-danger',
        status_text: t.is_active ? 'ACTIVO' : 'INACTIVO',
      }
    })

    const { data: list, ...meta } = data
    pagination.value = meta
  } catch (e) {
    notify.error('Error cargando tenants')
  } finally {
    isLoading.value = false
  }
}

// 3. Crear Tenant
const createTenant = async () => {
  isSubmitting.value = true
  try {
    await api.post('/superadmin/tenants', form)
    notify.success('Tenant creado exitosamente')
    showModal.value = false
    // Limpiar form
    form.name = ''
    form.admin_name = ''
    form.admin_email = ''
    form.password = ''

    refreshAll()
  } catch (e) {
    const msg = e.response?.data?.message || 'Error al crear tenant'
    notify.error(msg)
  } finally {
    isSubmitting.value = false
  }
}

// 4. Alternar Estado (Activar/Desactivar)
const toggleTenant = async (tenant) => {
  const action = tenant.is_active ? 'Desactivar' : 'Activar'
  const color = tenant.is_active ? '#d33' : '#0ecb81'

  const result = await Swal.fire({
    title: `¿${action} Negocio?`,
    text: `Vas a cambiar el estado de "${tenant.name}". Si lo desactivas, sus usuarios no podrán entrar.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: `Sí, ${action}`,
    confirmButtonColor: color,
    cancelButtonText: 'Cancelar',
  })

  if (result.isConfirmed) {
    try {
      await api.patch(`/superadmin/tenants/${tenant.id}/toggle`)
      notify.success(`Tenant ${action.toLowerCase()}do correctamente`)
      fetchTenants(pagination.value.current_page)
      fetchStats() // Actualizar contadores
    } catch (e) {
      notify.error('Error al cambiar estado')
    }
  }
}

const refreshAll = () => {
  fetchStats()
  fetchTenants()
}

onMounted(() => refreshAll())
</script>

<template>
  <div class="sa-container">
    <div class="page-header">
      <h1>Panel Superadmin</h1>
      <button class="btn-primary" @click="showModal = true">
        <FontAwesomeIcon icon="fa-solid fa-plus" /> Nuevo Tenant
      </button>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card total">
        <div class="icon"><FontAwesomeIcon icon="fa-solid fa-building" /></div>
        <div class="data">
          <h3>{{ stats.total_tenants }}</h3>
          <p>Tenants Registrados</p>
        </div>
      </div>

      <div class="kpi-card active">
        <div class="icon"><FontAwesomeIcon icon="fa-solid fa-check-circle" /></div>
        <div class="data">
          <h3>{{ stats.active_tenants }}</h3>
          <p>Negocios Activos</p>
        </div>
      </div>

      <div class="kpi-card inactive">
        <div class="icon"><FontAwesomeIcon icon="fa-solid fa-ban" /></div>
        <div class="data">
          <h3>{{ stats.inactive_tenants }}</h3>
          <p>Suspendidos</p>
        </div>
      </div>

      <div class="kpi-card users">
        <div class="icon"><FontAwesomeIcon icon="fa-solid fa-users" /></div>
        <div class="data">
          <h3>{{ stats.total_users }}</h3>
          <p>Usuarios Totales</p>
        </div>
      </div>
    </div>

    <div class="table-card">
      <BaseTable :headers="headers" :data="tenants" :is-loading="isLoading">
        <tr v-for="row in tenants" :key="row.id" :class="{ 'row-inactive': !row.is_active }">
          <td>
            <span :class="['badge', row.status_class]">{{ row.status_text }}</span>
          </td>

          <td>
            <div class="tenant-name">{{ row.name }}</div>
            <span class="id-ref">ID: {{ row.id }}</span>
          </td>

          <td>
            <div class="users-count">
              <FontAwesomeIcon icon="fa-solid fa-user-group" />
              <span>{{ row.users_count }}</span>
            </div>
          </td>

          <td>
            <div class="admin-info">
              <strong>{{ row.admin_info }}</strong>
              <small>{{ row.admin_email }}</small>
            </div>
          </td>

          <td>{{ row.created_fmt }}</td>

          <td class="actions-cell">
            <button
              @click="toggleTenant(row)"
              class="btn-icon"
              :class="row.is_active ? 'btn-disable' : 'btn-enable'"
              :title="row.is_active ? 'Suspender Tenant' : 'Reactivar Tenant'"
            >
              <FontAwesomeIcon
                :icon="row.is_active ? 'fa-solid fa-power-off' : 'fa-solid fa-play'"
              />
            </button>
          </td>
        </tr>
      </BaseTable>
      <Pagination :pagination="pagination" @change-page="fetchTenants" />
    </div>

    <BaseModal :show="showModal" title="Registrar Nuevo Negocio" @close="showModal = false">
      <form @submit.prevent="createTenant" class="modal-form">
        <div class="section-title">Datos de la Empresa</div>
        <BaseInput
          label="Nombre del Tenant (Negocio)"
          v-model="form.name"
          placeholder="Ej: Cambio Seguro C.A."
          required
        />

        <div class="section-title mt-4">Datos del Administrador</div>
        <BaseInput label="Nombre Completo" v-model="form.admin_name" required />
        <div class="grid-2">
          <BaseInput label="Correo Electrónico" type="email" v-model="form.admin_email" required />
          <BaseInput label="Contraseña Temporal" type="password" v-model="form.password" required />
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="showModal = false">Cancelar</button>
          <button type="submit" class="btn-primary" :disabled="isSubmitting">
            {{ isSubmitting ? 'Creando...' : 'Registrar Tenant' }}
          </button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<style scoped>
.sa-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  color: var(--color-text-light);
}

/* Header */
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

/* KPI CARDS */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}
.kpi-card {
  background: var(--color-secondary);
  border: 1px solid var(--color-border);
  padding: 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.2s;
}
.kpi-card:hover {
  transform: translateY(-3px);
  border-color: var(--color-primary);
}
.kpi-card .icon {
  font-size: 2rem;
  opacity: 0.8;
}
.kpi-card h3 {
  font-size: 1.8rem;
  margin: 0;
  font-weight: bold;
}
.kpi-card p {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.7;
}

.kpi-card.total .icon {
  color: #3498db;
}
.kpi-card.active .icon {
  color: #0ecb81;
}
.kpi-card.inactive .icon {
  color: #e74c3c;
}
.kpi-card.users .icon {
  color: #f1c40f;
}

/* Tabla */
.table-card {
  background: var(--color-secondary);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--color-border);
}
.row-inactive {
  opacity: 0.6;
  background: rgba(255, 0, 0, 0.05);
}

.tenant-name {
  font-weight: bold;
  font-size: 1.05rem;
  color: #fff;
}
.id-ref {
  font-size: 0.75rem;
  color: #666;
  font-family: monospace;
}

.users-count {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #333;
  width: fit-content;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: bold;
}

.admin-info {
  display: flex;
  flex-direction: column;
}
.admin-info small {
  opacity: 0.7;
}

/* Badges */
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

/* Botones */
.btn-primary {
  background: var(--color-primary);
  color: #000;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  gap: 8px;
  align-items: center;
}
.btn-primary:hover {
  background: #d4a000;
}

.actions-cell {
  text-align: right;
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

/* Modal */
.section-title {
  font-size: 0.85rem;
  color: var(--color-primary);
  text-transform: uppercase;
  margin-bottom: 10px;
  border-bottom: 1px solid #333;
  padding-bottom: 5px;
}
.mt-4 {
  margin-top: 20px;
}
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}
.modal-footer {
  margin-top: 25px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.btn-secondary {
  background: transparent;
  border: 1px solid #666;
  color: #ccc;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}
</style>
