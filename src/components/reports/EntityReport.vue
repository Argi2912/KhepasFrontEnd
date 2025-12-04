<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'

const props = defineProps({
  title: String,
  endpoint: String,
})

const route = useRoute()
const isLoading = ref(true)

// Fechas por defecto
const startDate = ref(new Date().getFullYear() + '-01-01')
const endDate = ref(new Date().toISOString().slice(0, 10))

const reports = ref([])

const loadData = async () => {
  isLoading.value = true
  try {
    const params = {
      start_date: startDate.value,
      end_date: endDate.value,
      entity_id: route.query.entity_id || undefined,
    }

    const { data } = await api.get(props.endpoint, { params })
    reports.value = data.reports || []
  } catch (err) {
    console.error('Error cargando reporte:', err)
    reports.value = []
  } finally {
    isLoading.value = false
  }
}

const totals = computed(() => {
  return reports.value.reduce(
    (acc, r) => ({
      profit: acc.profit + (r.total_profit || 0),
      moved: acc.moved + (r.total_moved || 0),
      paid: acc.paid + (r.total_paid_to_admin || 0),
    }),
    { profit: 0, moved: 0, paid: 0 },
  )
})

const formatMoney = (value) => {
  if (!value) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

watch([startDate, endDate], loadData)
onMounted(loadData)
</script>

<template>
  <div class="entity-report">
    <div class="header">
      <h1 class="page-title">{{ props.title }}</h1>
      <div class="date-picker-group">
        <div class="date-input-wrapper">
          <label>Desde</label>
          <input type="date" v-model="startDate" />
        </div>
        <span class="arrow">→</span>
        <div class="date-input-wrapper">
          <label>Hasta</label>
          <input type="date" v-model="endDate" />
        </div>
      </div>
    </div>

    <div class="cards">
      <div class="card card-profit">
        <div class="card-icon">💰</div>
        <div class="card-content">
          <div class="label">Ganancia Bruta</div>
          <div class="amount text-success">{{ formatMoney(totals.profit) }}</div>
        </div>
      </div>
      <div class="card card-moved">
        <div class="card-icon">📊</div>
        <div class="card-content">
          <div class="label">Volumen Movido</div>
          <div class="amount text-info">{{ formatMoney(totals.moved) }}</div>
        </div>
      </div>
      <div class="card card-paid">
        <div class="card-icon">🛡️</div>
        <div class="card-content">
          <div class="label">Ganancia Neta (Admin)</div>
          <div class="amount text-warning">{{ formatMoney(totals.paid) }}</div>
        </div>
      </div>
    </div>

    <div class="table-container">
      <table class="custom-table">
        <thead>
          <tr>
            <th class="text-left">Nombre de Entidad</th>
            <th class="text-center">Transacciones</th>
            <th class="text-right">Volumen Total</th>
            <th class="text-right">Ganancia Bruta</th>
            <th class="text-right">Ganancia Neta</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in reports" :key="row.entity_id">
            <td class="name-cell">{{ row.entity_name }}</td>
            <td class="text-center">{{ row.transaction_count || '-' }}</td>
            <td class="text-right font-mono">{{ formatMoney(row.total_moved) }}</td>
            <td class="text-right font-mono text-success">{{ formatMoney(row.total_profit) }}</td>
            <td class="text-right font-mono text-warning">
              {{ formatMoney(row.total_paid_to_admin) }}
            </td>
          </tr>
          <tr v-if="!isLoading && reports.length === 0">
            <td colspan="5" class="empty-state">
              <i class="pi pi-inbox" style="font-size: 2rem; margin-bottom: 10px"></i>
              <p>No hay datos para el período seleccionado</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Procesando datos...</p>
    </div>
  </div>
</template>

<style scoped>
/* --- Variables de Color (Dark Mode Theme) --- */
:root {
  --bg-dark: #18181b; /* Zinc 950 */
  --card-bg: #27272a; /* Zinc 800 */
  --border-color: #3f3f46; /* Zinc 700 */
  --text-primary: #f4f4f5; /* Zinc 100 */
  --text-secondary: #a1a1aa; /* Zinc 400 */
  --brand-yellow: #fbbf24; /* Amber 400 (Kephas Color) */
  --success-green: #34d399; /* Emerald 400 */
  --info-blue: #60a5fa; /* Blue 400 */
  --warning-orange: #fb923c; /* Orange 400 */
}

.entity-report {
  color: #e4e4e7; /* Zinc-200 */
  font-family: 'Inter', system-ui, sans-serif;
}

/* --- Header & Date Picker --- */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1.5rem;
  border-bottom: 1px solid #3f3f46;
  padding-bottom: 1.5rem;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #fbbf24; /* Color Amarillo Kephas */
  margin: 0;
  letter-spacing: -0.5px;
}

.date-picker-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #27272a;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #3f3f46;
}

.date-input-wrapper {
  display: flex;
  flex-direction: column;
}

.date-input-wrapper label {
  font-size: 0.7rem;
  color: #a1a1aa;
  margin-bottom: 2px;
}

.date-picker-group input[type='date'] {
  background: transparent;
  border: none;
  color: white;
  font-family: inherit;
  font-size: 0.95rem;
  outline: none;
  color-scheme: dark; /* Importante para el icono del calendario nativo */
  cursor: pointer;
}

.arrow {
  color: #fbbf24;
  font-weight: bold;
}

/* --- Cards (KPIs) --- */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.card {
  background: #27272a; /* Fondo oscuro */
  border: 1px solid #3f3f46;
  padding: 1.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  border-color: #52525b;
}

.card-icon {
  font-size: 2rem;
  background: rgba(255, 255, 255, 0.05);
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.card-content {
  flex: 1;
}

.card .label {
  font-size: 0.85rem;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.card .amount {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
}

/* Colores de texto específicos */
.text-success {
  color: #34d399;
}
.text-info {
  color: #e4e4e7;
}
.text-warning {
  color: #fbbf24;
} /* Amarillo Admin */

/* Bordes inferiores de las tarjetas */
.card-profit {
  border-bottom: 4px solid #34d399;
}
.card-moved {
  border-bottom: 4px solid #60a5fa;
}
.card-paid {
  border-bottom: 4px solid #fbbf24;
}

/* --- Table Styles (Dark Mode) --- */
.table-container {
  background: #27272a;
  border-radius: 12px;
  border: 1px solid #3f3f46;
  overflow-x: auto;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.custom-table th {
  background: #18181b; /* Header más oscuro */
  color: #fbbf24; /* Texto Amarillo */
  padding: 1.2rem 1.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #3f3f46;
}

.custom-table td {
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid #3f3f46;
  color: #e4e4e7;
  font-size: 0.95rem;
}

/* Hover en filas */
.custom-table tbody tr:hover {
  background-color: #3f3f46; /* Ligeramente más claro al pasar mouse */
}

/* Utilidades de texto en tabla */
.text-left {
  text-align: left;
}
.text-right {
  text-align: right;
}
.text-center {
  text-align: center;
}
.font-mono {
  font-family: 'Courier New', Courier, monospace;
  letter-spacing: -0.5px;
}

.name-cell {
  font-weight: 600;
  color: #fff;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #71717a;
}

/* --- Loading Overlay --- */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(24, 24, 27, 0.8); /* Fondo oscuro semitransparente */
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 50;
  border-radius: 12px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #3f3f46;
  border-top: 4px solid #fbbf24; /* Spinner Amarillo */
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
