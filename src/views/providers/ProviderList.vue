<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
// Componentes
import BaseTable from '@/components/ui/BaseTable.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import Pagination from '@/components/ui/Pagination.vue'
import BaseCard from '@/components/shared/BaseCard.vue'
import ProviderFormModal from '@/components/shared/ProviderFormModal.vue'
import BalanceFormModal from '@/components/shared/BalanceFormModal.vue'
import { useProviderList } from '@/composables/providers/useProviderList'

const {
  authStore,
  permissionKey,
  showProviderModal,
  providerIdToEdit,
  showBalanceModal,
  selectedProvider,
  providers,
  pagination,
  filters,
  isLoading,
  totalProviders,
  activeProviders,
  totalDebtUSD,
  fetchProviders,
  openCreateModal,
  openEditModal,
  openBalanceModal,
  deleteProvider,
  formatNumber
} = useProviderList()

// Definición de Columnas
const tableHeaders = [
  { key: 'name', label: 'Proveedor / Contacto' },
  { key: 'financials', label: 'Saldos Pendientes' },
  { key: 'contact', label: 'Vía de Contacto' },
  { key: 'status', label: 'Estado' },
  { key: 'actions', label: '' },
]
</script>

<template>
  <div class="space-y-10 animate-premium-in pb-12">
    
    <!-- Header Premium -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
        <h1 class="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <span class="w-1.5 h-10 bg-primary rounded-full"></span>
          Gestión de <span class="text-gradient-primary">Proveedores</span>
        </h1>
        <p class="text-white/30 text-xs font-bold uppercase tracking-[0.2em] mt-2 ml-4">Administración financiera de aliados comerciales</p>
      </div>

      <button 
        v-if="authStore.can(permissionKey)" 
        @click="openCreateModal" 
        class="bg-primary hover:bg-primary-dark text-secondary px-6 py-3.5 rounded-2xl font-black transition-all shadow-[0_10px_30px_rgba(247,166,0,0.2)] flex items-center gap-3 group active:scale-95"
      >
        <FontAwesomeIcon icon="fa-solid fa-truck-fast" class="text-lg group-hover:translate-x-1 transition-transform" /> 
        <span>Nuevo Proveedor</span>
      </button>
    </div>

    <!-- Panel de KPI v5 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Card: Total -->
      <div class="premium-card p-6 bg-white/[0.02]">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10 shadow-inner">
            <FontAwesomeIcon icon="fa-solid fa-address-book" class="text-xl" />
          </div>
          <div class="flex flex-col">
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/30 leading-none mb-1">Directorio Activo</span>
            <span class="text-xs font-bold text-primary/60">Proveedores registrados</span>
          </div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-4xl font-black text-white tracking-tighter">{{ totalProviders }}</span>
          <span class="text-xs font-bold text-white/20 uppercase tracking-widest">Entidades</span>
        </div>
      </div>

      <!-- Card: Deuda USD -->
      <div class="premium-card p-6 border-danger/5 bg-danger/[0.01]">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center text-danger border border-danger/10 shadow-inner">
             <FontAwesomeIcon icon="fa-solid fa-file-invoice-dollar" class="text-xl" />
          </div>
          <div class="flex flex-col">
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/30 leading-none mb-1">Compromisos Pendientes</span>
            <span class="text-xs font-bold text-danger/60">Balance consolidado USD</span>
          </div>
        </div>
        <div class="flex items-baseline gap-1">
          <span class="text-xs font-black text-danger/60 mr-1">$</span>
          <span class="text-4xl font-black text-white tracking-tighter">{{ formatNumber(totalDebtUSD).split(',')[0] }}</span>
          <span class="text-lg font-bold text-white/20 tracking-tighter">.{{ formatNumber(totalDebtUSD).split(',')[1] }}</span>
        </div>
      </div>

      <!-- Card: Operatividad -->
      <div class="premium-card p-6 bg-white/[0.02]">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success border border-success/10 shadow-inner text-xl">
             🏢
          </div>
          <div class="flex flex-col">
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/30 leading-none mb-1">Estatus Operativo</span>
            <span class="text-xs font-bold text-success/60">Proveedores en servicio</span>
          </div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-4xl font-black text-white tracking-tighter">{{ activeProviders }}</span>
          <span class="text-xs font-bold text-white/20 uppercase tracking-widest">En Línea</span>
        </div>
      </div>
    </div>

    <!-- Listado con Filtros y Tabla v5 -->
    <div class="space-y-6">
      <FilterBar @update:filters="filters = $event" placeholder="Buscar por nombre, contacto o correo..." />

      <BaseCard title="Central de Proveedores" subtitle="Monitoreo multimoneda y gestión de perfiles comerciales.">
        <BaseTable :headers="tableHeaders" :data="providers" :is-loading="isLoading">
          <tr v-for="provider in providers" :key="provider.id" class="group hover:bg-white/[0.01] transition-colors">
            
            <!-- Nombre -->
            <td class="font-bold text-white py-5 group-hover:text-primary transition-colors">
              <div class="flex flex-col">
                <span class="text-base tracking-tight">{{ provider.name }}</span>
                <span class="text-[0.65rem] font-black text-white/20 uppercase tracking-widest">{{ provider.email || 'SIN CORREO' }}</span>
              </div>
            </td>

            <!-- Balances -->
            <td>
              <div class="flex flex-wrap gap-2">
                <template v-if="provider.balances && provider.balances.length > 0">
                  <div v-for="(bal, idx) in provider.balances" :key="idx" 
                       class="bg-white/[0.03] border border-white/5 px-2.5 py-1.5 rounded-xl flex items-baseline gap-2 group/bal hover:bg-white/[0.05] transition-all">
                    <span class="text-[0.6rem] font-black uppercase tracking-widest" :class="bal.currency_code === 'USD' ? 'text-success' : 'text-info'">{{ bal.currency_code }}</span>
                    <span class="text-xs font-black text-white tracking-tighter">{{ bal.symbol }} {{ formatNumber(bal.amount) }}</span>
                  </div>
                </template>
                <span v-else class="text-[0.6rem] font-black text-white/10 uppercase tracking-widest italic py-2">Sin saldos pendientes</span>
              </div>
            </td>

            <!-- Contacto -->
            <td>
              <div class="flex flex-col gap-1">
                <span class="text-sm font-mono text-white/60 flex items-center gap-2">
                  <FontAwesomeIcon icon="fa-solid fa-phone-volume" class="text-[0.6rem] text-primary/40" />
                  {{ provider.phone || 'N/A' }}
                </span>
                <span class="text-[0.65rem] font-bold text-white/20 uppercase tracking-widest truncate max-w-[150px]">
                  Atención: {{ provider.contact_person || 'No especificado' }}
                </span>
              </div>
            </td>

            <!-- Estado -->
            <td>
              <span 
                class="px-3 py-1.5 rounded-xl text-[0.6rem] font-black uppercase tracking-[0.2em] transition-all border"
                :class="provider.is_active 
                  ? 'bg-success/5 text-success border-success/20 shadow-[0_0_15px_rgba(46,204,113,0.05)]' 
                  : 'bg-white/5 text-white/20 border-white/5 opacity-50'"
              >
                {{ provider.is_active ? 'Activo' : 'Pausado' }}
              </span>
            </td>

            <!-- Acciones -->
            <td>
              <div class="flex justify-end gap-2 opacity-10 group-hover:opacity-100 transition-opacity duration-300">
                <template v-if="authStore.can(permissionKey)">
                  <button 
                    @click="openBalanceModal(provider)" 
                    class="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-all hover:bg-primary hover:text-secondary hover:shadow-lg active:scale-90"
                    title="Ajustar Balances"
                  >
                    <FontAwesomeIcon icon="fa-solid fa-scale-balanced" />
                  </button>
                  <button 
                    @click="openEditModal(provider.id)" 
                    class="w-9 h-9 rounded-xl bg-info/10 text-info flex items-center justify-center transition-all hover:bg-info hover:text-white hover:shadow-lg active:scale-90"
                    title="Editar Proveedor"
                  >
                    <FontAwesomeIcon icon="fa-solid fa-user-pen" />
                  </button>
                  <button 
                    @click="deleteProvider(provider.id, provider.name)" 
                    class="w-9 h-9 rounded-xl bg-danger/10 text-danger flex items-center justify-center transition-all hover:bg-danger hover:text-white hover:shadow-lg active:scale-90"
                    title="Eliminar"
                  >
                    <FontAwesomeIcon icon="fa-solid fa-trash-can" />
                  </button>
                </template>
                <span v-else class="text-[0.55rem] font-black text-white/10 uppercase tracking-widest py-2">Restringido</span>
              </div>
            </td>
          </tr>
        </BaseTable>

        <template #footer>
          <div class="flex justify-between items-center px-4 py-2">
             <div class="text-[0.65rem] font-black text-white/10 uppercase tracking-widest hidden md:block">
               Mostrando {{ providers.length }} de {{ pagination.total || '...' }} registros
             </div>
             <Pagination :pagination="pagination" @change-page="fetchProviders" />
          </div>
        </template>
      </BaseCard>
    </div>

    <!-- Modales Premium -->
    <ProviderFormModal 
      :show="showProviderModal" 
      :provider-id="providerIdToEdit" 
      @close="showProviderModal = false"
      @saved="fetchProviders(pagination.current_page || 1)" 
    />

    <BalanceFormModal 
      :show="showBalanceModal" 
      resource="providers" 
      :entity-id="selectedProvider?.id"
      :entity-name="selectedProvider?.name" 
      @close="showBalanceModal = false"
      @saved="fetchProviders(pagination.current_page || 1)" 
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