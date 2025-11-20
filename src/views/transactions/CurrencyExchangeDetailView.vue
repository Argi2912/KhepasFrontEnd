<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const route = useRoute()
const router = useRouter()
const tx = ref(null)
const loading = ref(true)
const showDebug = ref(false) // Para ver el JSON real si es necesario

// --- COMPUTEDS INTELIGENTES (Detectan CamelCase o snake_case) ---

const getRel = (obj, camelKey) => {
  if (!obj) return null
  // 1. Intenta CamelCase (ej: fromAccount)
  if (obj[camelKey]) return obj[camelKey]

  // 2. Intenta snake_case (ej: from_account)
  const snakeKey = camelKey.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
  if (obj[snakeKey]) return obj[snakeKey]

  return null
}

const fromAccount = computed(() => getRel(tx.value, 'fromAccount') || {})
const toAccount = computed(() => getRel(tx.value, 'toAccount') || {})
const client = computed(() => getRel(tx.value, 'client') || {})
const adminUser = computed(() => getRel(tx.value, 'adminUser') || {})
const provider = computed(() => getRel(tx.value, 'provider') || {})
const broker = computed(() => getRel(tx.value, 'broker') || {})
// Acceso seguro al usuario del broker (puede venir anidado como broker.user o plano)
const brokerUser = computed(() => broker.value.user || {})

// --- LÓGICA DE VISUALIZACIÓN ---

const operationType = computed(() => {
  if (tx.value?.operation_type) return tx.value.operation_type
  // Inferencia: Si exchange_rate es igual a buy_rate (o buy_rate no existe), es Intercambio.
  // Si buy_rate existe y es diferente, es Compra.
  if (tx.value?.buy_rate && parseFloat(tx.value.buy_rate) !== parseFloat(tx.value.exchange_rate)) {
    return 'purchase'
  }
  return 'exchange'
})

const commissionCurrency = computed(() => {
  if (operationType.value === 'purchase') {
    return toAccount.value.currency_code || 'USD'
  }
  return fromAccount.value.currency_code || 'USD'
})

const exchangeRateDetails = computed(() => {
  if (!tx.value) return {}

  // Si detectamos que fue una compra con tasas diferenciadas
  if (operationType.value === 'purchase') {
    return {
      title: 'Tasas de Compra',
      rate1: { label: 'Compra (Base)', value: tx.value.buy_rate || tx.value.exchange_rate },
      rate2: { label: 'Entrada (Cliente)', value: tx.value.received_rate || '---' },
      usedRate: tx.value.buy_rate || tx.value.exchange_rate,
    }
  }

  return {
    title: 'Tasa de Operación',
    rate1: { label: 'Tasa Aplicada', value: tx.value.exchange_rate },
    rate2: null,
    usedRate: tx.value.exchange_rate,
  }
})

const netProfit = computed(() => {
  if (!tx.value) return 0
  const charged = parseFloat(
    tx.value.commission_total_amount || tx.value.commission_charged_amount || 0,
  )
  const providerCost = parseFloat(tx.value.commission_provider_amount || 0)
  const adminCost = parseFloat(tx.value.commission_admin_amount || 0)

  return (charged - providerCost - adminCost).toFixed(2)
})

// --- API ---
onMounted(async () => {
  try {
    const { data } = await api.get(`/transactions/exchanges/${route.params.id}`)
    tx.value = data
    console.log('Transaction Data:', data) // Ver en consola del navegador (F12)
  } catch (e) {
    console.error(e)
    router.push({ name: 'transaction_exchange_list' })
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="detail-wrapper">
    <div v-if="loading" class="text-center">
      <FontAwesomeIcon icon="fa-solid fa-spinner" spin size="2x" />
      <p>Cargando...</p>
    </div>

    <div v-else-if="tx" class="invoice-card">
      <div class="invoice-header">
        <div>
          <h2>Transacción #{{ tx.number }}</h2>
          <span class="date-label">{{ new Date(tx.created_at).toLocaleString('es-VE') }}</span>
        </div>
        <div class="header-badges">
          <span class="badge type-badge">
            {{ operationType === 'purchase' ? 'COMPRA' : 'INTERCAMBIO' }}
          </span>
          <span :class="['badge', `bg-${tx.status === 'completed' ? 'success' : 'warning'}`]">
            {{ tx.status ? tx.status.toUpperCase() : 'COMPLETADO' }}
          </span>
        </div>
      </div>

      <div class="meta-info-grid">
        <div class="info-group">
          <label>Cliente</label>
          <p>{{ client.name || '---' }}</p>
        </div>
        <div class="info-group">
          <label>Corredor</label>
          <p>{{ brokerUser.name || 'Directo' }}</p>
        </div>
        <div class="info-group">
          <label>Registrado Por</label>
          <p>{{ adminUser.name || 'Sistema' }}</p>
        </div>
      </div>

      <div class="divider"></div>

      <div class="flow-chart-container">
        <div class="flow-box left">
          <span>SALE DE ({{ fromAccount.name || 'Origen' }})</span>
          <strong class="text-danger amount-text">
            - {{ parseFloat(tx.amount_sent).toFixed(2) }}
            <small>{{ fromAccount.currency_code }}</small>
          </strong>
        </div>

        <div class="flow-arrow">
          <div class="line"></div>
          <FontAwesomeIcon icon="fa-solid fa-circle-right" />
          <span class="rate-pill">Tasa: {{ exchangeRateDetails.usedRate }}</span>
        </div>

        <div class="flow-box right">
          <span>ENTRA EN ({{ toAccount.name || 'Destino' }})</span>
          <strong class="text-success amount-text">
            + {{ parseFloat(tx.amount_received).toFixed(2) }}
            <small>{{ toAccount.currency_code }}</small>
          </strong>
        </div>
      </div>

      <div class="sections-grid">
        <div class="detail-section">
          <h4><FontAwesomeIcon icon="fa-solid fa-percent" /> {{ exchangeRateDetails.title }}</h4>
          <div class="detail-row">
            <span>{{ exchangeRateDetails.rate1.label }}:</span>
            <strong>{{ exchangeRateDetails.rate1.value }}</strong>
          </div>
          <div v-if="exchangeRateDetails.rate2" class="detail-row">
            <span>{{ exchangeRateDetails.rate2.label }}:</span>
            <strong>{{ exchangeRateDetails.rate2.value }}</strong>
          </div>
        </div>

        <div class="detail-section">
          <h4>
            <FontAwesomeIcon icon="fa-solid fa-calculator" /> Rentabilidad ({{
              commissionCurrency
            }})
          </h4>

          <div class="detail-row income">
            <span>Comisión Cobrada:</span>
            <strong>+ {{ parseFloat(tx.commission_total_amount || 0).toFixed(2) }}</strong>
          </div>
          <div class="detail-row expense">
            <span>Pago a Proveedor ({{ provider.name || 'N/A' }}):</span>
            <strong>- {{ parseFloat(tx.commission_provider_amount || 0).toFixed(2) }}</strong>
          </div>
          <div v-if="parseFloat(tx.commission_admin_amount) > 0" class="detail-row expense">
            <span>Costo Plataforma:</span>
            <strong>- {{ parseFloat(tx.commission_admin_amount).toFixed(2) }}</strong>
          </div>

          <div class="detail-row total">
            <span>Utilidad Neta:</span>
            <strong :class="netProfit >= 0 ? 'text-success' : 'text-danger'">
              {{ netProfit }}
            </strong>
          </div>
        </div>
      </div>

      <div class="debug-toggle">
        <button @click="showDebug = !showDebug" class="btn-link">
          {{ showDebug ? 'Ocultar Datos Crudos' : 'Ver Datos Crudos (Debug)' }}
        </button>
        <pre v-if="showDebug" class="debug-box">{{ tx }}</pre>
      </div>

      <div class="footer-actions">
        <button @click="router.back()" class="btn-secondary">
          <FontAwesomeIcon icon="fa-solid fa-arrow-left" /> Volver
        </button>
      </div>
    </div>

    <div v-else class="text-center error-state">
      <p>No se encontró la transacción.</p>
      <button @click="router.back()" class="btn-secondary">Volver</button>
    </div>
  </div>
</template>

<style scoped>
.detail-wrapper {
  max-width: 900px;
  margin: 20px auto;
  padding: 0 20px;
  color: var(--color-text-light);
}

.invoice-card {
  background-color: var(--color-secondary);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

/* Header */
.invoice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 25px;
}
.invoice-header h2 {
  margin: 0;
  color: var(--color-primary);
  font-size: 1.8rem;
}
.date-label {
  color: #888;
  font-size: 0.9rem;
}
.header-badges {
  display: flex;
  gap: 10px;
}
.badge {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
}
.type-badge {
  background: #444;
  color: #fff;
  border: 1px solid #666;
}
.bg-success {
  background-color: rgba(14, 203, 129, 0.2);
  color: var(--color-success);
  border: 1px solid var(--color-success);
}
.bg-warning {
  background-color: rgba(243, 156, 18, 0.2);
  color: #f39c12;
  border: 1px solid #f39c12;
}

/* Meta Info Grid */
.meta-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  background: var(--color-background);
  padding: 15px;
  border-radius: 8px;
}
.info-group label {
  display: block;
  font-size: 0.75rem;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.info-group p {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: #eee;
}

.divider {
  height: 1px;
  background: var(--color-border);
  margin: 25px 0;
}

/* Flow Chart */
.flow-chart-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 0 10px;
}
.flow-box {
  display: flex;
  flex-direction: column;
}
.flow-box.right {
  text-align: right;
  align-items: flex-end;
}

.flow-box span {
  font-size: 0.8rem;
  color: #aaa;
  margin-bottom: 5px;
}
.amount-text {
  font-size: 1.6rem;
  font-weight: bold;
}
.amount-text small {
  font-size: 1rem;
  font-weight: normal;
  color: #888;
  margin-left: 5px;
}

.flow-arrow {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding: 0 20px;
  color: var(--color-border);
}
.flow-arrow svg {
  font-size: 1.5rem;
  z-index: 2;
  background: var(--color-secondary);
}
.rate-pill {
  margin-top: 8px;
  background: #333;
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 0.8rem;
  color: var(--color-primary);
  border: 1px solid var(--color-border);
}

/* Sections */
.sections-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}
.detail-section {
  background: var(--color-background);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}
.detail-section h4 {
  color: var(--color-text-light);
  font-size: 1rem;
  border-bottom: 1px dashed #444;
  padding-bottom: 10px;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.detail-section h4 svg {
  color: var(--color-primary);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 0.95rem;
}
.detail-row.total {
  border-top: 1px solid #444;
  padding-top: 12px;
  margin-top: 15px;
  font-size: 1.1rem;
}

/* Utils */
.text-danger {
  color: var(--color-danger) !important;
}
.text-success {
  color: var(--color-success) !important;
}
.btn-secondary {
  background: transparent;
  border: 1px solid #666;
  color: #ccc;
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-secondary:hover {
  background: #333;
}

/* Debug */
.debug-toggle {
  margin-top: 30px;
  text-align: center;
}
.btn-link {
  background: none;
  border: none;
  color: #555;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.8rem;
}
.debug-box {
  text-align: left;
  background: #000;
  color: #0f0;
  padding: 15px;
  border-radius: 5px;
  overflow: auto;
  max-height: 300px;
  margin-top: 10px;
  font-size: 0.75rem;
}

.footer-actions {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}
</style>
