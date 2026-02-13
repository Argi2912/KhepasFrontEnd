<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useTransactionStore } from '@/stores/transaction'
import { useAuthStore } from '@/stores/auth'
import { useFormValidation } from '@/utils/useFormValidation'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

// COMPONENTES
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
const lastEditedDivisa = ref('')  // 'commission' | 'amount'
const clientReceivesAmount = ref('') // Monto final que recibe el cliente (Divisa)

const form = reactive({
  client_id: '',
  capital_type: 'own',
  investor_id: '',
  investor_profit_pct: 0,
  investor_profit_amount: 0,
  broker_id: null,   // 🔥 Ajustado a null para facilitar limpieza
  provider_id: null, // 🔥 Ajustado a null
  platform_id: null, // 🔥 Ajustado a null
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

  // Valores calculados (Visuales)
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

// --- FUNCIÓN DE RECARGA EN TIEMPO REAL (Recuperada) ---
const handleDataReload = async () => {
  await transactionStore.fetchAllSupportData()
}

// --- HELPERS DE EDICIÓN ---
const onEditSent = () => (lastEdited.value = 'sent')
const onEditReceived = () => (lastEdited.value = 'received')
const onEditRate = () => (lastEdited.value = 'rate')
const onEditClientReceives = () => (lastEditedDivisa.value = 'amount')

// --- COMPUTED HELPERS (Recuperados) ---
const selectedInvestor = computed(() =>
  transactionStore.getInvestors.find((i) => i.id == form.investor_id),
)

const isComplexExchange = computed(() => operationType.value === 'currency_change')
const sourceAccounts = computed(() => transactionStore.getAccounts || [])
const destinationAccounts = computed(() => transactionStore.getAccounts || [])

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

  const amountToCheck = parseFloat(form.amount_sent) || 0;

  if (form.capital_type === 'own') {
    if (!fromAccount.value || !amountToCheck) return true
    const rawAccount = transactionStore.getAccounts?.find((a) => a.id == form.from_account_id)
    return rawAccount ? parseFloat(rawAccount.balance) >= amountToCheck : true
  }
  if (form.capital_type === 'investor') {
    if (!selectedInvestor.value || !amountToCheck) return true
    const investorBal = parseFloat(selectedInvestor.value.available_balance || selectedInvestor.value.current_balance || 0)
    return investorBal >= amountToCheck
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

// --- LÓGICA MATEMÁTICA (Recuperada) ---

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
      // currency_change
      const r = parseFloat(received) || 0
      calculateCommissions()

      // Recalcular monto cliente si cambió el base y no fue editada manualmente
      if (lastEditedDivisa.value !== 'amount' && r > 0) {
        const pct = parseFloat(form.commission_charged_pct) || 0
        clientReceivesAmount.value = (r - (r * pct / 100)).toFixed(2)
        isAutoCalculating.value = true
        form.amount_sent = clientReceivesAmount.value
        setTimeout(() => (isAutoCalculating.value = false), 0)
      }
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
      if (operationType.value !== 'currency_change') {
        const r = parseFloat(form.received_rate) || 0
        const b = parseFloat(form.buy_rate) || 0
        if (r > 0) grossPct = ((r - b) / r) * 100
        else grossPct = 0
        form.commission_charged_pct = grossPct
      } else {
        grossPct = 0
      }
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

// --- CÁLCULO BIDIRECCIONAL DIVISA ---
watch(() => form.commission_charged_pct, (newPct) => {
  if (operationType.value !== 'currency_change') return
  if (isAutoCalculating.value) return
  if (lastEditedDivisa.value === 'amount') return

  lastEditedDivisa.value = 'commission'
  const base = parseFloat(form.amount_received) || 0
  const pct = parseFloat(newPct) || 0
  if (base > 0) {
    isAutoCalculating.value = true
    clientReceivesAmount.value = (base - (base * pct / 100)).toFixed(2)
    form.amount_sent = clientReceivesAmount.value
    setTimeout(() => {
      isAutoCalculating.value = false
      lastEditedDivisa.value = ''
    }, 0)
  }
})

watch(clientReceivesAmount, (newAmount) => {
  if (operationType.value !== 'currency_change') return
  if (lastEditedDivisa.value !== 'amount') return

  const base = parseFloat(form.amount_received) || 0
  const final = parseFloat(newAmount) || 0
  if (base > 0 && final >= 0) {
    isAutoCalculating.value = true
    const pct = ((base - final) / base) * 100
    form.commission_charged_pct = Math.max(0, pct).toFixed(2)
    form.amount_sent = final
    calculateCommissions()
    setTimeout(() => {
      isAutoCalculating.value = false
      lastEditedDivisa.value = ''
    }, 0)
  }
})

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
  // Reset de formulario al cambiar pestaña
  form.from_account_id = ''
  form.to_account_id = ''
  form.amount_sent = ''
  form.amount_received = ''
  form.exchange_rate = ''
  form.buy_rate = ''
  form.received_rate = ''
  form.provider_id = null  // 🔥 Actualizado a null
  form.platform_id = null  // 🔥 Actualizado a null
  form.broker_id = null    // 🔥 Actualizado a null
  form.commission_charged_pct = 0
  form.commission_provider_pct = 0
  form.commission_admin_pct = 0
  form.commission_broker_pct = 0
  clientReceivesAmount.value = ''
  lastEditedDivisa.value = ''
  Object.keys(errors.value).forEach(key => clearError(key))
  resetCommissions()
})

onMounted(async () => {
  await transactionStore.fetchAllSupportData()
})

// --- NAVEGACIÓN ---
const nextStep = () => {
  if (currentStep.value === 1) {
    const isExternalCapital = ['investor'].includes(form.capital_type)
    const missingFrom = isExternalCapital ? false : !form.from_account_id

    // 🔥 ELIMINADAS LAS RESTRICCIONES DE PLATAFORMA. Solo valida Cliente y Cuentas
    if (missingFrom || !form.to_account_id || !form.client_id) {
      return Swal.fire('Falta información', 'Complete los campos obligatorios (*).', 'warning')
    }
  }
  if (currentStep.value < totalSteps) currentStep.value++
}
const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--
}

// --- CONFIRMACIÓN SEGURA (Backend Authority) ---
const handleConfirm = async () => {
  // 1. Validaciones Previas
  if (!hasSufficientBalance.value) return Swal.fire('Error', 'Saldo insuficiente', 'error')

  // 🔥 ELIMINADAS LAS VALIDACIONES DE PROVEEDOR Y PLATAFORMA OBLIGATORIOS

  if (operationType.value === 'purchase') {
    if (!form.buy_rate || !form.received_rate)
      return Swal.fire('Falta Datos', 'Ingrese ambas tasas (Compra y Mercado).', 'warning')
  }

  isSubmitting.value = true

  try {
    // 2. Construcción del Payload Seguro
    let payload = {
      client_id: form.client_id,
      capital_type: form.capital_type,
      admin_user_id: form.admin_user_id,
      from_account_id: form.capital_type === 'own' ? form.from_account_id : null,
      to_account_id: form.to_account_id,

      investor_id: form.capital_type === 'investor' ? form.investor_id : null,
      investor_profit_pct: form.investor_profit_pct || 0,

      reference_id: form.reference_id,
      delivered: form.delivered,
      paid: form.paid,

      commission_charged_pct: form.commission_charged_pct || 0,
      commission_provider_pct: form.commission_provider_pct || 0,
      commission_broker_pct: form.commission_broker_pct || 0,
      commission_admin_pct: form.commission_admin_pct || 0,

      broker_id: form.broker_id || null,
      provider_id: form.provider_id || null,
      platform_id: form.platform_id || null,
    }

    // 3. Lógica específica por Tipo
    if (operationType.value === 'currency_change') {
      payload.operation_type = 'exchange'
      const amountOut = parseFloat(clientReceivesAmount.value)
      const amountIn = parseFloat(form.amount_received)

      payload.amount_sent = amountOut
      payload.amount_received = amountIn
      payload.exchange_rate = (amountIn > 0 && amountOut > 0) ? (amountIn / amountOut).toFixed(8) : 1
      payload.buy_rate = null
      payload.received_rate = null

    } else if (operationType.value === 'exchange') {
      payload.operation_type = 'exchange'
      payload.amount_sent = form.amount_sent
      payload.amount_received = form.amount_received

      const sent = parseFloat(form.amount_sent) || 0
      const received = parseFloat(form.amount_received) || 0
      const userRate = parseFloat(form.exchange_rate) || 0

      if (userRate > 0) {
        payload.exchange_rate = userRate
      } else if (sent > 0 && received > 0) {
        const fromCurr = fromAccount.value?.currency_code
        const toCurr = toAccount.value?.currency_code
        if (fromCurr === 'VES' && toCurr === 'USD') {
          payload.exchange_rate = (sent / received).toFixed(8)
        } else {
          payload.exchange_rate = (received / sent).toFixed(8)
        }
      } else {
        payload.exchange_rate = 1
      }
      payload.buy_rate = null
      payload.received_rate = null

    } else {
      payload.operation_type = 'purchase'
      payload.amount_sent = form.amount_sent
      payload.amount_received = form.amount_received
      payload.buy_rate = form.buy_rate
      payload.received_rate = form.received_rate
      payload.exchange_rate = form.received_rate
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
    // 🔥 AHORA SÍ LEEMOS LA VARIABLE "error" DEL JSON DEL BACKEND 🔥
    const backendError = error.response?.data?.error;
    const backendMessage = error.response?.data?.message;

    // Priorizamos el detalle específico, si no hay, mostramos el general.
    const finalExplanation = backendError || backendMessage || error.message || 'Ocurrió un error en el servidor.';

    Swal.fire({
      title: 'Operación Rechazada',
      text: finalExplanation,
      icon: 'error',
      confirmButtonColor: '#e74c3c'
    });
  } finally {
    isSubmitting.value = false;
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

            <div v-if="operationType === 'exchange'" style="position: relative;">
              <a href="#" v-if="form.platform_id" @click.prevent="form.platform_id = null"
                class="clear-link">Limpiar</a>
              <BaseSelectWithSearchAndCreate label="Admin / Plataforma (Opcional)"
                :options="transactionStore.getPlatforms" v-model="form.platform_id" create-endpoint="/platforms"
                :create-fields="{ name: '' }" create-label="Plataforma" @saved="handleDataReload"
                :error="getError('platform_id')" @update:modelValue="clearError('platform_id')" />
            </div>

            <template v-if="operationType !== 'exchange'">
              <div class="col-span-2" style="position: relative;">
                <a href="#" v-if="form.broker_id" @click.prevent="form.broker_id = null" class="clear-link">Limpiar</a>
                <BaseSelectWithSearchAndCreate label="Corredor (Opcional)" :options="transactionStore.getBrokers"
                  v-model="form.broker_id" create-endpoint="/brokers" :create-fields="{ name: '' }"
                  create-label="Corredor" @saved="handleDataReload" :error="getError('broker_id')" />
              </div>

              <div class="grid-2-nested col-span-2">
                <div style="position: relative;">
                  <a href="#" v-if="form.provider_id" @click.prevent="form.provider_id = null"
                    class="clear-link">Limpiar</a>
                  <BaseSelectWithSearchAndCreate label="Proveedor Liquidez (Opcional)"
                    :options="transactionStore.getProviders" v-model="form.provider_id" create-endpoint="/providers"
                    :create-fields="{ name: '' }" create-label="Proveedor" @saved="handleDataReload"
                    :error="getError('provider_id')" @update:modelValue="clearError('provider_id')" />
                </div>

                <div v-if="isComplexExchange" style="position: relative;">
                  <a href="#" v-if="form.platform_id" @click.prevent="form.platform_id = null"
                    class="clear-link">Limpiar</a>
                  <BaseSelectWithSearchAndCreate label="Plataforma / Admin (Opcional)"
                    :options="transactionStore.getPlatforms" v-model="form.platform_id" create-endpoint="/platforms"
                    :create-fields="{ name: '' }" create-label="Plataforma" @saved="handleDataReload"
                    :error="getError('platform_id')" @update:modelValue="clearError('platform_id')" />
                </div>
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
                <label v-if="operationType === 'purchase'">Monto Recibido (USD)</label>
                <label v-else-if="isComplexExchange">Monto del Cliente (Recibo)</label>
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
                <span v-else-if="operationType === 'currency_change'">−</span>
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
                  <label>Comisión (%)</label>
                  <div class="pct-input-wrapper-inline">
                    <input type="number" v-model="form.commission_charged_pct" placeholder="0" step="0.01"
                      class="big-input rate-input" />
                    <span class="pct-symbol">%</span>
                  </div>
                </div>
              </div>

              <div v-if="operationType !== 'exchange'" class="operator">=</div>

              <div class="input-group">
                <label v-if="operationType === 'purchase'">Monto Enviado (BS)</label>
                <label v-else>Monto a Entregar al Cliente</label>

                <input v-if="operationType === 'purchase'" type="number" v-model="form.amount_sent" placeholder="0.00"
                  class="big-input" readonly style="background: #1e2023; color: #ccc" />

                <input v-else-if="operationType === 'exchange'" type="number" v-model="form.amount_received"
                  @input="onEditReceived" placeholder="0.00" class="big-input" />

                <input v-else type="number" v-model="clientReceivesAmount" @input="onEditClientReceives"
                  placeholder="0.00" class="big-input" />
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
                <div class="calc-result text-success">+ {{ form.commission_charged_amount.toFixed(2) }}</div>
              </div>

              <div class="comm-card expense">
                <label>Costo Proveedor (%)</label>
                <div class="pct-input-wrapper">
                  <input type="number" v-model="form.commission_provider_pct" placeholder="0" />
                  <span>%</span>
                </div>
                <div class="calc-result text-danger">- {{ form.commission_provider_amount.toFixed(2) }}</div>
              </div>

              <div class="comm-card expense">
                <label>Costo Corredor (%)</label>
                <div class="pct-input-wrapper">
                  <input type="number" v-model="form.commission_broker_pct" placeholder="0" />
                  <span>%</span>
                </div>
                <div class="calc-result text-danger">- {{ form.commission_broker_amount.toFixed(2) }}</div>
              </div>

              <div v-if="isComplexExchange" class="comm-card expense">
                <label>Costo Admin (%)</label>
                <div class="pct-input-wrapper">
                  <input type="number" v-model="form.commission_admin_pct" placeholder="0" />
                  <span>%</span>
                </div>
                <div class="calc-result text-danger">- {{ form.commission_admin_amount.toFixed(2) }}</div>
              </div>

              <div v-if="form.capital_type === 'investor'" class="comm-card expense">
                <label>Porcentaje Inversionista (%)</label>
                <div class="pct-input-wrapper">
                  <input type="number" v-model="form.investor_profit_pct" placeholder="0" />
                  <span>%</span>
                </div>
                <div class="calc-result text-danger">- {{ form.investor_profit_amount.toFixed(2) }}</div>
              </div>
            </div>

            <div class="total-profit-bar">
              <span>Utilidad Real (Neta):</span>
              <strong :class="form.commission_net_after_investor >= 0 ? 'text-success' : 'text-danger'">
                {{ form.commission_net_after_investor.toFixed(2) }} {{ commissionCurrency }}
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
                  <span class="text-danger">- {{ form.commission_provider_amount.toFixed(2) }}</span>
                </div>
                <div class="row" v-if="form.commission_broker_amount > 0">
                  <span>Pago Corredor</span>
                  <span class="text-danger">- {{ form.commission_broker_amount.toFixed(2) }}</span>
                </div>
                <div class="row" v-if="form.commission_admin_amount > 0">
                  <span>Pago Plataforma</span>
                  <span class="text-danger">- {{ form.commission_admin_amount.toFixed(2) }}</span>
                </div>
                <div class="row" v-if="form.investor_profit_amount > 0">
                  <span>Pago Inversionista</span>
                  <span class="text-danger">- {{ form.investor_profit_amount.toFixed(2) }}</span>
                </div>

                <div class="row total">
                  <span>Utilidad Real</span>
                  <span :class="form.commission_net_after_investor >= 0 ? 'text-success' : 'text-danger'
                    ">
                    {{ form.commission_net_after_investor.toFixed(2) }} {{ commissionCurrency }}
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
  gap: 15px;
}

.type-switcher {
  display: flex;
  background: var(--color-background);
  padding: 4px;
  border-radius: 8px;
  gap: 5px;
  flex-wrap: wrap;
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

.pct-input-wrapper-inline {
  position: relative;
  display: flex;
  align-items: center;
}

.pct-input-wrapper-inline input {
  padding-right: 30px;
}

.pct-input-wrapper-inline .pct-symbol {
  position: absolute;
  right: 12px;
  color: #aaa;
  font-weight: bold;
  font-size: 1rem;
  pointer-events: none;
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

/* 🔥 NUEVO ESTILO PARA EL BOTÓN LIMPIAR 🔥 */
.clear-link {
  position: absolute;
  top: 0;
  right: 0;
  color: var(--color-danger);
  font-size: 0.75rem;
  text-decoration: none;
  font-weight: bold;
  z-index: 5;
}

.clear-link:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .page-wrapper {
    padding: 10px;
  }

  .form-card {
    min-height: auto;
  }

  .form-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .type-switcher-container {
    width: 100%;
    overflow-x: auto;
  }

  .type-switcher {
    width: 100%;
    justify-content: space-between;
  }

  .type-switcher button {
    flex: 1;
    padding: 10px 5px;
    font-size: 0.85rem;
  }

  .grid-2,
  .grid-2-nested,
  .grid-3 {
    grid-template-columns: 1fr !important;
    gap: 15px;
  }

  .col-span-2 {
    grid-column: span 1 !important;
  }

  .calc-row {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .operator {
    display: none;
  }

  .grid-2-rates {
    grid-template-columns: 1fr;
  }

  .big-input {
    font-size: 1.1rem;
    padding: 10px;
  }

  .form-footer {
    padding: 15px;
    flex-direction: column-reverse;
    gap: 10px;
  }

  .form-footer button {
    width: 100%;
    justify-content: center;
    padding: 12px;
  }

  .delivery-check-group {
    flex-direction: column;
    gap: 15px;
  }
}
</style>