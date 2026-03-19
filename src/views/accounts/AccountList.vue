<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import BaseTable from '@/components/ui/BaseTable.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import Pagination from '@/components/ui/Pagination.vue'
import BaseCard from '@/components/shared/BaseCard.vue'
import AccountFormModal from '@/components/shared/AccountFormModal.vue'
import { useAccountList } from '@/composables/accounts/useAccountList'

const {
  authStore,
  permissionKey,
  showAccountModal,
  accountIdToEdit,
  accounts,
  pagination,
  filters,
  isLoading,
  totalBalanceUSD,
  totalAccountsCount,
  activeCurrencies,
  formatCurrencyPremium,
  fetchAccounts,
  openCreateModal,
  openEditModal,
  deleteAccount
} = useAccountList()

const tableHeaders = [
  { key: 'name', label: 'Nombre de Cuenta' },
  { key: 'currency_code', label: 'Divisa' },
  { key: 'balance', label: 'Saldo Neto' },
  { key: 'details', label: 'Observaciones' },
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
          Control de <span class="text-gradient-primary">Cuentas y Caja</span>
        </h1>
        <p class="text-white/30 text-xs font-bold uppercase tracking-[0.2em] mt-2 ml-4">Monitor centralizado de liquidez operativa</p>
      </div>

      <button 
        v-if="authStore.can(permissionKey)" 
        @click="openCreateModal" 
        class="bg-primary hover:bg-primary-dark text-secondary px-6 py-3.5 rounded-2xl font-black transition-all shadow-[0_10px_30px_rgba(247,166,0,0.2)] flex items-center gap-3 group active:scale-95"
      >
        <FontAwesomeIcon icon="fa-solid fa-plus-circle" class="text-lg group-hover:rotate-90 transition-transform duration-500" /> 
        <span>Nueva Cuenta</span>
      </button>
    </div>

    <!-- Panel de KPI v5 (Estilo Dashboard) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Card: Total Cuentas -->
      <div class="premium-card p-6 bg-white/[0.02]">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10 shadow-inner">
            <FontAwesomeIcon icon="fa-solid fa-vault" class="text-xl" />
          </div>
          <div class="flex flex-col">
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/30 leading-none mb-1">Cuentas Registradas</span>
            <span class="text-xs font-bold text-primary/60">Flujo de caja activo</span>
          </div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-4xl font-black text-white tracking-tighter">{{ totalAccountsCount }}</span>
          <span class="text-xs font-bold text-white/20 uppercase tracking-widest">Entidades</span>
        </div>
      </div>

      <!-- Card: Balance USD Global -->
      <div class="premium-card p-6 border-primary/5 bg-primary/[0.01]">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success border border-success/10 shadow-inner text-xl">
             💵
          </div>
          <div class="flex flex-col">
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/30 leading-none mb-1">Balance Consolidado USD</span>
            <span class="text-xs font-bold text-success/60">Disponibilidad inmediata</span>
          </div>
        </div>
        <div class="flex items-baseline gap-1 group">
          <span class="text-xs font-black text-success/60 mr-1">$</span>
          <span class="text-4xl font-black text-white tracking-tighter">
            {{ formatCurrencyPremium(totalBalanceUSD, 'USD').whole }}
          </span>
          <span class="text-lg font-bold text-white/20 tracking-tighter">.{{ formatCurrencyPremium(totalBalanceUSD, 'USD').decimal }}</span>
        </div>
      </div>

      <!-- Card: Divisas Activas -->
      <div class="premium-card p-6 bg-white/[0.02]">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-info/10 flex items-center justify-center text-info border border-info/10 shadow-inner">
             <FontAwesomeIcon icon="fa-solid fa-globe" class="text-xl" />
          </div>
          <div class="flex flex-col">
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/30 leading-none mb-1">Diversificación</span>
            <span class="text-xs font-bold text-info/60">Divisas en operación</span>
          </div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-4xl font-black text-white tracking-tighter">{{ activeCurrencies }}</span>
          <span class="text-xs font-bold text-white/20 uppercase tracking-widest">Monedas</span>
        </div>
      </div>
    </div>

    <!-- Listado con Filtros y Tabla v5 -->
    <div class="space-y-6">
      <FilterBar @update:filters="filters = $event" placeholder="Buscar por nombre de cuenta o plataforma..." />

      <BaseCard title="Detalle de Cuentas" subtitle="Gestión granular de saldos y configuraciones bancarias/plataformas.">
        <BaseTable :headers="tableHeaders" :data="accounts" :is-loading="isLoading">
          <tr v-for="account in accounts" :key="account.id" class="group hover:bg-white/[0.01] transition-colors">
            
            <!-- Nombre de Cuenta -->
            <td class="font-bold text-white py-5">
              <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full" :class="account.balance < 0 ? 'bg-danger shadow-[0_0_8px_rgba(231,76,60,0.5)]' : 'bg-success shadow-[0_0_8px_rgba(46,204,113,0.5)]'"></div>
                <span class="group-hover:text-primary transition-colors">{{ account.name }}</span>
              </div>
            </td>

            <!-- Divisa Badge -->
            <td>
              <span class="px-2.5 py-1 rounded-lg bg-white/5 text-white/40 text-[0.65rem] font-black tracking-[0.2em] border border-white/5 uppercase">
                {{ account.currency_code }}
              </span>
            </td>

            <!-- Saldo con Formato Premium -->
            <td class="font-black text-sm tracking-tight" :class="account.balance < 0 ? 'text-danger' : 'text-success'">
              <div class="flex items-baseline gap-1">
                <span class="text-[0.65rem] opacity-50">{{ formatCurrencyPremium(account.balance, account.currency_code).symbol }}</span>
                <span>{{ formatCurrencyPremium(account.balance, account.currency_code).whole }}</span>
                <span class="text-[0.6rem] opacity-30">.{{ formatCurrencyPremium(account.balance, account.currency_code).decimal }}</span>
              </div>
            </td>

            <!-- Detalles / Notas -->
            <td class="text-[0.7rem] font-bold text-white/20 italic tracking-wide max-w-[200px] truncate">
              {{ account.details || 'Sin observaciones' }}
            </td>

            <!-- Acciones Refinadas -->
            <td>
              <div class="flex justify-end gap-2 opacity-10 group-hover:opacity-100 transition-opacity duration-300">
                <template v-if="authStore.can(permissionKey)">
                  <button 
                    @click="openEditModal(account.id)" 
                    class="w-9 h-9 rounded-xl bg-info/10 text-info flex items-center justify-center transition-all hover:bg-info hover:text-white hover:shadow-lg active:scale-90"
                    title="Editar"
                  >
                    <FontAwesomeIcon icon="fa-solid fa-pen-to-square" />
                  </button>
                  <button 
                    @click="deleteAccount(account.id, account.name)" 
                    class="w-9 h-9 rounded-xl bg-danger/10 text-danger flex items-center justify-center transition-all hover:bg-danger hover:text-white hover:shadow-lg active:scale-90"
                    title="Eliminar"
                  >
                    <FontAwesomeIcon icon="fa-solid fa-trash" />
                  </button>
                </template>
                <span v-else class="text-[0.55rem] font-black text-white/10 uppercase tracking-widest py-2">Solo lectura</span>
              </div>
            </td>
          </tr>
        </BaseTable>

        <template #footer>
          <div class="flex justify-between items-center px-4 py-2">
             <div class="text-[0.65rem] font-black text-white/10 uppercase tracking-widest hidden md:block">
               Mostrando {{ accounts.length }} de {{ pagination.total || '...' }} resultados
             </div>
             <Pagination :pagination="pagination" @change-page="fetchAccounts" />
          </div>
        </template>
      </BaseCard>
    </div>

    <!-- Modal Premium -->
    <AccountFormModal 
      :show="showAccountModal" 
      :account-id="accountIdToEdit" 
      @close="showAccountModal = false"
      @saved="fetchAccounts(pagination.current_page || 1)" 
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