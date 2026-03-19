<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import alert from '@/services/alert'
import notify from '@/services/notify'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import BaseTable from '@/components/ui/BaseTable.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import Pagination from '@/components/ui/Pagination.vue'
import BaseCard from '@/components/shared/BaseCard.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
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
  { key: 'name', label: 'Identidad y Usuario' },
  { key: 'email', label: 'Contacto Digital' },
  { key: 'role', label: 'Nivel de Acceso' },
  { key: 'created_at', label: 'Fecha Alta' },
  { key: 'actions', label: '' },
]

const fetchUsers = async (page = 1) => {
  isLoading.value = true
  const params = { page: page, ...filters.value }
  try {
    const response = await api.get('/users', { params })
    users.value = response.data.data
    const { data, ...pagData } = response.data
    pagination.value = pagData
  } catch (error) {
    notify.error('Fallo al sincronizar registro de personal.')
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

const deleteUser = async (userId, userName) => {
  if (userId === authStore.authUser?.id) {
    notify.warning('Protocolo de seguridad: No puedes auto-eliminarte.')
    return
  }

  const confirmed = await alert.confirm(`¿Revocar acceso a ${userName}?`, 'Esta acción es irreversible.')
  if (confirmed) {
    try {
      await api.delete(`/users/${userId}`)
      notify.success('Acceso revocado exitosamente.')
      fetchUsers(pagination.value.current_page)
    } catch (error) {
      notify.error('Fallo al procesar la revocación de acceso.')
    }
  }
}

watch(filters, () => fetchUsers(1), { deep: true })
onMounted(() => fetchUsers())

const getPrimaryRole = (roles) => {
  if (roles && roles.length > 0) return roles[0].toUpperCase()
  return 'SIN ROL'
}
</script>

<template>
  <div class="space-y-10 animate-premium-in pb-12 overflow-hidden">
    
    <!-- Header Premium -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
        <h1 class="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <span class="w-1.5 h-10 bg-primary rounded-full"></span>
          Control de <span class="text-gradient-primary">Usuarios</span>
        </h1>
        <p class="text-white/30 text-xs font-bold uppercase tracking-[0.2em] mt-2 ml-4">Gestión de identidades y niveles de acceso corporativo</p>
      </div>

      <BaseButton v-if="authStore.can(permissionKey)" @click="openCreateModal" variant="primary">
        <FontAwesomeIcon icon="fa-solid fa-user-plus" class="mr-2" /> Crear Usuario
      </BaseButton>
    </div>

    <!-- Barra de Búsqueda Premium -->
    <div class="premium-card p-4 bg-white/[0.02] border-white/5 shadow-inner">
       <FilterBar @update:filters="filters = $event" placeholder="Auditar por nombre, email o cargo..." />
    </div>

    <!-- Lista de Personal v5 -->
    <BaseCard title="Personal Autorizado" subtitle="Lista integral de colaboradores con acceso activo al ecosistema.">
      <BaseTable :headers="tableHeaders" :data="users" :is-loading="isLoading">
        <tr v-for="user in users" :key="user.id" class="group">
          
          <!-- Identidad -->
          <td>
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black border border-primary/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                {{ user.name.charAt(0) }}
              </div>
              <div class="flex flex-col">
                 <span class="text-sm font-black text-white tracking-tight">{{ user.name }}</span>
                 <span class="text-[0.65rem] font-bold text-white/20 uppercase tracking-widest mt-0.5">ID: #{{ user.id }}</span>
              </div>
            </div>
          </td>

          <!-- Email -->
          <td>
             <span class="text-sm font-bold text-white/60 font-mono tracking-tight lowercase">{{ user.email }}</span>
          </td>

          <!-- Rol con Badges v5 -->
          <td>
            <span 
              class="px-3 py-1.5 rounded-xl text-[0.6rem] font-black uppercase tracking-[0.15em] border shadow-sm transition-all group-hover:shadow-[0_0_15px_rgba(247,166,0,0.1)]"
              :class="{
                'bg-primary text-secondary border-primary/30': getPrimaryRole(user.roles) === 'ADMIN_TENANT',
                'bg-success/5 text-success border-success/20': getPrimaryRole(user.roles) === 'CAJERO',
                'bg-info/5 text-info border-info/20': getPrimaryRole(user.roles) === 'ANALISTA',
                'bg-purple-500/5 text-purple-400 border-purple-500/20': getPrimaryRole(user.roles) === 'CORREDOR',
                'bg-white/5 text-white/20 border-white/10': getPrimaryRole(user.roles) === 'SIN ROL'
              }"
            >
              {{ getPrimaryRole(user.roles).replace('_', ' ') }}
            </span>
          </td>

          <!-- Fecha -->
          <td>
             <span class="text-[0.7rem] font-black text-white/30 uppercase tracking-tighter italic">
                {{ new Date(user.created_at).toLocaleDateString() }}
             </span>
          </td>

          <!-- Acciones -->
          <td>
            <div class="flex justify-end items-center gap-2 opacity-20 group-hover:opacity-100 transition-all duration-300">
              <template v-if="authStore.can(permissionKey)">
                <button 
                  @click="openEditModal(user.id)" 
                  class="w-9 h-9 rounded-xl bg-white/5 text-white/40 flex items-center justify-center transition-all hover:bg-white/10 hover:text-white active:scale-95"
                  title="Configurar Perfil"
                >
                  <FontAwesomeIcon icon="fa-solid fa-user-gear" />
                </button>
                <button 
                  @click="deleteUser(user.id, user.name)" 
                  class="w-9 h-9 rounded-xl bg-danger/10 text-danger flex items-center justify-center transition-all hover:bg-danger hover:text-white hover:shadow-lg disabled:opacity-20 active:scale-95"
                  title="Revocar Acceso"
                  :disabled="user.id === authStore.authUser?.id"
                >
                  <FontAwesomeIcon icon="fa-solid fa-user-slash" />
                </button>
              </template>
              <div v-else class="h-9 flex items-center px-4 rounded-xl bg-white/5 border border-white/10 text-[0.6rem] font-black text-white/20 uppercase tracking-widest">
                 Solo Lectura
              </div>
            </div>
          </td>
        </tr>
      </BaseTable>
      
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
.text-gradient-primary {
  background: linear-gradient(135deg, #f7a600, #f0b90b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
