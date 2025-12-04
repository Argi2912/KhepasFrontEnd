<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'
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

// Registrar componentes de Chart.js
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
const period = ref('year') // 'day' | 'week' | 'month' | 'year'
const selectedDate = ref(new Date().toISOString().split('T')[0]) // Hoy por defecto

// === DATOS ===
const isLoading = ref(false)
const stats = ref({
  chart_data: { labels: [], datasets: [] },
  summary: { total_income: 0, total_expense: 0, total_profit: 0 },
  expenses_by_category: [],
  period_info: {},
})

// === OPCIONES GRÁFICOS ===
const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' },
    title: {
      display: true,
      text: 'Flujo de Caja',
      font: { size: 16 },
    },
  },
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right' },
  },
}

// === DONA - Datos dinámicos ===
const categoryChartData = computed(() => {
  const categories = stats.value.expenses_by_category || []
  return {
    labels: categories.map((c) => c.category || 'Sin categoría'),
    datasets: [
      {
        backgroundColor: ['#3B82F6', '#F59E0B', '#10B981', '#6366F1', '#EF4444', '#8B5CF6'],
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
      params: {
        period: period.value,
        date: selectedDate.value,
      },
    })
    stats.value = response.data
  } catch (error) {
    console.error(error)
    notify.error('Error al cargar estadísticas')
  } finally {
    isLoading.value = false
  }
}

// === REACTIVIDAD ===
watch([period, selectedDate], () => {
  fetchStats()
})

// Carga inicial
onMounted(() => {
  fetchStats()
})

// === FORMATEO MONEDA ===
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value || 0)
}
</script>

<template>
  <div class="reports-container">
    <div class="header-actions">
      <h2>Reportes Financieros</h2>
      <div class="filters">
        <select v-model="period" class="year-select">
          <option value="day">Hoy</option>
          <option value="week">Esta semana</option>
          <option value="month">Este mes</option>
          <option value="year">Este año</option>
        </select>

        <input
          type="date"
          v-model="selectedDate"
          :max="new Date().toISOString().split('T')[0]"
          class="year-select date-input"
          style="margin-left: 10px"
        />
      </div>
    </div>

    <!-- SUMMARY CARDS -->
    <div class="summary-cards">
      <div class="card income">
        <div class="card-title">Ingresos Totales</div>
        <div class="card-amount">{{ formatCurrency(stats.summary.total_income) }}</div>
        <div class="card-icon"><i class="fa-solid fa-arrow-trend-up"></i></div>
      </div>
      <div class="card expense">
        <div class="card-title">Gastos Totales</div>
        <div class="card-amount">{{ formatCurrency(stats.summary.total_expense) }}</div>
        <div class="card-icon"><i class="fa-solid fa-arrow-trend-down"></i></div>
      </div>
      <div class="card profit">
        <div class="card-title">Utilidad Neta</div>
        <div class="card-amount" :class="{ 'text-danger': stats.summary.total_profit < 0 }">
          {{ formatCurrency(stats.summary.total_profit) }}
        </div>
        <div class="card-icon"><i class="fa-solid fa-wallet"></i></div>
      </div>
    </div>

    <!-- CHARTS -->
    <div class="charts-grid">
      <div class="chart-box main-chart">
        <h3>
          Evolución
          <small v-if="period === 'day'">por Hora</small>
          <small v-else-if="period === 'week'">por Día</small>
          <small v-else-if="period === 'month'">Mensual</small>
          <small v-else>Anual</small>
        </h3>
        <div class="chart-wrapper">
          <Bar
            v-if="!isLoading && stats.chart_data.labels?.length"
            :data="stats.chart_data"
            :options="barOptions"
          />
          <p v-else class="no-data">No hay datos para mostrar</p>
        </div>
      </div>

      <!-- Dona solo en mes/año -->
      <div class="chart-box side-chart" v-if="period === 'month' || period === 'year'">
        <h3>Distribución de Gastos</h3>
        <div class="chart-wrapper">
          <Doughnut
            v-if="stats.expenses_by_category?.length"
            :data="categoryChartData"
            :options="doughnutOptions"
          />
          <p v-else class="no-data">Sin datos de gastos</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reports-container {
  padding: 20px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 15px;
}

.filters {
  display: flex;
  align-items: center;
  gap: 12px;
}

.year-select,
.date-input {
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #444;
  background: #1f1f1f;
  color: white;
  font-size: 0.95rem;
  min-width: 160px;
}

.date-input {
  min-width: 180px;
}

/* SUMMARY CARDS */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background: var(--color-secondary);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.card-title {
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 10px;
}

.card-amount {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--color-text);
}

.card-icon {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 2rem;
  opacity: 0.1;
}

.card.income .card-amount {
  color: #10b981;
}
.card.expense .card-amount {
  color: #ef4444;
}
.card.profit .card-amount.text-danger {
  color: #ef4444;
}

/* CHARTS */
.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

@media (max-width: 900px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .filters {
    justify-content: center;
  }
}

.chart-box {
  background: var(--color-secondary);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.chart-wrapper {
  position: relative;
  height: 350px;
  width: 100%;
}

.no-data {
  text-align: center;
  margin-top: 50px;
  color: #888;
  font-size: 1.1rem;
}
</style>
