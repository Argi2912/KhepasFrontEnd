<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
// import DashboardCard from '@/components/shared/DashboardCard.vue' // (Opcional si usas componentes separados)
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const summary = ref(null)
const isLoading = ref(true)

/**
 * Formatea un número a moneda (con corrección USDT).
 */
const formatCurrency = (value, currency = 'USD') => {
  if (value === null || value === undefined) return formatCurrency(0, currency)

  // 🚨 CORRECCIÓN USDT: Usar USD para el formato si es USDT.
  const currencyCode = currency === 'USDT' ? 'USD' : currency

  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Carga el resumen del dashboard desde la API.
 */
const fetchSummary = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/dashboard/summary')
    summary.value = response.data
  } catch (error) {
    notify.error('No se pudieron cargar los datos del Dashboard.')
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  // Solo intenta cargar si el usuario está logueado
  if (authStore.isLoggedIn) {
    fetchSummary()
  }
})
</script>

<template>
  <div class="dashboard">
    <div class="page-header">
      <h1>Resumen Financiero</h1>
      <p class="subtitle">Estado actual de las cuentas y obligaciones del Tenant.</p>
    </div>

    <div v-if="isLoading" class="loading-state">
      <FontAwesomeIcon icon="fa-solid fa-spinner" spin pulse class="loading-icon" />
      <p>Cargando datos financieros...</p>
    </div>

    <div v-else-if="summary" class="content-wrapper">
      <div class="kpi-grid">
        <div class="kpi-card balance-neto">
          <p class="kpi-title">Balance Neto (USD)</p>
          <h3 class="kpi-value">{{ formatCurrency(summary.balance_general_usd, 'USD') }}</h3>
          <FontAwesomeIcon icon="fa-solid fa-receipt" class="kpi-icon" />
        </div>

        <div class="kpi-card por-cobrar">
          <p class="kpi-title">Por Cobrar (Total)</p>
          <h3 class="kpi-value">{{ formatCurrency(summary.total_por_cobrar, 'USD') }}</h3>

          <div class="kpi-breakdown" v-if="summary.desglose_por_cobrar">
            <div class="break-row">
              <span>Deudas (Ledger):</span>
              <strong>{{ formatCurrency(summary.desglose_por_cobrar.ledger, 'USD') }}</strong>
            </div>
            <div class="break-row highlight">
              <span>Compras Pend.:</span>
              <strong>{{
                formatCurrency(summary.desglose_por_cobrar.compras_pendientes, 'USD')
              }}</strong>
            </div>
          </div>

          <FontAwesomeIcon icon="fa-solid fa-arrow-up" class="kpi-icon" />
        </div>

        <div class="kpi-card por-pagar">
          <p class="kpi-title">Por Pagar Pendiente</p>
          <h3 class="kpi-value">{{ formatCurrency(summary.total_por_pagar, 'USD') }}</h3>
          <FontAwesomeIcon icon="fa-solid fa-arrow-down" class="kpi-icon" />
        </div>
      </div>

      <div class="box-detail-wrapper">
        <h2>💰 Caja por Moneda</h2>
        <div class="cash-grid">
          <div
            v-for="account in summary.caja_general_por_moneda"
            :key="account.currency_code"
            class="cash-card"
          >
            <p class="cash-title">{{ account.currency_code }}</p>
            <h4 class="cash-value">
              {{ formatCurrency(account.total_balance, account.currency_code) }}
            </h4>
            <span class="cash-note">Total en cuentas {{ account.currency_code }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="error-state">
      <p>No hay datos disponibles. Verifique su conexión o permisos.</p>
    </div>
  </div>
</template>

<style scoped>
/* Estilos Generales */
.page-header {
  border-left: 5px solid var(--color-primary);
  padding-left: 15px;
  margin-bottom: 30px;
}
.page-header h1 {
  font-size: 1.8rem;
  margin-bottom: 5px;
}
.subtitle {
  opacity: 0.6;
  font-size: 0.95rem;
}

/* --- Grid de KPIs --- */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 50px;
}
.kpi-card {
  background-color: var(--color-secondary);
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
  border-bottom: 3px solid transparent;
}
.kpi-icon {
  position: absolute;
  bottom: -10px;
  right: -10px;
  font-size: 5rem;
  opacity: 0.08;
  color: var(--color-text-light);
  transform: rotate(-10deg);
  z-index: 0; /* Al fondo */
}
.kpi-title {
  font-size: 1rem;
  opacity: 0.7;
  margin-bottom: 10px;
  position: relative;
  z-index: 1;
}
.kpi-value {
  font-size: 2.2rem;
  font-weight: 700;
  margin-top: 5px;
  position: relative;
  z-index: 1;
}

/* Colores de Borde Dinámicos */
.balance-neto {
  border-color: var(--color-primary);
}
.por-cobrar {
  border-color: var(--color-success);
}
.por-pagar {
  border-color: var(--color-danger);
}
.balance-neto .kpi-value {
  color: var(--color-primary);
}
.por-cobrar .kpi-value {
  color: var(--color-success);
}
.por-pagar .kpi-value {
  color: var(--color-danger);
}

/* --- Desglose (Breakdown) --- */
.kpi-breakdown {
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  z-index: 1;
}

.break-row {
  display: flex;
  justify-content: space-between;
  opacity: 0.8;
}

.break-row.highlight {
  color: var(--color-warning, #f39c12); /* Color naranja para resaltar */
  font-weight: bold;
  opacity: 1;
}

/* --- Detalle de Caja General --- */
.box-detail-wrapper h2 {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: var(--color-text-light);
}
.cash-grid {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.cash-card {
  background-color: var(--color-secondary);
  padding: 20px;
  border-radius: 8px;
  min-width: 220px;
  flex-grow: 1;
  border-left: 3px solid #3498db;
}
.cash-title {
  font-size: 0.85rem;
  color: var(--color-primary);
  margin-bottom: 5px;
}
.cash-value {
  font-size: 1.6rem;
  font-weight: 600;
  margin-bottom: 5px;
}
.cash-note {
  font-size: 0.8rem;
  opacity: 0.5;
}

/* --- ESTADOS DE CARGA --- */
.loading-state {
  text-align: center;
  padding: 50px;
  color: var(--color-primary);
}
.loading-icon {
  font-size: 2rem;
  margin-bottom: 10px;
}
</style>
