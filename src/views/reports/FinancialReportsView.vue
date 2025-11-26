<script setup>
import { ref, onMounted, computed } from 'vue'
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

const isLoading = ref(false)
const selectedYear = ref(new Date().getFullYear())
const stats = ref({
  chart_data: { labels: [], datasets: [] },
  summary: { total_income: 0, total_expense: 0, total_profit: 0 },
  expenses_by_category: [],
})

// Opciones para el Gráfico de Barras (Ingresos vs Gastos)
const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' },
    title: { display: true, text: 'Flujo de Caja Mensual' },
  },
}

// Opciones para el Gráfico de Dona (Categorías)
const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right' },
  },
}

// Computada para transformar datos de categorías al formato de Chart.js
const categoryChartData = computed(() => {
  const categories = stats.value.expenses_by_category || []
  return {
    labels: categories.map((c) => c.category),
    datasets: [
      {
        backgroundColor: ['#3B82F6', '#F59E0B', '#10B981', '#6366F1', '#EF4444'],
        data: categories.map((c) => c.total),
      },
    ],
  }
})

const fetchStats = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/statistics/performance', {
      params: { year: selectedYear.value },
    })
    stats.value = response.data
  } catch (error) {
    console.error(error)
    notify.error('Error al cargar estadísticas')
  } finally {
    isLoading.value = false
  }
}

// Formateo de moneda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div class="reports-container">
    <div class="header-actions">
      <h2>Reportes Financieros</h2>
      <div class="filters">
        <label>Año Fiscal:</label>
        <select v-model="selectedYear" @change="fetchStats" class="year-select">
          <option v-for="y in [2023, 2024, 2025]" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
    </div>

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

    <div class="charts-grid">
      <div class="chart-box main-chart">
        <h3>Evolución Mensual</h3>
        <div class="chart-wrapper">
          <Bar v-if="!isLoading" :data="stats.chart_data" :options="barOptions" />
        </div>
      </div>

      <div class="chart-box side-chart">
        <h3>Distribución de Gastos</h3>
        <div class="chart-wrapper">
          <Doughnut
            v-if="!isLoading && stats.expenses_by_category.length"
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
}

.year-select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  background: var(--color-background);
  color: var(--color-text);
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

/* CHARTS LAYOUT */
.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

@media (max-width: 900px) {
  .charts-grid {
    grid-template-columns: 1fr;
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
}
</style>
