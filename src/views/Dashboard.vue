<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useAuthStore } from '@/stores/auth'
import { useCurrencyFormatter } from '@/utils/formatCurrency'

const authStore = useAuthStore()
const { format: formatCurrency } = useCurrencyFormatter()
const breakdown = ref([])
const isLoading = ref(true)

/**
 * Carga el resumen del dashboard desde la API.
 */
const fetchSummary = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/dashboard/summary')
    breakdown.value = response.data.breakdown || []
  } catch (error) {
    notify.error('No se pudieron cargar los datos del Dashboard.')
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (authStore.isLoggedIn) fetchSummary()
})
</script>

<template>
  <div class="space-y-10 animate-fade-in">
    <!-- Header con gradiente -->
    <div class="relative overflow-hidden p-8 rounded-3xl bg-secondary-light border border-white/5 shadow-2xl text-white">
      <div class="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -mr-20 -mt-20"></div>
      <div class="absolute bottom-0 left-0 w-32 h-32 bg-success/5 blur-[60px] rounded-full -ml-10 -mb-10"></div>
      
      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 font-sans">
        <div>
          <h1 class="text-4xl font-black mb-2 tracking-tight flex items-center gap-3">
             <span class="text-primary">Tu</span>Dashboard
          </h1>
          <p class="text-white/40 font-medium max-w-md">
            Monitoreo en tiempo real de tu liquidez global y flujos de caja operativos.
          </p>
        </div>
        <button @click="fetchSummary" class="bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 rounded-xl transition-all text-white/70 font-bold flex items-center gap-2 group">
          <FontAwesomeIcon icon="fa-solid fa-rotate" :spin="isLoading" class="group-hover:rotate-180 transition-transform duration-500" />
          Actualizar Datos
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="flex flex-col items-center justify-center py-24 bg-secondary/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-inner">
      <div class="relative">
        <div class="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <FontAwesomeIcon icon="fa-solid fa-bolt" class="text-primary text-xl" />
        </div>
      </div>
      <p class="text-white/40 mt-6 font-bold tracking-widest uppercase text-xs animate-pulse">Analizando mercados y cuentas...</p>
    </div>

    <div v-else-if="breakdown.length > 0" class="space-y-12">
      <!-- Grid de KPIs Premium -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Balance Neto -->
        <div class="premium-card p-8 rounded-3xl relative overflow-hidden group">
          <div class="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <FontAwesomeIcon icon="fa-solid fa-wallet" class="text-7xl text-white" />
          </div>
          <div class="flex items-center gap-3 mb-8">
            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <FontAwesomeIcon icon="fa-solid fa-wallet" />
            </div>
            <h3 class="text-xs font-black uppercase tracking-[0.2em] text-white/40">Balance Neto Real</h3>
          </div>
          <div class="space-y-4">
            <div v-for="item in breakdown" :key="item.currency_code" class="flex justify-between items-end">
              <span class="text-xs font-bold text-white/30 uppercase">{{ item.currency_code }}</span>
              <span class="text-2xl font-black tracking-tighter" :class="item.balance_neto < 0 ? 'text-danger' : 'text-white'">
                {{ formatCurrency(item.balance_neto, item.currency_code).split('.')[0] }}<span class="text-[0.6em] opacity-40">.{{ formatCurrency(item.balance_neto, item.currency_code).split('.')[1] || '00' }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Por Cobrar -->
        <div class="premium-card p-8 rounded-3xl relative overflow-hidden group">
          <div class="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <FontAwesomeIcon icon="fa-solid fa-hand-holding-dollar" class="text-7xl text-white" />
          </div>
          <div class="flex items-center gap-3 mb-8">
            <div class="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success border border-success/20">
              <FontAwesomeIcon icon="fa-solid fa-hand-holding-dollar" />
            </div>
            <h3 class="text-xs font-black uppercase tracking-[0.2em] text-white/40">Cuentas por Cobrar</h3>
          </div>
          <div class="space-y-4">
            <div v-for="item in breakdown.filter(i => i.por_cobrar > 0)" :key="'cobrar-' + item.currency_code" class="flex justify-between items-end">
              <span class="text-xs font-bold text-white/30 uppercase">{{ item.currency_code }}</span>
              <span class="text-2xl font-black text-success tracking-tighter">
                {{ formatCurrency(item.por_cobrar, item.currency_code).split('.')[0] }}<span class="text-[0.6em] opacity-60">.{{ formatCurrency(item.por_cobrar, item.currency_code).split('.')[1] || '00' }}</span>
              </span>
            </div>
            <div v-if="breakdown.filter(i => i.por_cobrar > 0).length === 0" class="py-4 flex flex-col items-center">
               <div class="w-1 bg-white/5 h-8 mb-2"></div>
               <span class="text-[0.7rem] font-bold text-white/20 italic">Libre de deudas externas</span>
            </div>
          </div>
        </div>

        <!-- Por Pagar -->
        <div class="premium-card p-8 rounded-3xl relative overflow-hidden group">
          <div class="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <FontAwesomeIcon icon="fa-solid fa-file-invoice-dollar" class="text-7xl text-white" />
          </div>
          <div class="flex items-center gap-3 mb-8">
            <div class="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center text-danger border border-danger/20">
              <FontAwesomeIcon icon="fa-solid fa-file-invoice-dollar" />
            </div>
            <h3 class="text-xs font-black uppercase tracking-[0.2em] text-white/40">Obligaciones Pendientes</h3>
          </div>
          <div class="space-y-4">
            <div v-for="item in breakdown.filter(i => i.por_pagar > 0)" :key="'pagar-' + item.currency_code" class="flex justify-between items-end">
              <span class="text-xs font-bold text-white/30 uppercase">{{ item.currency_code }}</span>
              <span class="text-2xl font-black text-danger tracking-tighter">
                {{ formatCurrency(item.por_pagar, item.currency_code).split('.')[0] }}<span class="text-[0.6em] opacity-60">.{{ formatCurrency(item.por_pagar, item.currency_code).split('.')[1] || '00' }}</span>
              </span>
            </div>
            <div v-if="breakdown.filter(i => i.por_pagar > 0).length === 0" class="py-4 flex flex-col items-center text-center">
               <div class="w-1 bg-white/5 h-8 mb-2"></div>
               <span class="text-[0.7rem] font-bold text-white/20 italic">Cartera de obligaciones limpia</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Detalle de Liquidez Inmediata -->
      <div class="space-y-8">
        <div class="flex items-center justify-between border-b border-white/5 pb-6">
          <h2 class="text-2xl font-black text-white flex items-center gap-4">
            <span class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-xl">🏦</span> 
            Liquidez Inmediata (Cajas)
          </h2>
          <span class="text-xs font-bold text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">ACTIVO</span>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="item in breakdown" :key="'caja-' + item.currency_code" 
               class="bg-secondary-light/50 p-6 rounded-3xl border border-white/5 backdrop-blur-sm transition-all hover:bg-white/5 hover:border-white/10 group shadow-lg">
            <div class="flex justify-between items-start mb-6">
              <span class="text-xs font-black text-white/20 uppercase tracking-widest">{{ item.currency_code }}</span>
              <span class="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-xs opacity-50 group-hover:opacity-100 transition-opacity">
                <FontAwesomeIcon icon="fa-solid fa-coins" class="text-primary" />
              </span>
            </div>
            <h4 class="text-2xl font-black text-white tracking-tighter mb-1">
              {{ formatCurrency(item.caja, item.currency_code).split('.')[0] }}<span class="text-xs font-medium opacity-30 text-white">.{{ formatCurrency(item.caja, item.currency_code).split('.')[1] || '00' }}</span>
            </h4>
            <p class="text-[0.65rem] font-bold text-white/20 uppercase tracking-wide">Total disponible</p>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center py-32 bg-secondary/30 rounded-3xl border border-dashed border-white/10">
      <div class="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
         <FontAwesomeIcon icon="fa-solid fa-inbox" class="text-4xl text-white/10" />
      </div>
      <h3 class="text-lg font-bold text-white/40">Sin actividad financiera proyectada</h3>
      <p class="text-sm text-white/20 mt-2">Registra tus primeros movimientos para ver el análisis.</p>
    </div>
  </div>
</template>

<style scoped>
/* Transiciones suaves para los cards */
.scale-enter-active, .scale-leave-active { transition: all 0.3s ease; }
.scale-enter-from, .scale-leave-to { transform: scale(0.9); opacity: 0; }
</style>