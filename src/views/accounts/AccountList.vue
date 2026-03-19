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
import AccountFormModal from '@/components/shared/AccountFormModal.vue'

const authStore = useAuthStore()
const permissionKey = 'manage_exchanges'

// Estado del Modal
const showAccountModal = ref(false)
const accountIdToEdit = ref(null)

// Estado de la Lista
const accounts = ref([])
const pagination = ref({})
const filters = ref({})
const isLoading = ref(false)

const tableHeaders = [
  { key: 'name', label: 'Nombre de Cuenta' },
  { key: 'currency_code', label: 'Divisa' },
  { key: 'balance', label: 'Saldo Neto' },
  { key: 'details', label: 'Observaciones' },
  { key: 'actions', label: '' },
]

/**
 * Totales para KPI Cards (Calculados localmente para agilidad)
 */
const totalBalanceUSD = computed(() => {
  return accounts.value
    .filter(a => a.currency_code === 'USD' || a.currency_code === 'USDT')
    .reduce((acc, curr) => acc + Number(curr.balance), 0)
})

const totalAccountsCount = computed(() => accounts.value.length)

const activeCurrencies = computed(() => {
  const codes = accounts.value.map(a => a.currency_code)
  return [...new Set(codes)].length
})

/**
 * Formatea un número a moneda (Premium: Separa enteros de decimales)
 */
const formatCurrencyPremium = (value, currency = 'USD') => {
  if (value === null || value === undefined) value = 0
  let currencyCode = currency === 'USDT' ? 'USD' : currency
  
  const formatter = new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  
  const formatted = formatter.format(value)
  const [whole, decimal] = formatted.split(',')
  return { whole, decimal, symbol: currencyCode === 'BS' ? 'Bs.' : (currencyCode === 'USD' ? '$' : currencyCode) }
}

/**
 * Carga la lista de cuentas.
 */
const fetchAccounts = async (page = 1) => {
  isLoading.value = true
  const params = { page: page, ...filters.value }
  try {
    const response = await api.get('/accounts', { params })
    accounts.value = response.data.data
    const { data, ...pagData } = response.data
    pagination.value = pagData
  } catch (error) {
    notify.error('Error al cargar la lista de cuentas.')
  } finally {
    isLoading.value = false
  }
}

const openCreateModal = () => {
  accountIdToEdit.value = null
  showAccountModal.value = true
}

const openEditModal = (accountId) => {
  accountIdToEdit.value = accountId
  showAccountModal.value = true
}

const deleteAccount = async (accountId, accountName) => {
  if (!authStore.can(permissionKey)) {
    notify.error('No tienes permiso para eliminar cuentas.')
    return
  }
  const confirmed = await alert.confirm(
    `¿Eliminar cuenta ${accountName}?`,
    'Esta acción solo es posible si el saldo es exactamente CERO.',
  )
  if (confirmed) {
    try {
      await api.delete(`/accounts/${accountId}`)
      notify.success('Cuenta liquidada correctamente.')
      fetchAccounts(pagination.value.current_page)
    } catch (error) {
      notify.error('Fallo al eliminar: Verifique que el saldo sea cero.')
    }
  }
}

watch(filters, () => fetchAccounts(1), { deep: true })
onMounted(() => fetchAccounts())
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
          <tr v-for="account in accounts" :key="account.id" class="group">
            
            <!-- Nombre de Cuenta -->
            <td class="font-bold text-white transition-colors group-hover:text-primary">
              <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full" :class="account.balance < 0 ? 'bg-danger shadow-[0_0_8px_rgba(231,76,60,0.5)]' : 'bg-success shadow-[0_0_8px_rgba(46,204,113,0.5)]'"></div>
                <span>{{ account.name }}</span>
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
          <div class="flex justify-between items-center px-2">
             <div class="text-[0.65rem] font-black text-white/10 uppercase tracking-widest hidden md:block">
               Mostrando {{ accounts.length }} de {{ pagination.total || '...' }} resultados
             </div>
             <Pagination :pagination="pagination" @change-page="fetchAccounts" />
          </div>
        </template>
      </BaseCard>
    </div>

    <!-- Modal Premium -->
    <AccountFormModal :show="showAccountModal" :account-id="accountIdToEdit" @close="showAccountModal = false"
      @saved="fetchAccounts(pagination.current_page || 1)" />
  </div>
</template>

<style scoped>
/* Las animaciones y estilos base se heredan de global.css y animate-premium-in */
</style>