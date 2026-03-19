<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useCurrencyFormatter } from '@/utils/formatCurrency'
import { useDashboard } from '@/composables/dashboard/useDashboard'

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const { format: formatCurrency } = useCurrencyFormatter()
const {
  authStore,
  breakdown,
  isLoading,
  chartData,
  currentPeriod,
  fetchSummary,
  changePeriod,
} = useDashboard()

// Chart configuration constants
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      labels: {
        color: 'rgba(255, 255, 255, 0.7)',
        font: { family: 'Inter, sans-serif', weight: 'bold', size: 12 },
        usePointStyle: true,
        boxWidth: 8
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'rgba(255, 255, 255, 0.6)',
      bodyColor: '#fff',
      padding: 12,
      cornerRadius: 12,
      displayColors: true,
      font: { family: 'Inter, sans-serif' }
    }
  },
  scales: {
    y: {
      grid: { color: 'rgba(255, 255, 255, 0.03)', drawBorder: false },
      border: { display: false },
      ticks: { color: 'rgba(255, 255, 255, 0.3)', font: { size: 10 } },
      beginAtZero: true
    },
    x: {
      grid: { display: false, drawBorder: false },
      border: { display: false },
      ticks: { color: 'rgba(255, 255, 255, 0.3)', font: { size: 10 } }
    }
  }
}
</script>

<template>
  <div class="space-y-10 animate-premium-in pb-12">
    
    <!-- Hero Header Premium -->
    <div class="relative overflow-hidden p-8 md:p-12 rounded-[2.5rem] bg-secondary-light border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-white group">
      <div class="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 blur-[120px] rounded-full -mr-40 -mt-40 transition-all group-hover:bg-primary/20 duration-1000"></div>
      <div class="absolute bottom-0 left-0 w-64 h-64 bg-success/5 blur-[80px] rounded-full -ml-20 -mb-20"></div>
      
      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div class="max-w-xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[0.65rem] font-black uppercase tracking-widest mb-6 px-4">
             <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
             Sistema en Tiempo Real
          </div>
          <h1 class="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-none">
             Bienvenido al <span class="text-gradient-primary">Centro de Control</span>
          </h1>
          <p class="text-white/40 font-medium text-lg leading-relaxed">
            Gestión inteligente de liquidez, flujos operativos y métricas de rendimiento consolidadas.
          </p>
        </div>
        
        <button 
          @click="fetchSummary" 
          :disabled="isLoading"
          class="bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 px-8 py-4 rounded-2xl transition-all text-white font-black flex items-center gap-3 group active:scale-95 disabled:opacity-50 shadow-lg shadow-black/20"
        >
          <FontAwesomeIcon icon="fa-solid fa-rotate" :spin="isLoading" class="group-hover:rotate-180 transition-transform duration-700 text-primary" />
          <span>Actualizar Inteligencia</span>
        </button>
      </div>
    </div>

    <!-- Loading State Premium -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-32 bg-secondary/50 backdrop-blur-[20px] rounded-[2.5rem] border border-white/5 shadow-inner">
      <div class="relative">
        <div class="w-20 h-20 border-[6px] border-primary/10 border-t-primary rounded-full animate-spin"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <FontAwesomeIcon icon="fa-solid fa-bolt" class="text-primary text-2xl drop-shadow-[0_0_10px_rgba(247,166,0,0.5)]" />
        </div>
      </div>
      <p class="text-white/30 mt-8 font-black tracking-[0.3em] uppercase text-[0.6rem] animate-pulse">Sincronizando modelos financieros...</p>
    </div>

    <!-- Dashboard Content -->
    <div v-else-if="breakdown.length > 0" class="space-y-12">
      
      <!-- Grid de KPIs Estratégicos -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <!-- Balance Neto -->
        <div class="premium-card p-8 group hover:bg-white/[0.04]">
          <div class="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all duration-500 group-hover:scale-110">
            <FontAwesomeIcon icon="fa-solid fa-vault" class="text-8xl text-white" />
          </div>
          <div class="flex items-center gap-4 mb-10">
            <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
              <FontAwesomeIcon icon="fa-solid fa-wallet" class="text-xl" />
            </div>
            <div class="flex flex-col">
              <span class="text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/30 mb-0.5">Tesorería Central</span>
              <h3 class="text-xs font-bold text-white/60">Balance Neto Consolidado</h3>
            </div>
          </div>
          <div class="space-y-6">
            <div v-for="item in breakdown" :key="item.currency_code" class="flex justify-between items-end border-b border-white/[0.02] pb-4 last:border-0 last:pb-0">
              <span class="text-[0.65rem] font-black text-white/20 uppercase tracking-widest">{{ item.currency_code }}</span>
              <div class="flex flex-col items-end">
                <span class="text-3xl font-black tracking-tighter" :class="item.balance_neto < 0 ? 'text-danger' : 'text-white'">
                  {{ formatCurrency(item.balance_neto, item.currency_code).split('.')[0] }}<span class="text-[0.5em] opacity-30">.{{ formatCurrency(item.balance_neto, item.currency_code).split('.')[1] || '00' }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Por Cobrar -->
        <div class="premium-card p-8 group hover:bg-success/[0.04]">
          <div class="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all duration-500 group-hover:scale-110">
            <FontAwesomeIcon icon="fa-solid fa-arrow-trend-up" class="text-8xl text-success" />
          </div>
          <div class="flex items-center gap-4 mb-10">
            <div class="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success border border-success/20 shadow-inner">
              <FontAwesomeIcon icon="fa-solid fa-hand-holding-dollar" class="text-xl" />
            </div>
            <div class="flex flex-col">
              <span class="text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/30 mb-0.5">Activos Circulantes</span>
              <h3 class="text-xs font-bold text-white/60">Cuentas por Percibir</h3>
            </div>
          </div>
          <div class="space-y-6">
            <template v-if="breakdown.filter(i => i.por_cobrar > 0).length > 0">
              <div v-for="item in breakdown.filter(i => i.por_cobrar > 0)" :key="'cob-' + item.currency_code" class="flex justify-between items-end border-b border-white/[0.02] pb-4 last:border-0 last:pb-0">
                <span class="text-[0.65rem] font-black text-white/20 uppercase tracking-widest">{{ item.currency_code }}</span>
                <span class="text-3xl font-black text-success tracking-tighter">
                  {{ formatCurrency(item.por_cobrar, item.currency_code).split('.')[0] }}<span class="text-[0.5em] opacity-40">.{{ formatCurrency(item.por_cobrar, item.currency_code).split('.')[1] || '00' }}</span>
                </span>
              </div>
            </template>
            <div v-else class="py-6 flex flex-col items-center justify-center text-center opacity-20">
               <div class="w-px h-12 bg-white/20 mb-4"></div>
               <span class="text-[0.65rem] font-black uppercase tracking-widest leading-relaxed">Sin créditos externos<br/>pendientes</span>
            </div>
          </div>
        </div>

        <!-- Por Pagar -->
        <div class="premium-card p-8 group hover:bg-danger/[0.04]">
          <div class="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all duration-500 group-hover:scale-110">
            <FontAwesomeIcon icon="fa-solid fa-calendar-check" class="text-8xl text-danger" />
          </div>
          <div class="flex items-center gap-4 mb-10">
            <div class="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center text-danger border border-danger/20 shadow-inner">
              <FontAwesomeIcon icon="fa-solid fa-file-invoice-dollar" class="text-xl" />
            </div>
            <div class="flex flex-col">
              <span class="text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/30 mb-0.5">Pasivos Operativos</span>
              <h3 class="text-xs font-bold text-white/60">Obligaciones Vigentes</h3>
            </div>
          </div>
          <div class="space-y-6">
            <template v-if="breakdown.filter(i => i.por_pagar > 0).length > 0">
              <div v-for="item in breakdown.filter(i => i.por_pagar > 0)" :key="'pag-' + item.currency_code" class="flex justify-between items-end border-b border-white/[0.02] pb-4 last:border-0 last:pb-0">
                <span class="text-[0.65rem] font-black text-white/20 uppercase tracking-widest">{{ item.currency_code }}</span>
                <span class="text-3xl font-black text-danger tracking-tighter">
                  {{ formatCurrency(item.por_pagar, item.currency_code).split('.')[0] }}<span class="text-[0.5em] opacity-40">.{{ formatCurrency(item.por_pagar, item.currency_code).split('.')[1] || '00' }}</span>
                </span>
              </div>
            </template>
            <div v-else class="py-6 flex flex-col items-center justify-center text-center opacity-20">
               <div class="w-px h-12 bg-white/20 mb-4"></div>
               <span class="text-[0.65rem] font-black uppercase tracking-widest leading-relaxed">Libre de deuda<br/>operativa</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Distribución Física de Capital (NUEVO) -->
      <div v-if="accountsBreakdown.length > 0" class="space-y-8 animate-fade-in">
        <div class="flex items-center gap-3 border-l-4 border-primary pl-6">
          <div class="flex flex-col">
            <h3 class="text-xl font-black text-white tracking-tight italic">Distribución Física</h3>
            <p class="text-[0.6rem] font-bold text-white/20 uppercase tracking-widest">Saldo real desglosado por bóveda / cuenta bancaria</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="acc in accountsBreakdown" :key="acc.bank_name" 
               class="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-all">
            <div class="flex flex-col">
              <span class="text-[0.6rem] font-black text-white/20 uppercase tracking-widest mb-1">{{ acc.bank_name }}</span>
              <span class="text-lg font-black text-white group-hover:text-primary transition-colors">
                {{ formatCurrency(acc.balance, acc.currency_code) }}
              </span>
            </div>
            <div class="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-white/10 group-hover:text-primary/20">
              <FontAwesomeIcon icon="fa-solid fa-building-columns" />
            </div>
          </div>
        </div>
      </div>

      <!-- Sección de Gráficos de Rendimiento -->
      <div class="bg-secondary-light/30 backdrop-blur-[30px] border border-white/5 rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden group">
        <div class="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-all duration-1000"></div>

        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12 relative z-10">
          <div>
            <div class="flex items-center gap-4 mb-2">
              <div class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-primary border border-white/10 shadow-inner">
                 <FontAwesomeIcon icon="fa-solid fa-chart-line" class="text-lg" />
              </div>
              <h2 class="text-2xl font-black text-white tracking-tight">Rendimiento Operativo Nivel 1</h2>
            </div>
            <p class="text-[0.65rem] font-black text-white/20 uppercase tracking-[0.3em] ml-16">Análisis comparativo de flujos netos</p>
          </div>

          <div class="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner backdrop-blur-md">
            <button 
              v-for="p in [{v:'week', l:'Semana'}, {v:'month', l:'Mes'}, {v:'year', l:'Año'}]" 
              :key="p.v"
              @click="changePeriod(p.v)" 
              :class="['px-6 py-2.5 text-[0.65rem] font-black uppercase tracking-widest rounded-xl transition-all', currentPeriod === p.v ? 'bg-primary text-secondary shadow-lg shadow-primary/20 scale-105' : 'text-white/30 hover:text-white/60']"
            >
              {{ p.l }}
            </button>
          </div>
        </div>

        <div class="h-[400px] w-full relative z-10 p-4 bg-black/10 rounded-[2rem] border border-white/5">
          <Line v-if="chartData" :data="chartData" :options="chartOptions" />
          <div v-else class="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <FontAwesomeIcon icon="fa-solid fa-circle-notch" spin class="text-4xl text-primary/20" />
            <span class="text-[0.6rem] font-black text-white/10 uppercase tracking-[0.2em]">Cargando Metadatos...</span>
          </div>
        </div>
      </div>

      <!-- Liquidez por Cajas (Disponible) -->
      <div class="space-y-10">
        <div class="flex items-center justify-between border-b border-white/5 pb-8">
          <div class="flex flex-col">
            <h2 class="text-3xl font-black text-white flex items-center gap-4">
              <span class="text-2xl opacity-80 group-hover:scale-120 transition-transform">🏦</span> 
              Liquidez Inmediata
            </h2>
            <p class="text-xs font-bold text-white/30 mt-2 ml-1">Desglose de capital disponible en bóvedas y cuentas</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
            <span class="text-[0.6rem] font-black text-success uppercase tracking-widest bg-success/5 px-4 py-2 rounded-full border border-success/10">Sistema Activo</span>
          </div>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div v-for="item in breakdown" :key="'bx-' + item.currency_code" 
               class="bg-secondary-light/40 p-8 rounded-[2rem] border border-white/5 backdrop-blur-md transition-all hover:bg-white/5 hover:border-primary/20 group shadow-xl">
            <div class="flex justify-between items-start mb-8">
              <span class="text-[0.65rem] font-black text-white/20 uppercase tracking-[0.2em]">{{ item.currency_code }}</span>
              <div class="w-10 h-10 rounded-xl bg-background flex items-center justify-center border border-white/5 shadow-inner transition-all group-hover:text-primary">
                <FontAwesomeIcon icon="fa-solid fa-coins" class="text-sm opacity-30 group-hover:opacity-100" />
              </div>
            </div>
            <div class="space-y-1">
              <h4 class="text-3xl font-black text-white tracking-tighter group-hover:text-primary transition-colors">
                {{ formatCurrency(item.caja, item.currency_code).split('.')[0] }}<span class="text-[0.4em] font-medium opacity-20 ml-0.5">.{{ formatCurrency(item.caja, item.currency_code).split('.')[1] || '00' }}</span>
              </h4>
              <p class="text-[0.6rem] font-black text-white/20 uppercase tracking-widest">Fondos Líquidos</p>
            </div>
            
            <div class="mt-8 pt-6 border-t border-white/[0.03] flex items-center justify-between">
              <div class="flex -space-x-2">
                 <div v-for="i in 3" :key="i" class="w-5 h-5 rounded-full border border-secondary bg-white/[0.05]"></div>
              </div>
              <span class="text-[0.55rem] font-black text-white/10 uppercase italic">Verificado</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center py-40 bg-secondary/20 rounded-[3rem] border-2 border-dashed border-white/5">
      <div class="w-24 h-24 bg-white/[0.02] rounded-full flex items-center justify-center mb-8 border border-white/5">
         <FontAwesomeIcon icon="fa-solid fa-layer-group" class="text-5xl text-white/10" />
      </div>
      <h3 class="text-xl font-black text-white/40 tracking-tight">Estructura Estadística Vacía</h3>
      <p class="text-sm text-white/20 mt-3 font-medium">Inicia el registro de operaciones para proyectar tu dashboard.</p>
    </div>
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
  background: rgba(30, 30, 30, 0.4);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 2.5rem;
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
}

.premium-card:hover {
  transform: translateY(-8px) scale(1.01);
  border-color: rgba(247, 166, 0, 0.3);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4), 0 0 30px rgba(247, 166, 0, 0.05);
}

.animate-premium-in {
  animation: slideIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>