<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'
import BaseCard from '@/components/shared/BaseCard.vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Doughnut } from 'vue-chartjs'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
)

// === FILTROS ===
const period = ref('year')
const selectedDate = ref(new Date().toISOString().split('T')[0])

// === DATOS ===
const isLoading = ref(false)
const stats = ref({
  chart_data: { labels: [], datasets: [] },
  summary: { total_income: 0, total_expense: 0, total_profit: 0 },
  expenses_by_category: [],
  period_info: {},
})

// === OPCIONES GRÁFICOS PREMIUM ===
const getChartOptions = (title) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { 
      position: 'top',
      labels: {
        color: 'rgba(255, 255, 255, 0.5)',
        font: { family: 'Inter', weight: 'bold', size: 10 },
        usePointStyle: true,
        padding: 20
      }
    },
    title: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(10, 10, 12, 0.9)',
      titleFont: { size: 14, weight: 'bold' },
      bodyFont: { size: 13 },
      padding: 12,
      cornerRadius: 12,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1
    }
  },
  scales: title === 'Evolution' ? {
    y: {
      grid: { color: 'rgba(255, 255, 255, 0.03)', drawBorder: false },
      ticks: { color: 'rgba(255, 255, 255, 0.3)', font: { size: 10 } }
    },
    x: {
      grid: { display: false },
      ticks: { color: 'rgba(255, 255, 255, 0.3)', font: { size: 10 } }
    }
  } : {}
})

const barOptions = computed(() => getChartOptions('Evolution'))
const doughnutOptions = computed(() => ({
  ...getChartOptions('Distribution'),
  plugins: {
    ...getChartOptions('Distribution').plugins,
    legend: { position: 'bottom', labels: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 }, padding: 15 } }
  }
}))

// === DONA - Datos dinámicos v5 ===
const categoryChartData = computed(() => {
  const categories = stats.value.expenses_by_category || []
  return {
    labels: categories.map((c) => c.category || 'Otros'),
    datasets: [
      {
        backgroundColor: ['#f7a600', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#6366f1'],
        borderWidth: 0,
        hoverOffset: 20,
        data: categories.map((c) => c.total || 0),
      },
    ],
  }
})

// === FUNCIÓN PRINCIPAL ===
const fetchStats = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/statistics/performance', {
      params: { period: period.value, date: selectedDate.value },
    })
    stats.value = response.data
  } catch (error) {
    notify.error('Fallo al sincronizar inteligencia financiera.')
  } finally {
    isLoading.value = false
  }
}

watch([period, selectedDate], () => fetchStats())
onMounted(() => fetchStats())

const formatMoney = (value) => {
  return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(value || 0)
}
</script>

<template>
  <div class="space-y-10 animate-premium-in pb-12 overflow-hidden">
    
    <!-- Header Central de Inteligencia -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
        <h1 class="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <span class="w-1.5 h-10 bg-primary rounded-full"></span>
          Inteligencia <span class="text-gradient-primary">Financiera</span>
        </h1>
        <p class="text-white/30 text-xs font-bold uppercase tracking-[0.2em] mt-2 ml-4">Análisis de rendimiento y flujo de caja estratégico</p>
      </div>

      <div class="flex items-center gap-3 bg-white/[0.04] p-1.5 rounded-2xl border border-white/5 shadow-inner">
        <select v-model="period" class="bg-transparent text-white/60 text-[0.7rem] font-black uppercase tracking-widest px-4 py-2 outline-none cursor-pointer hover:text-white transition-colors">
          <option value="day">Diario</option>
          <option value="week">Semanal</option>
          <option value="month">Mensual</option>
          <option value="year">Anual</option>
        </select>
        <div class="w-px h-4 bg-white/10"></div>
        <input
          type="date"
          v-model="selectedDate"
          :max="new Date().toISOString().split('T')[0]"
          class="bg-transparent text-white/60 text-[0.7rem] font-black uppercase tracking-widest px-4 py-2 outline-none cursor-pointer hover:text-white transition-colors"
        />
      </div>
    </div>

    <!-- Panel de KPIs Premium -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="premium-card p-6 border-success/5 bg-success/[0.01] group">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success border border-success/10 group-hover:scale-110 transition-transform duration-500">
            <FontAwesomeIcon icon="fa-solid fa-arrow-up-right-dots" class="text-xl" />
          </div>
          <div>
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/30 block mb-1">Entradas de Capital</span>
            <span class="text-xs font-bold text-success/60">Ingresos brutos del periodo</span>
          </div>
        </div>
        <div class="flex items-baseline gap-1">
          <span class="text-xs font-black text-success/60 mr-1">$</span>
          <span class="text-4xl font-black text-white tracking-tighter">{{ formatMoney(stats.summary.total_income).split(',')[0] }}</span>
          <span class="text-lg font-bold text-white/20 tracking-tighter">.{{ formatMoney(stats.summary.total_income).split(',')[1] }}</span>
        </div>
      </div>

      <div class="premium-card p-6 border-danger/5 bg-danger/[0.01] group">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center text-danger border border-danger/10 group-hover:scale-110 transition-transform duration-500">
            <FontAwesomeIcon icon="fa-solid fa-arrow-down-right-dots" class="text-xl" />
          </div>
          <div>
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/30 block mb-1">Fuga de Capital</span>
            <span class="text-xs font-bold text-danger/60">Gastos y egresos operativos</span>
          </div>
        </div>
        <div class="flex items-baseline gap-1">
          <span class="text-xs font-black text-danger/60 mr-1">$</span>
          <span class="text-4xl font-black text-white tracking-tighter">{{ formatMoney(stats.summary.total_expense).split(',')[0] }}</span>
          <span class="text-lg font-bold text-white/20 tracking-tighter">.{{ formatMoney(stats.summary.total_expense).split(',')[1] }}</span>
        </div>
      </div>

      <div class="premium-card p-6 border-primary/5 bg-primary/[0.01] group">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10 group-hover:scale-110 transition-transform duration-500">
            <FontAwesomeIcon icon="fa-solid fa-shield-halved" class="text-xl" />
          </div>
          <div>
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/30 block mb-1">Margen de Seguridad</span>
            <span class="text-xs font-bold text-primary/60">Utilidad neta capturada</span>
          </div>
        </div>
        <div class="flex items-baseline gap-1">
          <span class="text-xs font-black text-primary/60 mr-1">$</span>
          <span class="text-4xl font-black text-white tracking-tighter" :class="{ 'text-danger': stats.summary.total_profit < 0 }">
            {{ formatMoney(stats.summary.total_profit).split(',')[0] }}
          </span>
          <span class="text-lg font-bold text-white/20 tracking-tighter">.{{ formatMoney(stats.summary.total_profit).split(',')[1] }}</span>
        </div>
      </div>
    </div>

    <!-- Visualización de Datos Pro -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Evolución Temporal -->
      <BaseCard 
        class="lg:col-span-2" 
        title="Dinámica de Rendimiento" 
        :subtitle="`Fluctuación operativa filtrada por ${period === 'day' ? 'horas' : 'periodos'}`"
      >
        <div class="h-[400px] w-full mt-6 relative">
          <div v-if="isLoading" class="absolute inset-0 z-20 bg-secondary/10 backdrop-blur-sm flex items-center justify-center rounded-2xl">
             <FontAwesomeIcon icon="fa-solid fa-circle-notch" spin class="text-primary text-3xl" />
          </div>
          <Bar
            v-if="stats.chart_data.labels?.length"
            :data="stats.chart_data"
            :options="barOptions"
          />
          <div v-else class="h-full flex items-center justify-center text-white/10 font-black uppercase tracking-widest text-xs">
             Sin registros para este nodo temporal
          </div>
        </div>
      </BaseCard>

      <!-- Distribución de Egresos -->
      <BaseCard 
        title="Matriz de Costos" 
        subtitle="Desglose por categoría de gasto"
      >
        <div class="h-[400px] w-full mt-6 flex flex-col items-center justify-center relative">
          <div v-if="isLoading" class="absolute inset-0 z-20 bg-secondary/10 backdrop-blur-sm flex items-center justify-center rounded-2xl">
              <FontAwesomeIcon icon="fa-solid fa-circle-notch" spin class="text-primary text-2xl" />
          </div>
          <div class="w-full h-[300px]">
            <Doughnut
              v-if="stats.expenses_by_category?.length"
              :data="categoryChartData"
              :options="doughnutOptions"
            />
             <div v-else class="h-full flex items-center justify-center text-white/10 font-black uppercase tracking-widest text-[0.6rem]">
               Nodo de gastos vacío
            </div>
          </div>
          
          <!-- Leyenda Pro -->
          <div class="mt-8 w-full space-y-2">
             <div v-for="(cat, idx) in stats.expenses_by_category?.slice(0, 3)" :key="idx" class="flex justify-between items-center bg-white/[0.02] p-2 rounded-xl border border-white/5">
                <span class="text-[0.65rem] font-bold text-white/40 truncate">{{ cat.category || 'Otros' }}</span>
                <span class="text-xs font-black text-white tracking-tighter">{{ formatMoney(cat.total) }}</span>
             </div>
          </div>
        </div>
      </BaseCard>

    </div>
  </div>
</template>

<style scoped>
.text-gradient-primary {
  background: linear-gradient(135deg, #f7a600, #f0b90b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
