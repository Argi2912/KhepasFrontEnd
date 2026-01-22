<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const summary = ref(null)
const isLoading = ref(false)

/**
 * Formatea un número a moneda (con corrección USDT y soporte para BS).
 */
const formatCurrency = (value, currency = 'USD') => {
  if (value === null || value === undefined) value = 0

  // 1. Normalizar código (USDT -> USD)
  let currencyCode = currency === 'USDT' ? 'USD' : currency

  // 2. 🚨 CORRECCIÓN PARA 'BS': 
  // 'BS' no es un código ISO válido para Intl (el oficial es VES).
  // Lo formateamos manualmente para evitar el crash.
  if (currencyCode === 'BS') {
    return `Bs. ${new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)}`
  }

  // 3. Intento estándar con protección de errores
  try {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  } catch (error) {
    // Fallback por si llega otro código raro
    console.warn('Moneda desconocida:', currencyCode)
    return `${currencyCode} ${Number(value).toFixed(2)}`
  }
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
  // Ejecutamos siempre para evitar que se quede "Cargando..." si el store tarda en iniciar
  fetchSummary()
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
          <div v-for="account in summary.caja_general_por_moneda" :key="account.currency_code" class="cash-card">
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
  line-height: 1.2;
  /* Mejor lectura si el título hace salto de línea */
}

.subtitle {
  opacity: 0.6;
  font-size: 0.95rem;
}

/* --- Grid de KPIs --- */
.kpi-grid {
  display: grid;
  /* En PC: mínimo 300px. En Móvil: 100% del ancho */
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
}

.kpi-card {
  background-color: var(--color-secondary);
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
  border-bottom: 4px solid transparent;
  /* Borde inferior más visible */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.kpi-icon {
  position: absolute;
  bottom: -15px;
  right: -10px;
  font-size: 6rem;
  opacity: 0.06;
  color: var(--color-text-light);
  transform: rotate(-10deg);
  z-index: 0;
  pointer-events: none;
  /* Evita que interfiera con clicks */
}

.kpi-title {
  font-size: 1rem;
  opacity: 0.8;
  margin-bottom: 5px;
  position: relative;
  z-index: 1;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.kpi-value {
  font-size: 2.2rem;
  font-weight: 700;
  margin-top: 5px;
  position: relative;
  z-index: 1;
  word-break: break-word;
  /* Evita desbordamiento si el número es muy largo */
  line-height: 1.1;
}

/* Colores de Borde y Texto Dinámicos */
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
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.break-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  opacity: 0.9;
}

.break-row.highlight {
  color: #f39c12;
  /* Naranja estático o usa var(--color-warning) */
  font-weight: 600;
  background: rgba(243, 156, 18, 0.1);
  /* Fondo sutil para destacar */
  padding: 4px 8px;
  border-radius: 4px;
  margin: 0 -8px;
  /* Compensar padding */
}

/* --- Detalle de Caja General --- */
.box-detail-wrapper h2 {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: var(--color-text-light);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 10px;
}

.cash-grid {
  display: grid;
  /* Adaptable: tarjetas más pequeñas para que quepan más */
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.cash-card {
  background-color: var(--color-secondary);
  padding: 20px;
  border-radius: 10px;
  border-left: 4px solid #3498db;
  transition: transform 0.2s ease;
}

.cash-card:hover {
  transform: translateY(-3px);
  /* Efecto hover sutil */
}

.cash-title {
  font-size: 0.9rem;
  color: #3498db;
  /* Azul consistente con el borde */
  font-weight: 700;
  margin-bottom: 5px;
}

.cash-value {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 5px;
  color: var(--color-text-light);
}

.cash-note {
  font-size: 0.75rem;
  opacity: 0.6;
  display: block;
}

/* --- ESTADOS DE CARGA --- */
.loading-state,
.error-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--color-text-light);
  background: var(--color-secondary);
  border-radius: 12px;
  margin-top: 20px;
}

.loading-icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
  color: var(--color-primary);
}

/* === RESPONSIVIDAD MÓVIL === */
@media (max-width: 768px) {
  .dashboard {
    padding: 0;
    /* Aprovechar todo el ancho */
  }

  .page-header {
    margin-bottom: 20px;
    padding-left: 12px;
  }

  .page-header h1 {
    font-size: 1.5rem;
    /* Título más pequeño */
  }

  .kpi-grid {
    gap: 15px;
    /* Menos espacio entre tarjetas */
    margin-bottom: 30px;
  }

  .kpi-card {
    padding: 20px;
    /* Padding interno reducido */
  }

  .kpi-value {
    font-size: 1.8rem;
    /* Números más pequeños para que no se corten */
  }

  .box-detail-wrapper h2 {
    font-size: 1.3rem;
  }

  .cash-grid {
    grid-template-columns: 1fr 1fr;
    /* Forzar 2 columnas en móvil */
    gap: 10px;
  }

  .cash-card {
    padding: 15px;
    min-width: 0;
    /* Permitir que se encojan */
  }

  .cash-value {
    font-size: 1.2rem;
  }
}

/* Móviles muy pequeños (iPhone SE, etc) */
@media (max-width: 480px) {
  .cash-grid {
    grid-template-columns: 1fr;
    /* Volver a 1 columna si es muy estrecho */
  }
}
</style>