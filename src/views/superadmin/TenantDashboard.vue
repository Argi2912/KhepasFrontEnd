<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
// Componentes Base
import BaseTable from '@/components/ui/BaseTable.vue'
import BaseModal from '@/components/shared/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import Pagination from '@/components/ui/Pagination.vue'
import BaseCard from '@/components/shared/BaseCard.vue'
import { useTenantDashboard } from '@/composables/superadmin/useTenantDashboard'

const {
  stats,
  tenants,
  isLoading,
  pagination,
  showModal,
  isSubmitting,
  form,
  fetchTenants,
  createTenant,
  toggleTenant,
  deleteTenant,
} = useTenantDashboard()

const headers = [
  { key: 'status', label: 'Estado' },
  { key: 'name', label: 'Negocio / Tenant' },
  { key: 'plan', label: 'Plan' },
  { key: 'users', label: 'Usuarios' },
  { key: 'admin', label: 'Admin Responsable' },
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
          Panel <span class="text-gradient-primary">Superadmin</span>
        </h1>
        <p class="text-white/30 text-xs font-bold uppercase tracking-[0.2em] mt-2 ml-4">Control global de ecosistema multinivel</p>
      </div>

      <button 
        @click="showModal = true" 
        class="bg-primary hover:bg-primary-dark text-secondary px-6 py-3.5 rounded-2xl font-black transition-all shadow-[0_10px_30px_rgba(247,166,0,0.2)] flex items-center gap-3 group active:scale-95"
      >
        <FontAwesomeIcon icon="fa-solid fa-plus" class="text-lg group-hover:rotate-90 transition-transform duration-300" /> 
        <span>Nuevo Tenant</span>
      </button>
    </div>

    <!-- Panel de KPI v5 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      
      <!-- Total Tenants -->
      <div class="premium-card p-6 bg-white/[0.02]">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-info/10 flex items-center justify-center text-info border border-info/10 shadow-inner">
            <FontAwesomeIcon icon="fa-solid fa-building" class="text-xl" />
          </div>
          <div class="flex flex-col">
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/30 leading-none mb-1">Estructura Global</span>
            <span class="text-xs font-bold text-info/60">Total de negocios</span>
          </div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-4xl font-black text-white tracking-tighter">{{ stats.total_tenants }}</span>
          <span class="text-xs font-bold text-white/20 uppercase tracking-widest">Empresas</span>
        </div>
      </div>

      <!-- Active Tenants -->
      <div class="premium-card p-6 border-success/5 bg-success/[0.01]">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success border border-success/10 shadow-inner">
            <FontAwesomeIcon icon="fa-solid fa-check-double" class="text-xl" />
          </div>
          <div class="flex flex-col">
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/30 leading-none mb-1">Operatividad</span>
            <span class="text-xs font-bold text-success/60">Tenants en servicio</span>
          </div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-4xl font-black text-white tracking-tighter">{{ stats.active_tenants }}</span>
          <span class="text-[0.65rem] font-black text-success uppercase tracking-widest">En Línea</span>
        </div>
      </div>

      <!-- Inactive Tenants -->
      <div class="premium-card p-6 border-danger/5 bg-danger/[0.01]">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center text-danger border border-danger/10 shadow-inner">
            <FontAwesomeIcon icon="fa-solid fa-ban" class="text-xl" />
          </div>
          <div class="flex flex-col">
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/30 leading-none mb-1">Interrupciones</span>
            <span class="text-xs font-bold text-danger/60">Negocios suspendidos</span>
          </div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-4xl font-black text-white tracking-tighter">{{ stats.inactive_tenants }}</span>
          <span class="text-[0.65rem] font-black text-danger uppercase tracking-widest">Fuera</span>
        </div>
      </div>

      <!-- Total Users -->
      <div class="premium-card p-6 bg-white/[0.02]">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10 shadow-inner">
            <FontAwesomeIcon icon="fa-solid fa-users-rectangle" class="text-xl" />
          </div>
          <div class="flex flex-col">
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/30 leading-none mb-1">Usuarios Finales</span>
            <span class="text-xs font-bold text-primary/60">Cuentas activas en red</span>
          </div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-4xl font-black text-white tracking-tighter">{{ stats.total_users }}</span>
          <span class="text-xs font-bold text-white/20 uppercase tracking-widest">Cuentas</span>
        </div>
      </div>
    </div>

    <!-- Directorio de Tenants -->
    <BaseCard title="Directorio de Negocios" subtitle="Administración y monitoreo de instancias de clientes.">
        <BaseTable :headers="headers" :data="tenants" :is-loading="isLoading">
          <tr v-for="row in tenants" :key="row.id" class="group hover:bg-white/[0.01] transition-colors" :class="{ 'opacity-50 grayscale': !row.is_active }">
            
            <!-- Estado -->
            <td>
              <span 
                class="px-2.5 py-1 rounded-lg text-[0.6rem] font-black uppercase tracking-widest border"
                :class="row.is_active 
                  ? 'bg-success/5 text-success border-success/20' 
                  : 'bg-white/5 text-white/20 border-white/5'"
              >
                {{ row.status_text }}
              </span>
            </td>

            <!-- Negocio -->
            <td class="py-5">
              <div class="flex flex-col">
                <span class="text-base font-bold text-white group-hover:text-primary transition-colors leading-tight">{{ row.name }}</span>
                <span class="text-[0.65rem] font-mono text-white/20 uppercase tracking-widest mt-0.5">UUID: {{ row.id.split('-')[0] }}...</span>
              </div>
            </td>

            <!-- Plan -->
            <td>
              <span 
                class="px-3 py-1 rounded-xl text-[0.6rem] font-black uppercase tracking-widest border"
                :class="row.plan_price > 10 
                  ? 'bg-primary/5 text-primary border-primary/20 shadow-[0_0_15px_rgba(247,166,0,0.1)]' 
                  : 'bg-white/5 text-white/30 border-white/10'"
              >
                {{ row.plan_name || 'Básico' }}
              </span>
            </td>

            <!-- Usuarios -->
            <td>
              <div class="flex items-baseline gap-2">
                <span class="text-sm font-black text-white">{{ row.users_count || 0 }}</span>
                <span class="text-[0.6rem] font-black text-white/20 uppercase tracking-widest">Pax</span>
              </div>
            </td>

            <!-- Admin -->
            <td>
              <div class="flex flex-col">
                <span class="text-sm font-bold text-white/80">{{ row.admin_info }}</span>
                <span class="text-[0.65rem] font-black text-primary/40 uppercase tracking-tighter truncate max-w-[150px]">{{ row.admin_email }}</span>
              </div>
            </td>

            <!-- Fecha -->
            <td>
              <span class="text-xs font-bold text-white/20 uppercase tracking-widest">{{ row.created_fmt }}</span>
            </td>

            <!-- Acciones -->
            <td>
              <div class="flex justify-end gap-2 opacity-10 group-hover:opacity-100 transition-opacity duration-300">
                <button 
                  @click="toggleTenant(row)" 
                  class="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
                  :class="row.is_active ? 'bg-danger/10 text-danger hover:bg-danger hover:text-white' : 'bg-success/10 text-success hover:bg-success hover:text-white'"
                  :title="row.is_active ? 'Suspender Negocio' : 'Reactivar Negocio'"
                >
                  <FontAwesomeIcon :icon="row.is_active ? 'fa-solid fa-power-off' : 'fa-solid fa-play'" />
                </button>

                <button 
                  @click="deleteTenant(row)" 
                  class="w-9 h-9 rounded-xl bg-white/5 text-white/20 flex items-center justify-center transition-all hover:bg-danger hover:text-white hover:shadow-lg active:scale-90 border border-white/5"
                  title="Eliminar Instancia"
                >
                  <FontAwesomeIcon icon="fa-solid fa-trash-can" />
                </button>
              </div>
            </td>
          </tr>
        </BaseTable>

        <template #footer>
          <div class="flex justify-between items-center px-4 py-2">
             <div class="text-[0.65rem] font-black text-white/10 uppercase tracking-widest hidden md:block">
               Sincronización de red completa
             </div>
             <Pagination :pagination="pagination" @change-page="fetchTenants" />
          </div>
        </template>
    </BaseCard>

    <!-- Modal Premium -->
    <BaseModal :show="showModal" title="Registrar Nueva Entidad" @close="showModal = false">
      <form @submit.prevent="createTenant" class="space-y-6 py-4">
        
        <div class="space-y-4">
          <div class="text-[0.6rem] font-black text-primary uppercase tracking-[0.2em] mb-2 border-b border-white/5 pb-2">Identidad Corporativa</div>
          <BaseInput label="Razon Social" v-model="form.name" placeholder="Ej: Cambio Seguro C.A." required />
        </div>

        <div class="space-y-4">
          <div class="text-[0.6rem] font-black text-primary uppercase tracking-[0.2em] mb-2 border-b border-white/5 pb-2">Administrador Maestro</div>
          <BaseInput label="Nombre del Responsable" v-model="form.admin_name" required />
          <div class="grid grid-cols-2 gap-4">
            <BaseInput label="Email de Acceso" type="email" v-model="form.admin_email" required />
            <BaseInput label="Credencial Temporal" type="password" v-model="form.password" required />
          </div>
        </div>

        <div class="space-y-4">
          <div class="text-[0.6rem] font-black text-primary uppercase tracking-[0.2em] mb-2 border-b border-white/5 pb-2">Configuración de Servicio</div>
          <div class="grid grid-cols-2 gap-4">
            <div 
              @click="form.plan = 'basic'"
              class="p-4 rounded-2xl border-2 transition-all cursor-pointer"
              :class="form.plan === 'basic' ? 'bg-white/5 border-primary shadow-lg' : 'bg-white/[0.02] border-white/5 hover:border-white/10'"
            >
              <div class="text-xs font-black text-white mb-1">Standard</div>
              <div class="text-[0.6rem] font-bold text-white/30">$10.00 / mensual</div>
            </div>
            <div 
              @click="form.plan = 'pro'"
              class="p-4 rounded-2xl border-2 transition-all cursor-pointer"
              :class="form.plan === 'pro' ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10' : 'bg-white/[0.02] border-white/5 hover:border-white/10'"
            >
              <div class="text-xs font-black text-primary mb-1">Empresarial</div>
              <div class="text-[0.6rem] font-bold text-white/30">$29.99 / mensual</div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-6 border-t border-white/5">
          <button type="button" class="px-6 py-3 rounded-xl font-bold text-white/40 hover:text-white transition-colors" @click="showModal = false">Descartar</button>
          <button 
            type="submit" 
            class="bg-primary text-secondary px-8 py-3 rounded-2xl font-black transition-all hover:shadow-lg disabled:opacity-50"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Procesando...' : 'Confirmar Registro' }}
          </button>
        </div>
      </form>
    </BaseModal>
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