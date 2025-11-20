<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useTransactionStore } from '@/stores/transaction'
import { useAuthStore } from '@/stores/auth'
import { useFormValidation } from '@/utils/useFormValidation'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const router = useRouter()
const authStore = useAuthStore()
const transactionStore = useTransactionStore()
const { errors, handleAxiosError } = useFormValidation()

// --- ESTADO ---
const currentStep = ref(1)
const totalSteps = 3
const isSubmitting = ref(false)
const operationType = ref('purchase') // 'purchase' (Compra) | 'exchange' (Intercambio)

const form = reactive({
  client_id: '',
  broker_id: '',
  provider_id: '', // Proveedor de Liquidez
  platform_id: '', // Plataforma / Administrador (Solo Exchange)
  admin_user_id: authStore.authUser?.id,

  from_account_id: '',
  to_account_id: '',

  amount_sent: '',

  // Tasas
  exchange_rate: '',
  buy_rate: '',
  received_rate: '',

  // Comisiones en Porcentaje (Inputs del usuario)
  commission_charged_pct: 0,
  commission_provider_pct: 0,
  commission_admin_pct: 0,

  // Valores calculados (Para visualización y envío)
  commission_charged_amount: 0,
  commission_provider_amount: 0,
  commission_admin_amount: 0,
  commission_net_profit: 0,

  reference_id: '',
})

// --- FILTROS DE CUENTAS ---
const sourceAccounts = computed(() => transactionStore.getAccounts)
const destinationAccounts = computed(() => {
  if (operationType.value === 'purchase') {
    return transactionStore.getAccounts.filter((a) => a.currency_code?.toUpperCase() !== 'VES')
  }
  return transactionStore.getAccounts
})

// --- COMPUTED AUXILIARES ---
const fromAccount = computed(() =>
  transactionStore.getAccounts.find((a) => a.id == form.from_account_id),
)
const toAccount = computed(() =>
  transactionStore.getAccounts.find((a) => a.id == form.to_account_id),
)
const selectedProvider = computed(() =>
  transactionStore.getProviders.find((p) => p.id == form.provider_id),
)
const selectedPlatform = computed(() =>
  transactionStore.getPlatforms.find((p) => p.id == form.platform_id),
)

const commissionCurrency = computed(() => {
  // Si estamos en compra, la base es el monto recibido (divisa de destino, ej: USD).
  if (operationType.value === 'purchase') {
    return toAccount.value?.currency_code || '---'
  }
  // Si estamos en intercambio, la base es el monto enviado (divisa de origen, ej: USD o VES).
  return fromAccount.value?.currency_code || '---'
})

const hasSufficientBalance = computed(() => {
  if (!fromAccount.value || !form.amount_sent) return true
  const rawAccount = transactionStore.rawAccounts?.find((a) => a.id == form.from_account_id)
  return rawAccount ? parseFloat(rawAccount.balance) >= parseFloat(form.amount_sent) : true
})

// --- LÓGICA MATEMÁTICA ---

// 1. Calcular Monto Recibido Base (Usando la tasa correcta)
watch(
  [() => form.amount_sent, () => form.exchange_rate, () => form.buy_rate, operationType],
  ([sent, rate, buyRate, type]) => {
    const s = parseFloat(sent) || 0

    let mainRate = 0

    if (type === 'purchase') {
      // Usa Tasa de Compra (buy_rate) para el cálculo de cuánto recibe el cliente
      mainRate = parseFloat(buyRate) || 0
    } else {
      mainRate = parseFloat(rate) || 0
    }

    if (s > 0 && mainRate > 0) {
      if (type === 'purchase') {
        // COMPRA: División (Sale / Tasa de Compra = Entra)
        form.amount_received = (s / mainRate).toFixed(2)
      } else {
        // INTERCAMBIO: Multiplicación (Sale * Tasa de Intercambio = Entra)
        form.amount_received = (s * mainRate).toFixed(2)
      }
    } else {
      form.amount_received = 0
    }
    calculateCommissions()
  },
  { deep: true },
)

// 2. Calcular Comisiones (Basado en Porcentajes y Base Correcta)
watch(
  [
    () => form.commission_charged_pct,
    () => form.commission_provider_pct,
    () => form.commission_admin_pct,
    () => form.amount_received, // Necesario para el modo compra
    () => form.amount_sent, // Necesario para el modo intercambio
  ],
  () => {
    calculateCommissions()
  },
)

function calculateCommissions() {
  let commissionBase = 0

  if (operationType.value === 'purchase') {
    // 🚨 Base es el Monto Recibido (resultado de la división)
    commissionBase = parseFloat(form.amount_received) || 0
  } else {
    // Base es el Monto Enviado (amount_sent)
    commissionBase = parseFloat(form.amount_sent) || 0
  }

  if (commissionBase > 0) {
    // 1. Cobrada (Ingreso)
    form.commission_charged_amount = (
      (commissionBase * (parseFloat(form.commission_charged_pct) || 0)) /
      100
    ).toFixed(2)

    // 2. Costo Proveedor
    form.commission_provider_amount = (
      (commissionBase * (parseFloat(form.commission_provider_pct) || 0)) /
      100
    ).toFixed(2)

    // 3. Costo Plataforma/Admin (Solo en Intercambio)
    if (operationType.value === 'exchange') {
      form.commission_admin_amount = (
        (commissionBase * (parseFloat(form.commission_admin_pct) || 0)) /
        100
      ).toFixed(2)
    } else {
      form.commission_admin_amount = 0
    }

    // Utilidad Neta = Cobrada - (Proveedor + Plataforma/Admin)
    form.commission_net_profit = (
      parseFloat(form.commission_charged_amount) -
      parseFloat(form.commission_provider_amount) -
      parseFloat(form.commission_admin_amount)
    ).toFixed(2)
  } else {
    form.commission_charged_amount = 0
    form.commission_provider_amount = 0
    form.commission_admin_amount = 0
    form.commission_net_profit = 0
  }
}

// Reset al cambiar pestaña
watch(operationType, () => {
  form.from_account_id = ''
  form.to_account_id = ''
  form.amount_sent = ''

  form.exchange_rate = ''
  form.buy_rate = ''
  form.received_rate = ''

  form.provider_id = ''
  form.platform_id = ''

  form.commission_charged_pct = 0
  form.commission_provider_pct = 0
  form.commission_admin_pct = 0
})

onMounted(async () => {
  await transactionStore.fetchAllSupportData()
})

// --- NAVEGACIÓN ---
const nextStep = () => {
  if (currentStep.value === 1) {
    if (!form.from_account_id || !form.to_account_id || !form.client_id) {
      return Swal.fire('Falta información', 'Complete los campos obligatorios (*).', 'warning')
    }
  }

  if (currentStep.value < totalSteps) currentStep.value++
}
const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--
}

const handleConfirm = async () => {
  if (!hasSufficientBalance.value) return Swal.fire('Error', 'Saldo insuficiente', 'error')

  if (operationType.value === 'exchange') {
    if (!form.provider_id) return Swal.fire('Falta Datos', 'Seleccione el Proveedor', 'warning')
    if (!form.platform_id)
      return Swal.fire('Falta Datos', 'Seleccione la Plataforma/Admin', 'warning')
  }
  if (operationType.value === 'purchase') {
    if (!form.buy_rate || !form.received_rate)
      return Swal.fire('Falta Datos', 'Ingrese ambas tasas de compra/entrada.', 'warning')
  }

  isSubmitting.value = true
  try {
    let payload = { ...form, operation_type: operationType.value }

    // 🚨 CORRECCIÓN: Aseguramos que los campos no usados se envíen como null para la validación condicional del backend
    if (operationType.value === 'purchase') {
      payload.exchange_rate = null
      payload.platform_id = null // Aunque el campo de la plataforma ya no está visible, lo limpiamos
      payload.commission_admin_pct = 0 // Limpiar el porcentaje
      payload.commission_admin_amount = 0 // Limpiar el monto calculado
    } else {
      // exchange
      payload.buy_rate = null
      payload.received_rate = null
    }

    const response = await transactionStore.createCurrencyExchange(payload)

    await Swal.fire({
      title: '¡Procesado!',
      text: `Operación #${response.number} exitosa.`,
      icon: 'success',
      confirmButtonColor: '#0ecb81',
    })
    router.push({ name: 'transaction_exchange_list' })
  } catch (error) {
    handleAxiosError(error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="page-wrapper">
    <div v-if="transactionStore.isLoadingData" class="loading-screen">
      <p>Cargando datos...</p>
    </div>

    <div v-else class="form-card">
      <div class="form-header">
        <div>
          <h2>Nueva Operación</h2>
          <p class="subtitle">Paso {{ currentStep }} / {{ totalSteps }}</p>
        </div>
        <div class="type-switcher">
          <button
            :class="{ active: operationType === 'purchase' }"
            @click="operationType = 'purchase'"
          >
            Compra
          </button>
          <button
            :class="{ active: operationType === 'exchange' }"
            @click="operationType = 'exchange'"
          >
            Intercambio
          </button>
        </div>
      </div>

      <div class="progress-bar" :style="{ width: (currentStep / totalSteps) * 100 + '%' }"></div>

      <div class="form-body">
        <div v-if="currentStep === 1" class="step-content fade-in">
          <div class="grid-2">
            <BaseSelect
              label="Cliente *"
              :options="transactionStore.getClients"
              v-model="form.client_id"
              required
            />

            <BaseSelect
              label="Corredor (Opcional)"
              :options="transactionStore.getBrokers"
              v-model="form.broker_id"
            />

            <div class="grid-2-nested col-span-2">
              <BaseSelect
                label="Proveedor (Liquidez)"
                :options="transactionStore.getProviders"
                v-model="form.provider_id"
                :required="operationType === 'exchange'"
              />

              <BaseSelect
                v-if="operationType === 'exchange'"
                label="Plataforma / Admin *"
                :options="transactionStore.getPlatforms"
                v-model="form.platform_id"
                required
              />
            </div>

            <div class="divider col-span-2"></div>

            <BaseSelect
              label="Cuenta Origen (Sale Dinero) *"
              :options="sourceAccounts"
              v-model="form.from_account_id"
              required
            />

            <BaseSelect
              label="Cuenta Destino (Entra Dinero) *"
              :options="destinationAccounts"
              v-model="form.to_account_id"
              required
            />
          </div>
        </div>

        <div v-if="currentStep === 2" class="step-content fade-in">
          <div class="calc-panel">
            <div class="calc-row">
              <div class="input-group">
                <label>Monto Sale ({{ fromAccount?.currency_code }})</label>
                <input
                  type="number"
                  v-model="form.amount_sent"
                  placeholder="0.00"
                  class="big-input"
                />
              </div>

              <div class="operator">{{ operationType === 'purchase' ? '÷' : '×' }}</div>

              <div class="rate-inputs-container">
                <div v-if="operationType === 'exchange'" class="input-group full-width-rate">
                  <label>Tasa de Intercambio *</label>
                  <input
                    type="number"
                    v-model="form.exchange_rate"
                    placeholder="1.00"
                    class="big-input rate-input"
                  />
                </div>

                <div v-else class="grid-2-rates">
                  <div class="input-group">
                    <label>Tasa de Compra *</label>
                    <input
                      type="number"
                      v-model="form.buy_rate"
                      placeholder="1.00"
                      class="big-input rate-input"
                    />
                  </div>
                  <div class="input-group">
                    <label>Tasa de Entrada *</label>
                    <input
                      type="number"
                      v-model="form.received_rate"
                      placeholder="1.00"
                      class="big-input rate-input"
                    />
                  </div>
                </div>
              </div>

              <div class="operator">=</div>

              <div class="input-group">
                <label>Monto Entra ({{ toAccount?.currency_code }})</label>
                <input
                  type="text"
                  :value="form.amount_received"
                  readonly
                  class="big-input readonly"
                />
              </div>
            </div>
            <p v-if="!hasSufficientBalance" class="error-txt">
              Saldo insuficiente en {{ fromAccount?.name }}
            </p>
          </div>

          <div class="commissions-panel">
            <h4>Desglose de Rentabilidad - (Base: {{ commissionCurrency }})</h4>

            <div
              class="commissions-grid"
              :class="{
                'grid-3': operationType === 'exchange',
                'grid-2': operationType === 'purchase',
              }"
            >
              <div class="comm-card income">
                <label>Comisión Cobrada (%)</label>
                <div class="pct-input-wrapper">
                  <input type="number" v-model="form.commission_charged_pct" placeholder="0" />
                  <span>%</span>
                </div>
                <div class="calc-result text-success">
                  + {{ form.commission_charged_amount }} {{ commissionCurrency }}
                </div>
              </div>

              <div class="comm-card expense">
                <label>Costo Proveedor (%)</label>
                <div class="pct-input-wrapper">
                  <input type="number" v-model="form.commission_provider_pct" placeholder="0" />
                  <span>%</span>
                </div>
                <div class="calc-result text-danger">
                  - {{ form.commission_provider_amount }} {{ commissionCurrency }}
                </div>
              </div>

              <div v-if="operationType === 'exchange'" class="comm-card expense">
                <label>Costo Admin/Plataforma (%)</label>
                <div class="pct-input-wrapper">
                  <input type="number" v-model="form.commission_admin_pct" placeholder="0" />
                  <span>%</span>
                </div>
                <div class="calc-result text-danger">
                  - {{ form.commission_admin_amount }} {{ commissionCurrency }}
                </div>
              </div>
            </div>

            <div class="total-profit-bar">
              <span>Utilidad Neta:</span>
              <strong :class="form.commission_net_profit >= 0 ? 'text-success' : 'text-danger'">
                {{ form.commission_net_profit }} {{ commissionCurrency }}
              </strong>
            </div>
          </div>
        </div>

        <div v-if="currentStep === 3" class="step-content fade-in">
          <div class="summary-card">
            <div class="summary-header">
              <h3>Resumen de Operación</h3>
              <span class="badge">{{
                operationType === 'purchase' ? 'COMPRA' : 'INTERCAMBIO'
              }}</span>
            </div>

            <div class="summary-table">
              <div class="row">
                <span>Cliente</span>
                <strong>{{
                  transactionStore.getClients.find((c) => c.id == form.client_id)?.name
                }}</strong>
              </div>
              <div class="row" v-if="form.provider_id">
                <span>Proveedor</span>
                <span>{{ selectedProvider?.name }}</span>
              </div>
              <div class="row" v-if="form.platform_id">
                <span>Plataforma</span>
                <span>{{ selectedPlatform?.name }}</span>
              </div>
              <div class="divider"></div>

              <div class="row" v-if="operationType === 'purchase'">
                <span>Tasa de Compra (Base)</span>
                <strong>{{ form.buy_rate }}</strong>
              </div>
              <div class="row" v-if="operationType === 'purchase'">
                <span>Tasa de Entrada (Recibida)</span>
                <strong>{{ form.received_rate }}</strong>
              </div>
              <div class="row" v-if="operationType === 'exchange'">
                <span>Tasa de Intercambio</span>
                <strong>{{ form.exchange_rate }}</strong>
              </div>

              <div class="divider"></div>
              <div class="row highlight">
                <span>Sale ({{ fromAccount?.name }})</span>
                <span class="text-danger">- {{ form.amount_sent }}</span>
              </div>
              <div class="row highlight">
                <span>Entra ({{ toAccount?.name }})</span>
                <span class="text-success">+ {{ form.amount_received }}</span>
              </div>
              <div class="divider"></div>
              <div class="row total">
                <span>Ganancia Estimada ({{ commissionCurrency }})</span>
                <span :class="form.commission_net_profit >= 0 ? 'text-success' : 'text-danger'">
                  {{ form.commission_net_profit }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-footer">
        <button v-if="currentStep > 1" @click="prevStep" class="btn-secondary">
          <FontAwesomeIcon icon="fa-solid fa-arrow-left" /> Atrás
        </button>
        <div v-else></div>

        <button v-if="currentStep < totalSteps" @click="nextStep" class="btn-primary">
          Siguiente <FontAwesomeIcon icon="fa-solid fa-arrow-right" />
        </button>
        <button
          v-if="currentStep === totalSteps"
          @click="handleConfirm"
          class="btn-success"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Procesando...' : 'Confirmar Operación' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* GENERAL */
.page-wrapper {
  max-width: 850px;
  margin: 0 auto;
  padding: 20px;
  color: var(--color-text-light);
}
.form-card {
  background-color: var(--color-secondary);
  border-radius: 10px;
  border: 1px solid var(--color-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 600px;
} /* Añadir flex para posicionar footer */
.form-body {
  padding: 25px;
  flex-grow: 1;
} /* Asegura que el cuerpo crezca */

/* LAYOUT */
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.grid-2-nested {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.col-span-2 {
  grid-column: span 2;
}
.divider {
  border-top: 1px solid var(--color-border);
  margin: 10px 0;
  width: 100%;
}
.progress-bar {
  height: 3px;
  background: var(--color-primary);
  transition: width 0.3s;
}

/* HEADER */
.form-header {
  padding: 20px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.type-switcher {
  display: flex;
  background: var(--color-background);
  padding: 4px;
  border-radius: 8px;
  gap: 5px;
}
.type-switcher button {
  background: transparent;
  border: none;
  color: #888;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: bold;
  border-radius: 6px;
  transition: 0.3s;
}
.type-switcher button.active {
  background: var(--color-primary);
  color: #111;
}

/* FOOTER (Botones de navegación) */
.form-footer {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--color-border);
  margin-top: auto; /* 🚨 Empuja el footer hacia abajo */
}
.btn-primary,
.btn-secondary,
.btn-success {
  padding: 10px 25px;
  border-radius: 5px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}
.btn-primary {
  background: var(--color-primary);
  color: #111;
}
.btn-success {
  background: var(--color-success);
  color: #fff;
}
.btn-secondary {
  background: transparent;
  border: 1px solid #444;
  color: #ccc;
}
.btn-secondary:hover {
  background: #2b2f36;
}

/* CALCULADORA */
.calc-panel {
  background: var(--color-background);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid var(--color-border);
}
.calc-row {
  display: flex;
  align-items: flex-end;
  gap: 15px;
}
.input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.input-group label {
  font-size: 0.75rem;
  color: #888;
  margin-bottom: 4px;
  text-transform: uppercase;
}
.big-input {
  background: #2b2f36;
  border: 1px solid var(--color-border);
  color: white;
  padding: 12px;
  font-size: 1.2rem;
  border-radius: 6px;
  width: 100%;
  font-weight: bold;
}
.readonly {
  background: #1e2023;
  color: var(--color-success);
  border-color: transparent;
}
.operator {
  font-size: 1.5rem;
  padding-bottom: 8px;
  color: #555;
}
.error-txt {
  color: var(--color-danger);
  margin-top: 5px;
  font-weight: bold;
}

.rate-inputs-container {
  flex: 2;
}
.grid-2-rates {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.rate-inputs-container .full-width-rate {
  flex: 1;
}

/* COMISIONES */
.commissions-panel h4 {
  margin: 0 0 15px 0;
  color: var(--color-text-light);
  font-size: 1rem;
  border-bottom: 1px dashed var(--color-border);
  padding-bottom: 10px;
}
.commissions-grid {
  display: grid;
  gap: 15px;
  margin-bottom: 20px;
}
.grid-3 {
  grid-template-columns: 1fr 1fr 1fr;
}
.grid-2 {
  grid-template-columns: 1fr 1fr;
}

.comm-card {
  background: var(--color-background);
  padding: 15px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
}
.comm-card label {
  font-size: 0.7rem;
  color: #aaa;
  margin-bottom: 8px;
}
.pct-input-wrapper {
  display: flex;
  align-items: center;
  background: #2b2f36;
  border-radius: 4px;
  padding: 0 8px;
  border: 1px solid #444;
}
.pct-input-wrapper input {
  background: transparent;
  border: none;
  color: white;
  width: 100%;
  padding: 6px 0;
  text-align: right;
  font-weight: bold;
}
.calc-result {
  text-align: right;
  margin-top: 5px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #ccc;
}

.total-profit-bar {
  background: #2b2f36;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid var(--color-border);
}
.total-profit-bar strong {
  font-size: 1.3rem;
}

/* RESUMEN */
.summary-card {
  background: var(--color-background);
  padding: 0;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  max-width: 500px;
  margin: 0 auto;
  overflow: hidden;
}
.summary-header {
  background: #2b2f36;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.summary-table {
  padding: 20px;
}
.row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.95rem;
}
.row.total {
  font-size: 1.2rem;
  font-weight: bold;
  margin-top: 15px;
  border-top: 1px solid var(--color-border);
  padding-top: 10px;
}
</style>
