<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useTransactionStore } from '@/stores/transaction'
import { useAuthStore } from '@/stores/auth'
import { useFormValidation } from '@/utils/useFormValidation'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelectWithSearchAndCreate from '@/components/ui/BaseSelectWithSearchAndCreate.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const router = useRouter()
const authStore = useAuthStore()
const transactionStore = useTransactionStore()
const { errors, handleAxiosError } = useFormValidation()

// --- ESTADO ---
const currentStep = ref(1)
const totalSteps = 3
const isSubmitting = ref(false)

// Tipos: 'purchase' | 'exchange' | 'currency_change'
const operationType = ref('purchase')

const form = reactive({
  client_id: '',
  // Fuente de fondos: 'own' | 'investor'
  capital_type: 'own',
  investor_id: '',
  investor_profit_pct: 0,
  investor_profit_amount: 0,
  broker_id: '',
  provider_id: '',
  platform_id: '',
  admin_user_id: authStore.authUser?.id,

  from_account_id: '',
  to_account_id: '',

  amount_sent: '',

  // Tasas
  exchange_rate: '',
  buy_rate: '',
  received_rate: '',

  // Comisiones
  commission_charged_pct: 0,
  commission_provider_pct: 0,
  commission_admin_pct: 0,
  commission_broker_pct: 0,

  // Valores calculados
  commission_charged_amount: 0,
  commission_provider_amount: 0,
  commission_admin_amount: 0,
  commission_broker_amount: 0,
  commission_net_profit: 0,
  commission_net_after_investor: 0,

  reference_id: '',
  delivered: true,
})

// --- COMPUTED HELPERS ---
const isComplexExchange = computed(() => operationType.value === 'currency_change')

const sourceAccounts = computed(() => transactionStore.getAccounts)
const destinationAccounts = computed(() => {
  return transactionStore.getAccounts
})

const fromAccount = computed(() =>
  transactionStore.getAccounts.find((a) => a.id == form.from_account_id),
)
const toAccount = computed(() =>
  transactionStore.getAccounts.find((a) => a.id == form.to_account_id),
)
const selectedPlatform = computed(() =>
  transactionStore.getPlatforms.find((p) => p.id == form.platform_id),
)

const sourceName = computed(() => {
  if (form.capital_type === 'investor') {
    const inv = transactionStore.getInvestors.find((i) => i.id == form.investor_id)
    return inv?.name || 'Fondo Inversionista'
  }
  return fromAccount.value?.name || ''
})

const sourceCurrency = computed(() => {
  if (form.capital_type === 'investor') return ''
  return fromAccount.value?.currency_code || ''
})

const commissionCurrency = computed(() => {
  if (operationType.value === 'purchase') {
    return toAccount.value?.currency_code || '---'
  }
  return fromAccount.value?.currency_code || '---'
})

// nota: removed unused computed `totalClientPays`

const hasSufficientBalance = computed(() => {
  // Si la fuente es inversionista, no necesitamos verificar saldo en caja
  if (form.capital_type === 'investor') return true
  if (!fromAccount.value || !form.amount_sent) return true
  const rawAccount = transactionStore.rawAccounts?.find((a) => a.id == form.from_account_id)
  return rawAccount ? parseFloat(rawAccount.balance) >= parseFloat(form.amount_sent) : true
})

// --- LÓGICA MATEMÁTICA ---
watch(
  [
    () => form.amount_sent,
    () => form.exchange_rate,
    () => form.buy_rate,
    () => form.received_rate,
    operationType,
  ],
  ([sent, rate, buyRate, , type]) => {
    const s = parseFloat(sent) || 0
    let mainRate = 0

    if (type === 'exchange') {
      form.exchange_rate = 1
      form.amount_received = s.toFixed(2)
    } else if (type === 'purchase') {
      const bRate = parseFloat(buyRate) || 0
      if (s > 0 && bRate > 0) {
        form.amount_received = (s / bRate).toFixed(2)
      } else {
        form.amount_received = 0
      }
      calculateCommissions()
    } else {
      mainRate = parseFloat(rate) || 0
      if (s > 0 && mainRate > 0) form.amount_received = (s * mainRate).toFixed(2)
      else form.amount_received = 0
      calculateCommissions()
    }
  },
  { deep: true },
)

watch(
  [
    () => form.commission_charged_pct,
    () => form.commission_provider_pct,
    () => form.commission_admin_pct,
    () => form.commission_broker_pct,
    () => form.amount_received,
    () => form.amount_sent,
    () => form.investor_profit_pct,
    () => form.capital_type,
  ],
  () => {
    if (operationType.value !== 'exchange') {
      calculateCommissions()
    }
  },
)

function calculateCommissions() {
  const amountSent = parseFloat(form.amount_sent) || 0

  if (amountSent > 0) {
    let commissionBase = 0

    if (operationType.value === 'purchase') {
      // GANANCIA (SPREAD)
      const entryRate = parseFloat(form.received_rate) || 0
      const buyRate = parseFloat(form.buy_rate) || 0

      if (entryRate > 0 && buyRate > 0) {
        const spread = entryRate - buyRate
        form.commission_charged_amount = (parseFloat(form.amount_received) * spread).toFixed(2)
      } else {
        form.commission_charged_amount = 0
      }
      commissionBase = parseFloat(form.amount_received) || 0
    } else {
      commissionBase = amountSent
      form.commission_charged_amount = (
        (commissionBase * (parseFloat(form.commission_charged_pct) || 0)) /
        100
      ).toFixed(2)
    }

    // COSTOS
    form.commission_provider_amount = (
      (commissionBase * (parseFloat(form.commission_provider_pct) || 0)) /
      100
    ).toFixed(2)

    // Admin (Solo en Complex)
    if (isComplexExchange.value) {
      form.commission_admin_amount = (
        (commissionBase * (parseFloat(form.commission_admin_pct) || 0)) /
        100
      ).toFixed(2)
    } else {
      form.commission_admin_amount = 0
    }

    // CORREDOR (Solo si NO es Compra)
    if (form.broker_id && operationType.value !== 'purchase') {
      form.commission_broker_amount = (
        (commissionBase * (parseFloat(form.commission_broker_pct) || 0)) /
        100
      ).toFixed(2)
    } else {
      form.commission_broker_amount = 0
    }

    // UTILIDAD NETA
    form.commission_net_profit = (
      parseFloat(form.commission_charged_amount) -
      parseFloat(form.commission_provider_amount) -
      parseFloat(form.commission_admin_amount) -
      parseFloat(form.commission_broker_amount)
    ).toFixed(2)

    // Si la fuente de fondos es inversionista, calcular monto del inversionista
    if (form.capital_type === 'investor') {
      const pct = parseFloat(form.investor_profit_pct) || 0
      form.investor_profit_amount = (
        ((parseFloat(form.commission_charged_amount) || 0) * pct) /
        100
      ).toFixed(2)
      form.commission_net_after_investor = (
        parseFloat(form.commission_net_profit) - parseFloat(form.investor_profit_amount)
      ).toFixed(2)
    } else {
      form.investor_profit_amount = 0
      form.commission_net_after_investor = form.commission_net_profit
    }
  } else {
    resetCommissions()
  }
}

function resetCommissions() {
  form.commission_charged_amount = 0
  form.commission_provider_amount = 0
  form.commission_admin_amount = 0
  form.commission_broker_amount = 0
  form.commission_net_profit = 0
  form.investor_profit_amount = 0
  form.investor_profit_pct = 0
  form.commission_net_after_investor = 0
}

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
  form.commission_broker_pct = 0
  resetCommissions()
})

onMounted(async () => {
  await transactionStore.fetchAllSupportData()
})

// --- NAVEGACIÓN ---
const nextStep = () => {
  if (currentStep.value === 1) {
    const missingFrom = form.capital_type === 'investor' ? false : !form.from_account_id
    if (missingFrom || !form.to_account_id || !form.client_id) {
      return Swal.fire('Falta información', 'Complete los campos obligatorios (*).', 'warning')
    }
    if (operationType.value === 'exchange' && !form.platform_id) {
      return Swal.fire('Falta información', 'Seleccione el Admin (Plataforma).', 'warning')
    }
  }
  if (currentStep.value < totalSteps) currentStep.value++
}
const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--
}

const handleConfirm = async () => {
  if (!hasSufficientBalance.value) return Swal.fire('Error', 'Saldo insuficiente', 'error')

  if (isComplexExchange.value) {
    if (!form.provider_id) return Swal.fire('Falta Datos', 'Seleccione el Proveedor', 'warning')
    if (!form.platform_id)
      return Swal.fire('Falta Datos', 'Seleccione la Plataforma/Admin', 'warning')
  }

  if (operationType.value === 'exchange' && !form.platform_id) {
    return Swal.fire('Falta Datos', 'Seleccione el Admin (Plataforma)', 'warning')
  }

  if (operationType.value === 'purchase') {
    if (!form.buy_rate || !form.received_rate)
      return Swal.fire('Falta Datos', 'Ingrese tasas.', 'warning')
  }

  if (operationType.value === 'exchange' && !form.exchange_rate) {
    form.exchange_rate = 1
  }

  isSubmitting.value = true
  try {
    let payload = { ...form }

    // Do not send broker amount field — backend DB doesn't have this column
    delete payload.commission_broker_amount

    // Si la fuente es inversionista, enviar explicitamente null en `from_account_id`
    // para evitar errores en backends que esperan la clave, pero permiten valor nulo.
    if (form.capital_type === 'investor') {
      payload.from_account_id = null
    }

    if (operationType.value === 'currency_change') {
      payload.operation_type = 'exchange'
      if (!payload.exchange_rate || payload.exchange_rate == 0) payload.exchange_rate = 1
      payload.amount_received = (
        parseFloat(payload.amount_sent) * parseFloat(payload.exchange_rate)
      ).toFixed(2)
      payload.buy_rate = null
      payload.received_rate = null
    } else if (operationType.value === 'exchange') {
      payload.operation_type = 'exchange'
      payload.buy_rate = null
      payload.received_rate = null
      payload.provider_id = null
      payload.broker_id = null
    } else {
      payload.operation_type = 'purchase'
      payload.exchange_rate = null
      // payload.platform_id SE ENVÍA SI FUE SELECCIONADO
      payload.commission_admin_pct = 0
      payload.commission_admin_amount = 0

      // Corredor se envía ID pero monto 0
      payload.commission_broker_pct = 0
      payload.commission_broker_amount = 0

      payload.delivered = form.delivered
    }

    if (!payload.broker_id) {
      payload.commission_broker_pct = 0
      payload.commission_broker_amount = 0
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
          <button
            :class="{ active: operationType === 'currency_change' }"
            @click="operationType = 'currency_change'"
          >
            Cambio Divisa
          </button>
        </div>
      </div>

      <div class="progress-bar" :style="{ width: (currentStep / totalSteps) * 100 + '%' }"></div>

      <div class="form-body">
        <div v-if="currentStep === 1" class="step-content fade-in">
          <div class="grid-2">
            <BaseSelectWithSearchAndCreate
              label="Cliente *"
              :options="transactionStore.getClients"
              v-model="form.client_id"
              required
              create-endpoint="/clients"
              :create-fields="{ name: '' }"
              create-label="Cliente"
            />

            <div class="col-span-2">
              <label class="small-label">Fuente de Fondos</label>
              <div class="type-switcher" style="margin-top: 8px">
                <button
                  :class="{ active: form.capital_type === 'own' }"
                  @click="form.capital_type = 'own'"
                >
                  Propio
                </button>
                <button
                  :class="{ active: form.capital_type === 'investor' }"
                  @click="form.capital_type = 'investor'"
                >
                  Inversionista
                </button>
              </div>
            </div>

            <div v-if="form.capital_type === 'investor'" class="col-span-2">
              <BaseSelectWithSearchAndCreate
                label="Inversionista *"
                :options="transactionStore.getInvestors"
                v-model="form.investor_id"
                required
                create-endpoint="/investors"
                :create-fields="{ name: '' }"
                create-label="Inversionista"
              />
            </div>

            <div v-if="operationType === 'exchange'">
              <BaseSelectWithSearchAndCreate
                label="Admin (Plataforma) *"
                :options="transactionStore.getPlatforms"
                v-model="form.platform_id"
                required
                create-endpoint="/platforms"
                :create-fields="{ name: '' }"
                create-label="Plataforma"
              />
            </div>

            <template v-if="operationType !== 'exchange'">
              <BaseSelectWithSearchAndCreate
                label="Corredor (Opcional)"
                :options="transactionStore.getBrokers"
                v-model="form.broker_id"
                create-endpoint="/brokers"
                :create-fields="{ name: '' }"
                create-label="Corredor"
              />

              <div class="grid-2-nested col-span-2">
                <BaseSelectWithSearchAndCreate
                  label="Proveedor (Liquidez)"
                  :options="transactionStore.getProviders"
                  v-model="form.provider_id"
                  :required="isComplexExchange"
                  create-endpoint="/providers"
                  :create-fields="{ name: '' }"
                  create-label="Proveedor"
                />

                <BaseSelectWithSearchAndCreate
                  v-if="isComplexExchange || operationType === 'purchase'"
                  label="Plataforma / Admin"
                  :options="transactionStore.getPlatforms"
                  v-model="form.platform_id"
                  :required="isComplexExchange"
                  create-endpoint="/platforms"
                  :create-fields="{ name: '' }"
                  create-label="Plataforma"
                />
              </div>
              <div class="divider col-span-2"></div>
            </template>

            <template v-if="form.capital_type !== 'investor'">
              <BaseSelectWithSearchAndCreate
                label="Cuenta Origen (Sale) *"
                :options="sourceAccounts"
                v-model="form.from_account_id"
                required
                create-endpoint="/accounts"
                :create-fields="{ name: '' }"
                create-label="Cuenta"
              />
            </template>
            <template v-else>
              <div class="input-group">
                <label>Fuente</label>
                <input type="text" class="big-input readonly" :value="sourceName" readonly />
              </div>
            </template>

            <BaseSelectWithSearchAndCreate
              label="Cuenta Destino (Entra) *"
              :options="destinationAccounts"
              v-model="form.to_account_id"
              required
              create-endpoint="/accounts"
              :create-fields="{ name: '' }"
              create-label="Cuenta"
            />
          </div>
        </div>

        <div v-if="currentStep === 2" class="step-content fade-in">
          <div class="calc-panel">
            <div class="calc-row">
              <div class="input-group">
                <label>Monto Enviado</label>
                <input
                  type="number"
                  v-model="form.amount_sent"
                  placeholder="0.00"
                  class="big-input"
                />
              </div>

              <div class="operator">
                {{ operationType === 'exchange' ? '' : operationType === 'purchase' ? '÷' : '×' }}
              </div>
              <div v-if="operationType === 'exchange'" class="operator">
                <FontAwesomeIcon icon="fa-solid fa-arrow-right" />
              </div>

              <div class="rate-inputs-container">
                <div v-if="operationType !== 'purchase'" class="input-group full-width-rate">
                  <template v-if="operationType !== 'exchange'">
                    <label>Tasa</label>
                    <input
                      type="number"
                      v-model="form.exchange_rate"
                      placeholder="1.00"
                      class="big-input rate-input"
                    />
                  </template>
                </div>

                <div v-else class="grid-2-rates">
                  <div class="input-group">
                    <label>Tasa Compra</label>
                    <input
                      type="number"
                      v-model="form.buy_rate"
                      placeholder="150"
                      class="big-input rate-input"
                    />
                  </div>
                  <div class="input-group">
                    <label>Tasa Mercado/Real</label>
                    <input
                      type="number"
                      v-model="form.received_rate"
                      placeholder="300"
                      class="big-input rate-input"
                    />
                  </div>
                </div>
              </div>

              <div v-if="operationType !== 'exchange'" class="operator">=</div>

              <div class="input-group">
                <label>Monto Recibido</label>
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

            <div v-if="operationType === 'purchase'" class="delivery-check">
              <label class="checkbox-wrapper">
                <input type="checkbox" v-model="form.delivered" />
                <span class="checkmark"></span>
                <div class="check-text">
                  <span class="title">Entregar Divisas Inmediatamente</span>
                  <small>{{ form.delivered ? 'COMPLETADA' : 'PENDIENTE' }}</small>
                </div>
              </label>
            </div>
          </div>

          <div v-if="operationType !== 'exchange'" class="commissions-panel">
            <div class="panel-header-flex">
              <h4>Rentabilidad (Spread)</h4>
            </div>

            <div
              class="commissions-grid"
              :class="{ 'grid-2': operationType === 'purchase', 'grid-3': isComplexExchange }"
            >
              <div class="comm-card income">
                <label>{{
                  operationType === 'purchase' ? 'Ganancia Bruta (Spread)' : 'Comisión Cobrada (%)'
                }}</label>

                <div v-if="operationType !== 'purchase'" class="pct-input-wrapper">
                  <input type="number" v-model="form.commission_charged_pct" placeholder="0" />
                  <span>%</span>
                </div>

                <div class="calc-result text-success">+ {{ form.commission_charged_amount }}</div>
              </div>

              <div class="comm-card expense">
                <label>Costo Proveedor (%)</label>
                <div class="pct-input-wrapper">
                  <input type="number" v-model="form.commission_provider_pct" placeholder="0" />
                  <span>%</span>
                </div>
                <div class="calc-result text-danger">- {{ form.commission_provider_amount }}</div>
              </div>

              <div v-if="isComplexExchange" class="comm-card expense">
                <label>Costo Admin (%)</label>
                <div class="pct-input-wrapper">
                  <input type="number" v-model="form.commission_admin_pct" placeholder="0" />
                  <span>%</span>
                </div>
                <div class="calc-result text-danger">- {{ form.commission_admin_amount }}</div>
              </div>

              <div v-if="form.capital_type === 'investor'" class="comm-card expense">
                <label>Porcentaje Inversionista (%)</label>
                <div class="pct-input-wrapper">
                  <input type="number" v-model="form.investor_profit_pct" placeholder="0" />
                  <span>%</span>
                </div>
                <div class="calc-result text-danger">- {{ form.investor_profit_amount }}</div>
              </div>

              <div v-if="form.broker_id && operationType !== 'purchase'" class="comm-card expense">
                <label>Costo Corredor (%)</label>
                <div class="pct-input-wrapper">
                  <input type="number" v-model="form.commission_broker_pct" placeholder="0" />
                  <span>%</span>
                </div>
                <div class="calc-result text-danger">- {{ form.commission_broker_amount }}</div>
              </div>
            </div>

            <div class="total-profit-bar">
              <span>Ganancia Neta:</span>
              <strong :class="form.commission_net_profit >= 0 ? 'text-success' : 'text-danger'">
                {{ form.commission_net_profit }} {{ commissionCurrency }}
              </strong>
            </div>
          </div>
        </div>

        <div v-if="currentStep === 3" class="step-content fade-in">
          <div class="summary-card">
            <div class="summary-header">
              <h3>Resumen</h3>
              <span class="badge">{{ operationType.toUpperCase().replace('_', ' ') }}</span>
            </div>

            <div class="summary-table">
              <div class="row">
                <span>Cliente</span>
                <strong>{{
                  transactionStore.getClients.find((c) => c.id == form.client_id)?.name
                }}</strong>
              </div>

              <div class="row" v-if="form.platform_id">
                <span>Admin/Plataforma</span>
                <span>{{ selectedPlatform?.name }}</span>
              </div>

              <div class="row" v-if="form.broker_id && operationType === 'purchase'">
                <span>Corredor</span>
                <span>{{
                  transactionStore.getBrokers.find((b) => b.id == form.broker_id)?.name
                }}</span>
              </div>

              <div class="divider"></div>

              <div class="row highlight">
                <span>Monto Enviado ({{ fromAccount?.name }})</span>
                <span class="text-danger"
                  >- {{ form.amount_sent }} {{ fromAccount?.currency_code }}</span
                >
              </div>

              <div class="row highlight">
                <span>Monto Recibido ({{ toAccount?.name }})</span>
                <span class="text-success"
                  >+ {{ form.amount_received }} {{ toAccount?.currency_code }}</span
                >
              </div>

              <div v-if="operationType === 'purchase'" class="row">
                <span>Spread (Ganancia/Unidad)</span>
                <span>{{
                  (parseFloat(form.received_rate) - parseFloat(form.buy_rate)).toFixed(2)
                }}</span>
              </div>

              <div v-if="operationType === 'purchase'" class="row">
                <span>Estado</span>
                <span>{{ form.delivered ? 'COMPLETADA' : 'PENDIENTE' }}</span>
              </div>

              <template v-if="operationType !== 'exchange'">
                <div class="divider"></div>
                <div class="row total">
                  <span>Ganancia Neta ({{ commissionCurrency }})</span>
                  <span :class="form.commission_net_profit >= 0 ? 'text-success' : 'text-danger'">
                    {{ form.commission_net_profit }}
                  </span>
                </div>
              </template>
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
          Siguiente
          <FontAwesomeIcon icon="fa-solid fa-arrow-right" />
        </button>
        <button
          v-if="currentStep === totalSteps"
          @click="handleConfirm"
          class="btn-success"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Procesando...' : 'Confirmar' }}
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
}

/* Añadir flex para posicionar footer */
.form-body {
  padding: 25px;
  flex-grow: 1;
}

/* Asegura que el cuerpo crezca */

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
  margin-top: auto;
  /* 🚨 Empuja el footer hacia abajo */
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

/* Estilos para el Checkbox de Entrega */
.delivery-check {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid var(--color-border);
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.checkbox-wrapper input {
  display: none;
  /* Ocultar el checkbox nativo */
}

.checkmark {
  width: 24px;
  height: 24px;
  background-color: #2b2f36;
  border: 1px solid #555;
  border-radius: 6px;
  position: relative;
  transition: 0.2s;
}

.checkbox-wrapper input:checked ~ .checkmark {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.checkbox-wrapper input:checked ~ .checkmark::after {
  content: '';
  position: absolute;
  left: 8px;
  top: 4px;
  width: 6px;
  height: 12px;
  border: solid #000;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.check-text {
  display: flex;
  flex-direction: column;
}

.check-text .title {
  font-weight: bold;
  color: var(--color-text-light);
  font-size: 0.95rem;
}

.check-text small {
  color: #888;
  font-size: 0.8rem;
}

.text-warning {
  color: #f39c12;
  font-weight: bold;
}
</style>
