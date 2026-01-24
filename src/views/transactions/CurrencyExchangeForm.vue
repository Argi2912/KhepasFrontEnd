<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useTransactionStore } from '@/stores/transaction'
import { useAuthStore } from '@/stores/auth'
import { useFormValidation } from '@/utils/useFormValidation'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

// COMPONENTES
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelectWithSearchAndCreate from '@/components/ui/BaseSelectWithSearchAndCreate.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const router = useRouter()
const authStore = useAuthStore()
const transactionStore = useTransactionStore()
const { errors, handleAxiosError, getError, clearError } = useFormValidation()

// --- ESTADO ---
const currentStep = ref(1)
const totalSteps = 3
const isSubmitting = ref(false)

// Tipos: 'purchase' | 'exchange' | 'currency_change'
const operationType = ref('purchase')
const isAutoCalculating = ref(false)
const lastEdited = ref('')

const form = reactive({
  client_id: '',
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
  amount_received: '',

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
  paid: true,
})

// --- FUNCIÓN DE RECARGA EN TIEMPO REAL ---
const handleDataReload = async () => {
  await transactionStore.fetchAllSupportData()
}

// --- HELPERS DE EDICIÓN ---
const onEditSent = () => (lastEdited.value = 'sent')
const onEditReceived = () => (lastEdited.value = 'received')
const onEditRate = () => (lastEdited.value = 'rate')

// --- COMPUTED HELPERS ---
const selectedInvestor = computed(() =>
  transactionStore.getInvestors.find((i) => i.id == form.investor_id),
)

const isComplexExchange = computed(() => operationType.value === 'currency_change')
const sourceAccounts = computed(() => transactionStore.getAccounts)
const destinationAccounts = computed(() => transactionStore.getAccounts)

const fromAccount = computed(() =>
  transactionStore.getAccounts.find((a) => a.id == form.from_account_id),
)
const toAccount = computed(() =>
  transactionStore.getAccounts.find((a) => a.id == form.to_account_id),
)
const selectedPlatform = computed(() =>
  transactionStore.getPlatforms.find((p) => p.id == form.platform_id),
)
const selectedProvider = computed(() =>
  transactionStore.getProviders.find((p) => p.id == form.provider_id),
)
const selectedBroker = computed(() =>
  transactionStore.getBrokers.find((b) => b.id == form.broker_id),
)

const sourceName = computed(() => {
  if (form.capital_type === 'investor') {
    if (!selectedInvestor.value) return 'Seleccione Inversionista'
    const balance = parseFloat(selectedInvestor.value.current_balance || 0)
    return `${selectedInvestor.value.name} (Disp: $${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })})`
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

const hasSufficientBalance = computed(() => {
  if (!form.paid && form.capital_type === 'own') return true

  if (form.capital_type === 'own') {
    if (!fromAccount.value || !form.amount_sent) return true
    const rawAccount = transactionStore.rawAccounts?.find((a) => a.id == form.from_account_id)
    return rawAccount ? parseFloat(rawAccount.balance) >= parseFloat(form.amount_sent) : true
  }
  if (form.capital_type === 'investor') {
    if (!selectedInvestor.value || !form.amount_sent) return true
    const investorBal = parseFloat(selectedInvestor.value.current_balance || 0)
    const amountToSend = parseFloat(form.amount_sent)
    return investorBal >= amountToSend
  }
  return true
})

const exchangePercentage = computed(() => {
  const sent = parseFloat(form.amount_sent) || 0
  const received = parseFloat(form.amount_received) || 0
  if (sent === 0) return '0.00'
  const pct = ((received - sent) / sent) * 100
  return pct.toFixed(2)
})

// --- LÓGICA MATEMÁTICA ---

watch([() => form.buy_rate, () => form.received_rate], ([buy, received]) => {
  if (operationType.value === 'purchase' && !isAutoCalculating.value) {
    const b = parseFloat(buy) || 0
    const r = parseFloat(received) || 0
    if (b > 0 && r > 0) {
      isAutoCalculating.value = true
      const pct = ((r - b) / r) * 100
      form.commission_charged_pct = pct.toFixed(2)
      calculateAmounts()
      setTimeout(() => (isAutoCalculating.value = false), 0)
    }
  }
})

watch(
  () => form.commission_charged_pct,
  (newPct) => {
    if (operationType.value === 'purchase' && !isAutoCalculating.value) {
      const pct = parseFloat(newPct) || 0
      const r = parseFloat(form.received_rate) || 0
      if (r > 0) {
        isAutoCalculating.value = true
        const newBuyRate = r * (1 - pct / 100)
        form.buy_rate = newBuyRate.toFixed(2)
        calculateAmounts()
        setTimeout(() => (isAutoCalculating.value = false), 0)
      }
    }
  },
)

// WATCH PRINCIPAL DE CÁLCULO
watch(
  [
    () => form.amount_sent,
    () => form.amount_received,
    () => form.exchange_rate,
    () => form.buy_rate,
    () => form.received_rate,
    () => form.commission_charged_pct,
    () => form.commission_provider_pct,
    () => form.commission_broker_pct,
    () => form.commission_admin_pct,
    () => form.investor_profit_pct,
    () => form.capital_type,
    operationType,
  ],
  ([
    sent,
    received,
    rate,
    buyRate,
    receivedRate,
    pctCharged,
    pctProvider,
    pctBroker,
    pctAdmin,
    pctInvestor,
    capitalType,
    type,
  ]) => {
    if (isAutoCalculating.value) return

    if (type === 'purchase') {
      const r = parseFloat(received) || 0
      const bRate = parseFloat(buyRate) || 0
      if (r > 0 && bRate > 0) {
        const calculatedSent = (r * bRate).toFixed(2)
        if (form.amount_sent !== calculatedSent) {
          form.amount_sent = calculatedSent
        }
      }
      calculateCommissions()

    } else if (type === 'exchange') {
      const s = parseFloat(sent) || 0
      const r = parseFloat(received) || 0
      const exRate = parseFloat(rate) || 0

      const currencyFrom = sourceCurrency.value
      const currencyTo = toAccount.value?.currency_code

      if (exRate > 0) {
        if ((lastEdited.value === 'sent' || lastEdited.value === 'rate') && s > 0) {
          isAutoCalculating.value = true
          if (currencyFrom === 'VES' && currencyTo === 'USD') {
            form.amount_received = (s / exRate).toFixed(2)
          } else {
            form.amount_received = (s * exRate).toFixed(2)
          }
          setTimeout(() => (isAutoCalculating.value = false), 0)
        }
        else if (lastEdited.value === 'received' && r > 0) {
          isAutoCalculating.value = true
          if (currencyFrom === 'VES' && currencyTo === 'USD') {
            form.amount_sent = (r * exRate).toFixed(2)
          } else {
            form.amount_sent = (r / exRate).toFixed(2)
          }
          setTimeout(() => (isAutoCalculating.value = false), 0)
        }
      }
      calculateCommissions()
    } else {
      const r = parseFloat(received) || 0
      if (r >= 0) form.amount_sent = r
      calculateCommissions()
    }
  },
)

function calculateCommissions() {
  let commissionBase = 0

  if (['purchase', 'currency_change'].includes(operationType.value)) {
    commissionBase = parseFloat(form.amount_received) || 0
  } else {
    commissionBase = parseFloat(form.amount_sent) || 0
  }

  if (commissionBase > 0) {
    let grossPct = parseFloat(form.commission_charged_pct)
    if (isNaN(grossPct) || grossPct === 0) {
      const r = parseFloat(form.received_rate) || 0
      const b = parseFloat(form.buy_rate) || 0
      if (r > 0) grossPct = ((r - b) / r) * 100
      else grossPct = 0
      form.commission_charged_pct = grossPct
    }

    const grossAmount = commissionBase * (grossPct / 100)
    form.commission_charged_amount = grossAmount

    const provInput = parseFloat(form.commission_provider_pct) || 0
    const brokerInput = parseFloat(form.commission_broker_pct) || 0
    const adminInput = parseFloat(form.commission_admin_pct) || 0
    const investorInput = parseFloat(form.investor_profit_pct) || 0

    const provAmountDesired = commissionBase * (provInput / 100)
    const brokerAmountDesired = commissionBase * (brokerInput / 100)
    const adminAmountDesired = commissionBase * (adminInput / 100)
    const investorAmountDesired = commissionBase * (investorInput / 100)

    form.commission_provider_amount = provAmountDesired
    form.commission_broker_amount = brokerAmountDesired

    if (isComplexExchange.value || operationType.value === 'exchange') {
      form.commission_admin_amount = adminAmountDesired
    } else {
      form.commission_admin_amount = 0
    }

    if (form.capital_type === 'investor') {
      form.investor_profit_amount = investorAmountDesired
    } else {
      form.investor_profit_amount = 0
    }

    const totalDeductions =
      form.commission_provider_amount +
      form.commission_broker_amount +
      form.commission_admin_amount +
      form.investor_profit_amount

    form.commission_net_profit = grossAmount - totalDeductions
    form.commission_net_after_investor = form.commission_net_profit
  } else {
    resetCommissions()
  }
}

function calculateAmounts() {
  calculateCommissions()
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
  form.amount_received = ''
  form.exchange_rate = ''
  form.buy_rate = ''
  form.received_rate = ''
  form.provider_id = ''
  form.platform_id = ''
  form.commission_charged_pct = 0
  form.commission_provider_pct = 0
  form.commission_admin_pct = 0
  form.commission_broker_pct = 0
  Object.keys(errors.value).forEach(key => clearError(key))
  resetCommissions()
})

onMounted(async () => {
  await transactionStore.fetchAllSupportData()
})

// --- NAVEGACIÓN Y CONFIRMACIÓN ---
const nextStep = () => {
  if (currentStep.value === 1) {
    const isExternalCapital = ['investor'].includes(form.capital_type)
    const missingFrom = isExternalCapital ? false : !form.from_account_id
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
      return Swal.fire('Falta Datos', 'Ingrese ambas tasas (Compra y Mercado).', 'warning')
  }

  isSubmitting.value = true
  try {
    let payload = { ...form }

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
      payload.delivered = form.delivered
      payload.paid = form.paid
    } else if (operationType.value === 'exchange') {
      payload.operation_type = 'exchange'
      payload.buy_rate = null
      payload.received_rate = null
      payload.provider_id = null
      payload.broker_id = null

      const sent = parseFloat(payload.amount_sent) || 0
      const received = parseFloat(payload.amount_received) || 0
      const userRate = parseFloat(payload.exchange_rate) || 0

      if (userRate > 0) {
        payload.exchange_rate = userRate
      } else if (sent > 0 && received > 0) {
        const currencyFrom = sourceCurrency.value
        const currencyTo = toAccount.value?.currency_code

        if (currencyFrom === 'VES' && currencyTo === 'USD') {
          payload.exchange_rate = (sent / received).toFixed(8)
        } else {
          payload.exchange_rate = (received / sent).toFixed(8)
        }
      } else {
        payload.exchange_rate = 1
      }
    } else {
      payload.operation_type = 'purchase'
      payload.exchange_rate = null
      payload.commission_admin_pct = 0
      payload.commission_admin_amount = 0
      payload.delivered = form.delivered
      payload.paid = form.paid
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
    currentStep.value = 1
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
        <div class="type-switcher-container">
          <div class="type-switcher">
            <button :class="{ active: operationType === 'purchase' }" @click="operationType = 'purchase'">
              Compra
            </button>
            <button :class="{ active: operationType === 'exchange' }" @click="operationType = 'exchange'">
              Intercambio
            </button>
            <button :class="{ active: operationType === 'currency_change' }" @click="operationType = 'currency_change'">
              Divisa
            </button>
          </div>
        </div>
      </div>

      <div class="progress-bar" :style="{ width: (currentStep / totalSteps) * 100 + '%' }"></div>

      <div class="form-body">
        <div v-if="currentStep === 1" class="step-content fade-in">
          <div class="grid-2">

            <BaseSelectWithSearchAndCreate label="Cliente *" :options="transactionStore.getClients"
              v-model="form.client_id" required create-endpoint="/clients" :create-fields="{ name: '' }"
              create-label="Cliente" @saved="handleDataReload" :error="getError('client_id')"
              @update:modelValue="clearError('client_id')" />

            <div class="col-span-2">
              <label class="small-label">Fuente de Fondos</label>
              <div class="type-switcher" style="margin-top: 8px">
                <button :class="{ active: form.capital_type === 'own' }" @click="form.capital_type = 'own'">
                  Propio
                </button>
              </div>
            </div>

            <div v-if="form.capital_type === 'investor'" class="col-span-2">
              <BaseSelectWithSearchAndCreate label="Inversionista *" :options="transactionStore.getInvestors"
                v-model="form.investor_id" required create-endpoint="/investors" :create-fields="{ name: '' }"
                create-label="Inversionista" @saved="handleDataReload" :error="getError('investor_id')"
                @update:modelValue="clearError('investor_id')" />
            </div>

            <div v-if="operationType === 'exchange'">
              <BaseSelectWithSearchAndCreate label="Admin (Plataforma) *" :options="transactionStore.getPlatforms"
                v-model="form.platform_id" required create-endpoint="/platforms" :create-fields="{ name: '' }"
                create-label="Plataforma" @saved="handleDataReload" :error="getError('platform_id')"
                @update:modelValue="clearError('platform_id')" />
            </div>

            <template v-if="operationType !== 'exchange'">
              <BaseSelectWithSearchAndCreate label="Corredor (Opcional)" :options="transactionStore.getBrokers"
                v-model="form.broker_id" create-endpoint="/brokers" :create-fields="{ name: '' }"
                create-label="Corredor" @saved="handleDataReload" :error="getError('broker_id')" />

              <div class="grid-2-nested col-span-2">
                <BaseSelectWithSearchAndCreate label="Proveedor (Liquidez)" :options="transactionStore.getProviders"
                  v-model="form.provider_id" :required="isComplexExchange" create-endpoint="/providers"
                  :create-fields="{ name: '' }" create-label="Proveedor" @saved="handleDataReload"
                  :error="getError('provider_id')" @update:modelValue="clearError('provider_id')" />

                <BaseSelectWithSearchAndCreate v-if="isComplexExchange" label="Plataforma / Admin"
                  :options="transactionStore.getPlatforms" v-model="form.platform_id" :required="isComplexExchange"
                  create-endpoint="/platforms" :create-fields="{ name: '' }" create-label="Plataforma"
                  @saved="handleDataReload" :error="getError('platform_id')"
                  @update:modelValue="clearError('platform_id')" />
              </div>
              <div class="divider col-span-2"></div>
            </template>

            <template v-if="form.capital_type === 'own'">
              <BaseSelectWithSearchAndCreate label="Cuenta Origen (Sale) *" :options="sourceAccounts"
                v-model="form.from_account_id" required create-endpoint="/accounts" :create-fields="{ name: '' }"
                create-label="Cuenta" @saved="handleDataReload" :error="getError('from_account_id')"
                @update:modelValue="clearError('from_account_id')" />
            </template>
            <template v-else>
              <div class="input-group">
                <label>Fuente</label>
                <input type="text" class="big-input readonly" :value="sourceName" readonly />
              </div>
            </template>

            <BaseSelectWithSearchAndCreate label="Cuenta Destino (Entra) *" :options="destinationAccounts"
              v-model="form.to_account_id" required create-endpoint="/accounts" :create-fields="{ name: '' }"
              create-label="Cuenta" @saved="handleDataReload" :error="getError('to_account_id')"
              @update:modelValue="clearError('to_account_id')" />
          </div>
        </div>

        <div v-if="currentStep === 2" class="step-content fade-in">
          <div class="calc-panel">
            <div class="calc-row">
              <div class="input-group">
                <label v-if="operationType === 'purchase' || isComplexExchange">Monto Recibido (USD)</label>
                <label v-else>Monto Enviado ({{ sourceCurrency }})</label>

                <input v-if="operationType === 'purchase' || isComplexExchange" type="number"
                  v-model="form.amount_received" @input="onEditReceived" placeholder="0.00" class="big-input" />

                <input v-else type="number" v-model="form.amount_sent" @input="onEditSent" placeholder="0.00"
                  class="big-input" />
              </div>

              <div class="operator">
                <span v-if="
                  operationType === 'exchange' &&
                  sourceCurrency === 'VES' &&
                  toAccount?.currency_code === 'USD'
                ">÷</span>
                <span v-else-if="operationType === 'exchange'">×</span>
                <span v-else>×</span>
              </div>

              <div v-if="operationType === 'exchange'" class="operator">
                <FontAwesomeIcon icon="fa-solid fa-arrow-right" />
              </div>

              <div class="rate-inputs-container">
                <div v-if="operationType === 'purchase'" class="grid-2-rates">
                  <div class="input-group">
                    <label>Tasa Compra (Costo)</label>
                    <input type="number" v-model="form.buy_rate" placeholder="250" class="big-input rate-input" />
                  </div>
                  <div class="input-group">
                    <label>Tasa Mercado Real</label>
                    <input type="number" v-model="form.received_rate" placeholder="300" class="big-input rate-input" />
                  </div>
                </div>

                <div v-else-if="operationType === 'exchange'" class="input-group full-width-rate"
                  style="position: relative">
                  <label>Tasa (Opcional)</label>
                  <input type="number" v-model="form.exchange_rate" @input="onEditRate" placeholder="Auto"
                    class="big-input rate-input" />

                  <div v-if="form.amount_sent > 0 && form.amount_received > 0" style="
                      position: absolute;
                      right: 0;
                      top: 0;
                      font-size: 0.75rem;
                      font-weight: bold;
                    " :style="{ color: parseFloat(exchangePercentage) >= 0 ? '#0ecb81' : '#f6465d' }">
                    {{ exchangePercentage }}%
                  </div>
                </div>

                <div v-else class="input-group full-width-rate">
                  <label>Tasa</label>
                  <input type="number" v-model="form.exchange_rate" placeholder="1.00" class="big-input rate-input" />
                </div>
              </div>

              <div v-if="operationType !== 'exchange'" class="operator">=</div>

              <div class="input-group">
                <label v-if="operationType === 'purchase'">Monto Enviado (BS)</label>
                <label v-else>Monto Recibido</label>

                <input v-if="operationType === 'purchase'" type="number" v-model="form.amount_sent" placeholder="0.00"
                  class="big-input" readonly style="background: #1e2023; color: #ccc" />

                <input v-else-if="operationType === 'exchange'" type="number" v-model="form.amount_received"
                  @input="onEditReceived" placeholder="0.00" class="big-input" />

                <input v-else type="text" :value="form.amount_received" readonly class="big-input readonly" />
              </div>
            </div>

            <p v-if="!hasSufficientBalance" class="error-txt">
              Saldo insuficiente en
              <span v-if="form.capital_type === 'own'">{{ fromAccount?.name }}</span>
              <span v-else-if="form.capital_type === 'investor'">{{ selectedInvestor?.name }}</span>
            </p>

            <div v-if="operationType === 'purchase' || isComplexExchange" class="delivery-check-group">

              <div class="check-item">
                <label class="checkbox-wrapper">
                  <input type="checkbox" v-model="form.delivered" />
                  <span class="checkmark"></span>
                  <div class="check-text">
                    <span class="title">Entregar Inmediatamente</span>
                    <small v-if="!form.delivered" class="text-warning">Estado: POR COBRAR</small>
                  </div>
                </label>
              </div>

              <div class="check-item">
                <label class="checkbox-wrapper">
                  <input type="checkbox" v-model="form.paid" />
                  <span class="checkmark"></span>
                  <div class="check-text">
                    <span class="title">Pagado Inmediatamente</span>
                    <small v-if="!form.paid" class="text-danger">Estado: POR PAGAR</small>
                  </div>
                </label>
              </div>

            </div>
          </div>

          <div v-if="operationType !== 'exchange'" class="commissions-panel">
            <div class="panel-header-flex">
              <h4>
                {{
                  operationType === 'purchase'
                    ? 'Rentabilidad (Spread)'
                    : 'Rentabilidad Cambio Divisa'
                }}
              </h4>
            </div>

            <div class="commissions-grid grid-3">
              <div class="comm-card income">
                <label>{{
                  operationType === 'purchase' ? 'Ganancia Bruta (%)' : 'Comisión (%)'
                  }}</label>
                <div class="pct-input-wrapper">
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

              <div class="comm-card expense">
                <label>Costo Corredor (%)</label>
                <div class="pct-input-wrapper">
                  <input type="number" v-model="form.commission_broker_pct" placeholder="0" />
                  <span>%</span>
                </div>
                <div class="calc-result text-danger">- {{ form.commission_broker_amount }}</div>
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
            </div>

            <div class="total-profit-bar">
              <span>Utilidad Real (Neta):</span>
              <strong :class="form.commission_net_after_investor >= 0 ? 'text-success' : 'text-danger'">
                {{ form.commission_net_after_investor }} {{ commissionCurrency }}
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

              <div class="row" v-if="form.broker_id">
                <span>Corredor</span>
                <span>{{
                  transactionStore.getBrokers.find((b) => b.id == form.broker_id)?.name
                  }}</span>
              </div>

              <div class="row" v-if="form.provider_id">
                <span>Proveedor</span>
                <span>{{ selectedProvider?.name }}</span>
              </div>

              <div class="divider"></div>

              <div class="row highlight">
                <span>Monto Enviado ({{ sourceName }})</span>
                <span class="text-danger">- {{ form.amount_sent }} {{ sourceCurrency }}</span>
              </div>

              <div class="row highlight">
                <span>Monto Recibido ({{ toAccount?.name }})</span>
                <span class="text-success">+ {{ form.amount_received }} {{ toAccount?.currency_code }}</span>
              </div>

              <div v-if="operationType === 'purchase'" class="row">
                <span>Tasa Compra</span>
                <span>{{ form.buy_rate }}</span>
              </div>
              <div v-if="operationType === 'purchase'" class="row">
                <span>Tasa Mercado</span>
                <span>{{ form.received_rate }}</span>
              </div>

              <template v-if="operationType !== 'exchange'">
                <div class="divider"></div>
                <div class="row" v-if="form.commission_provider_amount > 0">
                  <span>Pago Proveedor (Estimado)</span>
                  <span class="text-danger">- {{ form.commission_provider_amount }}</span>
                </div>
                <div class="row" v-if="form.commission_broker_amount > 0">
                  <span>Pago Corredor</span>
                  <span class="text-danger">- {{ form.commission_broker_amount }}</span>
                </div>
                <div class="row" v-if="form.commission_admin_amount > 0">
                  <span>Pago Plataforma</span>
                  <span class="text-danger">- {{ form.commission_admin_amount }}</span>
                </div>
                <div class="row" v-if="form.investor_profit_amount > 0">
                  <span>Pago Inversionista</span>
                  <span class="text-danger">- {{ form.investor_profit_amount }}</span>
                </div>

                <div class="row total">
                  <span>Utilidad Real</span>
                  <span :class="form.commission_net_after_investor >= 0 ? 'text-success' : 'text-danger'
                    ">
                    {{ form.commission_net_after_investor }} {{ commissionCurrency }}
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
        <button v-if="currentStep === totalSteps" @click="handleConfirm" class="btn-success" :disabled="isSubmitting">
          {{ isSubmitting ? 'Procesando...' : 'Confirmar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.form-body {
  padding: 25px;
  flex-grow: 1;
}

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

.form-header {
  padding: 20px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  /* Permite wrap en móvil */
  gap: 15px;
}

.type-switcher {
  display: flex;
  background: var(--color-background);
  padding: 4px;
  border-radius: 8px;
  gap: 5px;
  flex-wrap: wrap;
  /* Wrap en botones si es necesario */
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
  white-space: nowrap;
  /* Evita que el texto del botón se parta */
}

.type-switcher button.active {
  background: var(--color-primary);
  color: #111;
}

.form-footer {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--color-border);
  margin-top: auto;
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
  box-sizing: border-box;
  /* Importante para que padding no rompa width */
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
  text-align: center;
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

.delivery-check-group {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.check-item {
  flex: 1;
  min-width: 200px;
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

.checkbox-wrapper input:checked~.checkmark {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.checkbox-wrapper input:checked~.checkmark::after {
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
  margin-top: 2px;
  font-weight: bold;
}

.text-warning {
  color: #f39c12;
}

.text-danger {
  color: #e74c3c;
}

/* ==========================================================================
   MEDIA QUERIES PARA MÓVILES (<768px)
   ========================================================================== */
@media (max-width: 768px) {

  /* 1. Reducir padding lateral para ganar espacio */
  .page-wrapper {
    padding: 10px;
  }

  .form-card {
    min-height: auto;
    /* Altura automática en móvil */
  }

  .form-header {
    flex-direction: column;
    /* Título arriba, botones abajo */
    align-items: flex-start;
    gap: 15px;
  }

  .type-switcher-container {
    width: 100%;
    overflow-x: auto;
    /* Permitir scroll si los botones no caben */
  }

  .type-switcher {
    width: 100%;
    justify-content: space-between;
    /* Botones ocupan todo el ancho */
  }

  .type-switcher button {
    flex: 1;
    /* Distribución equitativa */
    padding: 10px 5px;
    /* Más área táctil */
    font-size: 0.85rem;
  }

  /* 2. Colapsar Grillas a 1 Columna */
  .grid-2,
  .grid-2-nested,
  .grid-3 {
    grid-template-columns: 1fr !important;
    /* Fuerza 1 sola columna */
    gap: 15px;
  }

  .col-span-2 {
    grid-column: span 1 !important;
    /* Ya no expande 2 columnas porque solo hay 1 */
  }

  /* 3. Panel de Calculadora en Columna */
  .calc-row {
    flex-direction: column;
    /* Apilar inputs verticalmente */
    align-items: stretch;
    /* Estirar inputs al 100% */
    gap: 10px;
  }

  .operator {
    display: none;
    /* Ocultar operadores matemáticos en móvil para limpiar la vista */
  }

  /* Ajustar grid interno de tasas */
  .grid-2-rates {
    grid-template-columns: 1fr;
    /* Tasas una debajo de otra */
  }

  .big-input {
    font-size: 1.1rem;
    /* Texto un poco más pequeño */
    padding: 10px;
  }

  /* 4. Footer de Botones */
  .form-footer {
    padding: 15px;
    flex-direction: column-reverse;
    /* Botón 'Siguiente' arriba */
    gap: 10px;
  }

  .form-footer button {
    width: 100%;
    /* Botones ancho completo */
    justify-content: center;
    padding: 12px;
  }

  /* Ajuste de checks */
  .delivery-check-group {
    flex-direction: column;
    gap: 15px;
  }
}
</style>