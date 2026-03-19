<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import BaseTable from '@/components/ui/BaseTable.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import Pagination from '@/components/ui/Pagination.vue'
import BaseCard from '@/components/shared/BaseCard.vue'
import SuperadminUserFormModal from './SuperadminUserFormModal.vue'
import { formatDate } from '@/utils/date'
import { useSuperadminUsers } from '@/composables/superadmin/useSuperadminUsers'

const {
  users,
  pagination,
  filters,
  isLoading,
  showEditModal,
  selectedUser,
  fetchUsers,
  openEdit,
  changePassword,
  toggleUser,
  getRoleClass,
} = useSuperadminUsers()

const tableHeaders = [
  { key: 'status', label: 'Estado' },
  { key: 'name', label: 'Usuario / Identidad' },
  { key: 'email', label: 'Email' },
  { key: 'tenant', label: 'Organización' },
  { key: 'role', label: 'Rol de Sistema' },
  { key: 'created_at', label: 'Registro' },
  { key: 'actions', label: '' },
]
</script>

<template>
  <div class="space-y-10 animate-premium-in pb-12">
    
    <!-- Header Premium -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
        <h1 class="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <span class="w-1.5 h-10 bg-primary rounded-full shadow-[0_0_20px_rgba(247,166,0,0.4)]"></span>
          Gestión de <span class="text-gradient-primary">Usuarios</span>
        </h1>
        <p class="text-white/30 text-xs font-bold uppercase tracking-[0.2em] mt-2 ml-4">Administración global de accesos y credenciales</p>
      </div>

      <div class="px-4 py-2 rounded-2xl bg-white/[0.02] border border-white/5">
        <span class="text-[0.6rem] font-black text-white/20 uppercase tracking-widest mr-2">Suscritos:</span>
        <span class="text-lg font-black text-white">{{ pagination.total || 0 }}</span>
      </div>
    </div>

    <!-- Filtros y Tabla -->
    <div class="space-y-6">
      <FilterBar @update:filters="filters = $event" placeholder="Buscar por nombre, email o ID de cuenta..." />

      <BaseCard title="Directorio Maestro" subtitle="Control de privilegios y auditoría de cuentas federadas.">
        <BaseTable :headers="tableHeaders" :data="users" :is-loading="isLoading">
          <tr v-for="user in users" :key="user.id" class="group hover:bg-white/[0.01] transition-colors" :class="{ 'opacity-50 grayscale': !user.is_active }">
            
            <!-- Estado -->
            <td>
              <span 
                class="px-2.5 py-1 rounded-lg text-[0.6rem] font-black uppercase tracking-widest border"
                :class="user.is_active 
                  ? 'bg-success/5 text-success border-success/20' 
                  : 'bg-white/5 text-white/20 border-white/5'"
              >
                {{ user.is_active ? 'ACTIVO' : 'INACTIVO' }}
              </span>
            </td>

            <!-- Usuario -->
            <td class="py-5">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-xs font-black text-white/20 border border-white/5 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-all duration-300">
                  {{ user.name.charAt(0).toUpperCase() }}
                </div>
                <div class="flex flex-col">
                  <span class="text-base font-bold text-white group-hover:text-primary transition-colors leading-tight">{{ user.name }}</span>
                  <span class="text-[0.65rem] font-mono text-white/20 uppercase tracking-widest mt-0.5">UID: {{ user.id.toString().padStart(4, '0') }}</span>
                </div>
              </div>
            </td>

            <!-- Email -->
            <td>
              <span class="text-sm font-mono text-white/60">{{ user.email }}</span>
            </td>

            <!-- Tenant -->
            <td>
              <span class="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-[0.65rem] font-bold text-white/50 uppercase tracking-tight">
                {{ user.tenant || 'MASTER ADMIN' }}
              </span>
            </td>

            <!-- Rol -->
            <td>
              <span 
                class="px-3 py-1.5 rounded-xl text-[0.6rem] font-black uppercase tracking-widest border transition-all"
                :class="getRoleClass(user.role)"
              >
                {{ user.role?.replace('_', ' ').toUpperCase() || 'SIN ROL' }}
              </span>
            </td>

            <!-- Fecha -->
            <td>
              <span class="text-xs font-bold text-white/20 uppercase tracking-widest">{{ formatDate(user.created_at) }}</span>
            </td>

            <!-- Acciones -->
            <td>
              <div class="flex justify-end gap-2 opacity-10 group-hover:opacity-100 transition-opacity duration-300">
                <button 
                  @click="openEdit(user)" 
                  class="w-9 h-9 rounded-xl bg-info/10 text-info flex items-center justify-center transition-all hover:bg-info hover:text-white hover:shadow-lg active:scale-90"
                  title="Editar Perfil"
                >
                  <FontAwesomeIcon icon="fa-solid fa-user-pen" />
                </button>

                <button 
                  @click="changePassword(user)" 
                  class="w-9 h-9 rounded-xl bg-warning/10 text-warning flex items-center justify-center transition-all hover:bg-warning hover:text-secondary hover:shadow-lg active:scale-90 shadow-[0_4px_15px_rgba(247,166,0,0.1)]"
                  title="Resetear Credenciales"
                >
                  <FontAwesomeIcon icon="fa-solid fa-key" />
                </button>

                <button 
                  @click="toggleUser(user)" 
                  class="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 border border-white/5"
                  :class="user.is_active ? 'bg-danger/10 text-danger hover:bg-danger hover:text-white' : 'bg-success/10 text-success hover:bg-success hover:text-white'"
                  :title="user.is_active ? 'Inhabilitar Cuenta' : 'Habilitar Cuenta'"
                >
                  <FontAwesomeIcon :icon="user.is_active ? 'fa-solid fa-user-slash' : 'fa-solid fa-user-check'" />
                </button>
              </div>
            </td>
          </tr>
        </BaseTable>

        <template #footer>
          <div class="flex justify-between items-center px-4 py-2">
             <div class="text-[0.65rem] font-black text-white/10 uppercase tracking-widest hidden md:block">
               Control de acceso centralizado
             </div>
             <Pagination :pagination="pagination" @change-page="fetchUsers" />
          </div>
        </template>
      </BaseCard>
    </div>

    <!-- Modal Premium -->
    <SuperadminUserFormModal 
      :show="showEditModal" 
      :user="selectedUser" 
      @close="showEditModal = false"
      @saved="fetchUsers(pagination.current_page || 1)" 
    />
  </div>
</template>

<style scoped>
.text-gradient-primary {
  background: linear-gradient(135deg, #f7a600, #ffdf6d);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.premium-card {
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 2rem;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-premium-in {
  animation: slideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
