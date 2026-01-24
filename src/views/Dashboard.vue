<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
// CAMBIO: Ahora esperamos un array (lista), no un objeto único
const breakdown = ref([])
const isLoading = ref(true)

/**
 * Formatea un número a moneda (con corrección USDT y soporte para BS).
 * Mantenemos tu función exacta para no romper nada.
 */
const formatCurrency = (value, currency = 'USD') => {
  if (value === null || value === undefined) value = 0

  // 1. Normalizar código (USDT -> USD)
  let currencyCode = currency === 'USDT' ? 'USD' : currency

  // 2. 🚨 CORRECCIÓN PARA 'BS' (Tu parche original)
  if (currencyCode === 'BS' || currencyCode === 'VES') {
    return `Bs. ${new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)}`
  }

  // 3. Intento estándar
  try {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  } catch (error) {
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
    // CAMBIO: Asignamos el array 'breakdown' que definimos en el Controller
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
  <div class="dashboard">
    <div class="page-header">
      <h1>Resumen Financiero</h1>
      <p class="subtitle">Estado real de liquidez desglosado por moneda.</p>
    </div>

    <div v-if="isLoading" class="loading-state">
      <FontAwesomeIcon icon="fa-solid fa-spinner" spin pulse class="loading-icon" />
      <p>Analizando cuentas...</p>
    </div>

    <div v-else-if="breakdown.length > 0" class="content-wrapper">

      <div class="kpi-grid">

        <div class="kpi-card balance-neto">
          <div class="card-header-row">
            <p class="kpi-title">Balance Neto (Real)</p>
            <FontAwesomeIcon icon="fa-solid fa-wallet" class="header-icon primary" />
          </div>

          <div class="currency-list">
            <div v-for="item in breakdown" :key="item.currency_code" class="currency-row">
              <span class="curr-code">{{ item.currency_code }}</span>
              <span class="curr-value" :class="{ 'negative-text': item.balance_neto < 0 }">
                {{ formatCurrency(item.balance_neto, item.currency_code) }}
              </span>
            </div>
          </div>
        </div>

        <div class="kpi-card por-cobrar">
          <div class="card-header-row">
            <p class="kpi-title">Por Cobrar</p>
            <FontAwesomeIcon icon="fa-solid fa-hand-holding-dollar" class="header-icon success" />
          </div>

          <div class="currency-list">
            <div v-for="item in breakdown.filter(i => i.por_cobrar > 0)" :key="'cobrar-' + item.currency_code"
              class="currency-row">
              <span class="curr-code">{{ item.currency_code }}</span>
              <span class="curr-value success-text">
                {{ formatCurrency(item.por_cobrar, item.currency_code) }}
              </span>
            </div>
            <div v-if="breakdown.filter(i => i.por_cobrar > 0).length === 0" class="empty-state-mini">
              Sin cobros pendientes
            </div>
          </div>
        </div>

        <div class="kpi-card por-pagar">
          <div class="card-header-row">
            <p class="kpi-title">Por Pagar</p>
            <FontAwesomeIcon icon="fa-solid fa-file-invoice-dollar" class="header-icon danger" />
          </div>

          <div class="currency-list">
            <div v-for="item in breakdown.filter(i => i.por_pagar > 0)" :key="'pagar-' + item.currency_code"
              class="currency-row">
              <span class="curr-code">{{ item.currency_code }}</span>
              <span class="curr-value danger-text">
                {{ formatCurrency(item.por_pagar, item.currency_code) }}
              </span>
            </div>
            <div v-if="breakdown.filter(i => i.por_pagar > 0).length === 0" class="empty-state-mini">
              Sin deudas pendientes
            </div>
          </div>
        </div>

      </div>

      <div class="box-detail-wrapper">
        <h2>💰 Caja (Disponible)</h2>
        <div class="cash-grid">
          <div v-for="item in breakdown" :key="'caja-' + item.currency_code" class="cash-card">
            <p class="cash-title">{{ item.currency_code }}</p>
            <h4 class="cash-value">
              {{ formatCurrency(item.caja, item.currency_code) }}
            </h4>
            <span class="cash-note">Total en cuentas {{ item.currency_code }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="error-state">
      <p>No hay movimientos registrados.</p>
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
  color: var(--color-text-light);
  /* Aseguramos contraste */
}

.subtitle {
  opacity: 0.6;
  font-size: 0.95rem;
  color: var(--color-text-light);
}

/* --- Grid de KPIs --- */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
}

.kpi-card {
  background-color: var(--color-secondary);
  padding: 20px 25px;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  /* Borde superior de color en lugar de inferior para separar mejor */
  border-top: 4px solid transparent;
}

/* Cabecera interna de la tarjeta para título e icono */
.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 10px;
}

.kpi-title {
  font-size: 1rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-light);
}

.header-icon {
  font-size: 1.2rem;
  opacity: 0.9;
}

.header-icon.primary {
  color: var(--color-primary);
}

.header-icon.success {
  color: var(--color-success);
}

.header-icon.danger {
  color: var(--color-danger);
}

/* --- Lista de Monedas (Nuevo Diseño) --- */
.currency-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.currency-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.1rem;
  /* Tamaño legible */
  padding: 2px 0;
}

.curr-code {
  font-weight: 700;
  font-size: 0.85rem;
  background: rgba(255, 255, 255, 0.08);
  /* Fondo sutil para el código */
  padding: 3px 8px;
  border-radius: 6px;
  color: var(--color-text-light);
  opacity: 0.9;
}

.curr-value {
  font-weight: 600;
  color: var(--color-text-light);
}

/* Colores de estado para los valores */
.success-text {
  color: var(--color-success);
}

.danger-text {
  color: var(--color-danger);
}

.negative-text {
  color: var(--color-danger);
}

.empty-state-mini {
  font-size: 0.85rem;
  color: #777;
  font-style: italic;
  text-align: center;
  padding: 10px;
}

/* Colores de Borde Superior de las Tarjetas */
.balance-neto {
  border-top-color: var(--color-primary);
}

.por-cobrar {
  border-top-color: var(--color-success);
}

.por-pagar {
  border-top-color: var(--color-danger);
}

/* --- Detalle de Caja General (Reutilizado) --- */
.box-detail-wrapper h2 {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: var(--color-text-light);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 10px;
  opacity: 0.9;
}

.cash-grid {
  display: grid;
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
}

.cash-title {
  font-size: 0.9rem;
  color: #3498db;
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
  color: var(--color-text-light);
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
  }

  .page-header {
    margin-bottom: 20px;
    padding-left: 12px;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  .kpi-grid {
    gap: 15px;
    margin-bottom: 30px;
  }

  .kpi-card {
    padding: 15px;
  }

  /* Ajuste de fuentes en móvil */
  .currency-row {
    font-size: 1rem;
  }

  .curr-code {
    font-size: 0.8rem;
    padding: 2px 6px;
  }

  .box-detail-wrapper h2 {
    font-size: 1.3rem;
  }

  .cash-grid {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .cash-card {
    padding: 15px;
    min-width: 0;
  }

  .cash-value {
    font-size: 1.2rem;
  }
}

@media (max-width: 480px) {
  .cash-grid {
    grid-template-columns: 1fr;
  }
}
</style>