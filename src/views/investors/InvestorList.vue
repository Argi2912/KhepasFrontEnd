<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import alert from '@/services/alert'
import notify from '@/services/notify'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// Componentes UI
import BaseTable from '@/components/ui/BaseTable.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import Pagination from '@/components/ui/Pagination.vue'
import BaseCard from '@/components/shared/BaseCard.vue'
import InvestorFormModal from '@/components/shared/InvestorFormModal.vue'
import BalanceFormModal from '@/components/shared/BalanceFormModal.vue'
import InvestorTransferModal from '@/components/shared/InvestorTransferModal.vue'

const authStore = useAuthStore()
const permissionKey = 'manage_exchanges'

const showInvestorModal = ref(false)
const investorIdToEdit = ref(null)

// Estados para Modales
const showBalanceModal = ref(false)
const showTransferModal = ref(false)
const selectedInvestor = ref(null)

const investors = ref([])
const pagination = ref({})
const filters = ref({})
const isLoading = ref(false)

const tableHeaders = [
  { key: 'name', label: 'Inversionista / Identidad' },
  { key: 'current_balance', label: 'Estructura de Capital' },
  { key: 'contact', label: 'Contacto Directo' },
  { key: 'status', label: 'Estado' },
  { key: 'actions', label: '' },
]

/**
 * Estadísticas Consolidadas
 */
const totalCapital = computed(() => {
  return investors.value.reduce((acc, i) => acc + (Number(i.capital_historico) || 0), 0)
})
const totalLiquid = computed(() => {
  return investors.value.reduce((acc, i) => acc + (Number(i.available_balance || i.current_balance) || 0), 0)
})
const activeCount = computed(() => investors.value.filter(i => i.is_active).length)

const fetchInvestors = async (page = 1) => {
  isLoading.value = true
  const params = { page, ...filters.value }
  try {
    const response = await api.get('/investors', { params })
    investors.value = response.data.data
    const { data, ...pagData } = response.data
    pagination.value = pagData
  } catch (error) {
    notify.error('Fallo al sincronizar la cartera de inversionistas.')
  } finally {
    isLoading.value = false
  }
}

const openCreateModal = () => {
  investorIdToEdit.value = null
  showInvestorModal.value = true
}

const openEditModal = (id) => {
  investorIdToEdit.value = id
  showInvestorModal.value = true
}

const openBalanceModal = (investor) => {
  selectedInvestor.value = investor
  showBalanceModal.value = true
}

const openTransferModal = (investor) => {
  selectedInvestor.value = investor
  showTransferModal.value = true
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(value || 0)
}

const deleteInvestor = async (id, name) => {
  if (!authStore.can(permissionKey)) return notify.error('Acceso restringido.')
  const confirmed = await alert.confirm(`¿Remover inversionista "${name}"?`, 'Esto archivará su historial de aportes.')
  if (!confirmed) return
  try {
    await api.delete(`/investors/${id}`)
    notify.success('Inversionista removido del sistema.')
    fetchInvestors(pagination.value.current_page || 1)
  } catch (error) {
    notify.error('Fallo al eliminar: Verifique si posee capital activo.')
  }
}

watch(filters, () => fetchInvestors(1), { deep: true })
onMounted(() => fetchInvestors())
</script>

<template>
  <div class="space-y-10 animate-premium-in pb-12">
    
    <!-- Header Premium -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
        <h1 class="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <span class="w-1.5 h-10 bg-primary rounded-full"></span>
          Gestión de <span class="text-gradient-primary">Inversionistas</span>
        </h1>
        <p class="text-white/30 text-xs font-bold uppercase tracking-[0.2em] mt-2 ml-4">Administración de capital social y liquidez</p>
      </div>

      <button 
        v-if="authStore.can(permissionKey)" 
        @click="openCreateModal" 
        class="bg-primary hover:bg-primary-dark text-secondary px-6 py-3.5 rounded-2xl font-black transition-all shadow-[0_10px_30px_rgba(247,166,0,0.2)] flex items-center gap-3 group active:scale-95"
      >
        <FontAwesomeIcon icon="fa-solid fa-hand-holding-dollar" class="text-lg group-hover:-translate-y-1 transition-transform duration-500" /> 
        <span>Nuevo Inversionista</span>
      </button>
    </div>

    <!-- Panel de KPI v5 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Card: Capital Histórico -->
      <div class="premium-card p-6 bg-white/[0.02]">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-info/10 flex items-center justify-center text-info border border-info/10 shadow-inner">
            <FontAwesomeIcon icon="fa-solid fa-vault" class="text-xl" />
          </div>
          <div class="flex flex-col">
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/30 leading-none mb-1">Capital Histórico</span>
            <span class="text-xs font-bold text-info/60">Aportes totales registrados</span>
          </div>
        </div>
        <div class="flex items-baseline gap-1">
          <span class="text-xs font-black text-info/60 mr-1">$</span>
          <span class="text-4xl font-black text-white tracking-tighter">{{ formatCurrency(totalCapital).split(',')[0].replace('$', '') }}</span>
          <span class="text-lg font-bold text-white/20 tracking-tighter">.{{ formatCurrency(totalCapital).split(',')[1] }}</span>
        </div>
      </div>

      <!-- Card: Liquidez Disponible -->
      <div class="premium-card p-6 border-success/5 bg-success/[0.01]">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success border border-success/10 shadow-inner">
             <FontAwesomeIcon icon="fa-solid fa-money-bill-trend-up" class="text-xl" />
          </div>
          <div class="flex flex-col">
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/30 leading-none mb-1">Liquidez Disponible</span>
            <span class="text-xs font-bold text-success/60">Fondo líquido para operaciones</span>
          </div>
        </div>
        <div class="flex items-baseline gap-1">
          <span class="text-xs font-black text-success/60 mr-1">$</span>
          <span class="text-4xl font-black text-white tracking-tighter">{{ formatCurrency(totalLiquid).split(',')[0].replace('$', '') }}</span>
          <span class="text-lg font-bold text-white/20 tracking-tighter">.{{ formatCurrency(totalLiquid).split(',')[1] }}</span>
        </div>
      </div>

      <!-- Card: Accionistas Activos -->
      <div class="premium-card p-6 bg-white/[0.02]">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10 shadow-inner">
             <FontAwesomeIcon icon="fa-solid fa-users-gear" class="text-xl" />
          </div>
          <div class="flex flex-col">
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/30 leading-none mb-1">Estructura Social</span>
            <span class="text-xs font-bold text-primary/60">Socios en participación</span>
          </div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-4xl font-black text-white tracking-tighter">{{ activeCount }}</span>
          <span class="text-xs font-bold text-white/20 uppercase tracking-widest">Activos</span>
        </div>
      </div>
    </div>

    <!-- Listado con Filtros y Tabla v5 -->
    <div class="space-y-6">
      <FilterBar @update:filters="filters = $event" placeholder="Buscar por nombre, alias o identificación..." />

      <BaseCard title="Directorio de Accionistas" subtitle="Visión detallada de aportes, liquidaciones y saldos remanentes.">
        <BaseTable :headers="tableHeaders" :data="investors" :is-loading="isLoading">
          <tr v-for="investor in investors" :key="investor.id" class="group">
            
            <!-- Nombre -->
            <td class="font-bold text-white transition-colors group-hover:text-primary">
              <div class="flex flex-col">
                <span class="text-base tracking-tight leading-tight">{{ investor.name }}</span>
                <span v-if="investor.alias" class="text-[0.6rem] font-black text-primary/40 uppercase tracking-[0.2em] mt-0.5">"{{ investor.alias }}"</span>
              </div>
            </td>

            <!-- Capital -->
            <td>
              <div class="flex flex-col gap-1.5 min-w-[180px]">
                <div class="flex items-center justify-between text-[0.6rem] font-black uppercase tracking-widest px-2 py-0.5 bg-white/[0.02] rounded-lg border border-white/5 group-hover:border-info/20 group-hover:bg-info/[0.02] transition-all">
                  <span class="text-white/20">Base:</span>
                  <span class="text-info/80">{{ formatCurrency(investor.capital_historico) }}</span>
                </div>
                <div class="flex items-center justify-between text-[0.65rem] font-black uppercase tracking-widest px-2 py-1 bg-success/[0.03] rounded-lg border border-success/10 group-hover:border-success/30 transition-all">
                  <span class="text-success/40">Disponible:</span>
                  <span class="text-success">{{ formatCurrency(investor.available_balance || investor.current_balance) }}</span>
                </div>
              </div>
            </td>

            <!-- Contacto -->
            <td>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-mono text-white/60 flex items-center gap-2">
                  <FontAwesomeIcon icon="fa-solid fa-envelope" class="text-[0.6rem] text-white/20" />
                  {{ investor.email || 'N/A' }}
                </span>
                <span class="text-[0.65rem] font-bold text-white/30 flex items-center gap-2">
                   <FontAwesomeIcon icon="fa-solid fa-phone" class="text-[0.6rem] text-white/10" />
                   {{ investor.phone || '---' }}
                </span>
              </div>
            </td>

            <!-- Estado -->
            <td>
              <span 
                class="px-3 py-1.5 rounded-xl text-[0.6rem] font-black uppercase tracking-[0.2em] transition-all border"
                :class="investor.is_active 
                  ? 'bg-success/5 text-success border-success/20 shadow-[0_0_15px_rgba(46,204,113,0.05)]' 
                  : 'bg-white/5 text-white/20 border-white/5 opacity-50'"
              >
                {{ investor.is_active ? 'Activo' : 'Retirado' }}
              </span>
            </td>

            <!-- Acciones -->
            <td>
              <div class="flex justify-end gap-2 opacity-10 group-hover:opacity-100 transition-all duration-300">
                <button 
                  @click="openBalanceModal(investor)" 
                  class="w-9 h-9 rounded-xl bg-success/10 text-success flex items-center justify-center transition-all hover:bg-success hover:text-white hover:shadow-lg active:scale-90"
                  title="Inyectar Capital"
                >
                  <FontAwesomeIcon icon="fa-solid fa-circle-plus" />
                </button>

                <button 
                  @click="openTransferModal(investor)" 
                  class="w-9 h-9 rounded-xl bg-warning/10 text-warning flex items-center justify-center transition-all hover:bg-warning hover:text-secondary hover:shadow-lg active:scale-90"
                  title="Retiro de Liquidez"
                >
                  <FontAwesomeIcon icon="fa-solid fa-right-from-bracket" />
                </button>

                <template v-if="authStore.can(permissionKey)">
                  <button 
                    @click="openEditModal(investor.id)" 
                    class="w-9 h-9 rounded-xl bg-info/10 text-info flex items-center justify-center transition-all hover:bg-info hover:text-white hover:shadow-lg active:scale-90"
                    title="Configurar Perfil"
                  >
                    <FontAwesomeIcon icon="fa-solid fa-user-gear" />
                  </button>
                  <button 
                    @click="deleteInvestor(investor.id, investor.name)" 
                    class="w-9 h-9 rounded-xl bg-danger/10 text-danger flex items-center justify-center transition-all hover:bg-danger hover:text-white hover:shadow-lg active:scale-90"
                    title="Eliminar"
                  >
                    <FontAwesomeIcon icon="fa-solid fa-trash-can" />
                  </button>
                </template>
              </div>
            </td>
          </tr>
        </BaseTable>

        <template #footer>
           <Pagination :pagination="pagination" @change-page="fetchInvestors" />
        </template>
      </BaseCard>
    </div>

    <!-- Modales Premium -->
    <InvestorFormModal :show="showInvestorModal" :investor-id="investorIdToEdit" @close="showInvestorModal = false"
      @saved="fetchInvestors(pagination.current_page || 1)" />

    <BalanceFormModal :show="showBalanceModal" resource="investors" :entity-id="selectedInvestor?.id"
      :entity-name="selectedInvestor?.name" :available-balance="selectedInvestor?.available_balance || selectedInvestor?.current_balance" @close="showBalanceModal = false"
      @saved="fetchInvestors(pagination.current_page || 1)" />

    <InvestorTransferModal :show="showTransferModal" :investor="selectedInvestor" @close="showTransferModal = false"
      @saved="fetchInvestors(pagination.current_page || 1)" />
  </div>
</template>