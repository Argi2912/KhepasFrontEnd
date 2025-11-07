<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useTransactionStore } from '@/stores/transaction'
import { useAuthStore } from '@/stores/auth'
import { useFormValidation } from '@/utils/useFormValidation'
import api from '@/services/api'
import notify from '@/services/notify'
import { useRouter } from 'vue-router'

import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import FormWizard from '@/components/shared/FormWizard.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const router = useRouter()
const authStore = useAuthStore()
const transactionStore = useTransactionStore()
const { errors, handleAxiosError, getError, clearError } = useFormValidation()

// --- ESTADO DEL WIZARD ---
const currentStep = ref(0)
const isSubmitting = ref(false)
const localCurrencyCode = 'VES' // Moneda local que recibimos

// --- ESTADO DEL FORMULARIO ---
const form = reactive({
  client_id: null,
  broker_id: null,
  provider_id: null,
  admin_user_id: authStore.authUser?.id,
  from_account_id: null, // 🚨 NUEVO: Cuenta en VES para recibir pago
  to_account_id: null, // 🚨 NUEVO: Cuenta en divisa para entregar
  amount_to_deliver: 0.0, // 🚨 NUEVO: Monto que el cliente quiere comprar
  buy_rate: 0.0,
  received_rate: 0.0,
  commission_charged_pct: 0.0,
  commission_provider_pct: 0.0,
})

// --- LÓGICA DE DATOS ---
const selectedBroker = computed(() =>
  transactionStore.getBrokers.find((b) => b.id == form.broker_id),
)
const toAccount = computed(() => transactionStore.accounts.find((a) => a.id == form.to_account_id))

// Cuentas en VES (Origen)
const fromAccountOptions = computed(() =>
  transactionStore.getAccounts.filter((a) => a.currency_code === localCurrencyCode),
)
// Cuentas en Divisas (Destino)
const toAccountOptions = computed(() =>
  transactionStore.getAccounts.filter((a) => a.currency_code !== localCurrencyCode),
)

// --- CÁLCULOS AUTOMÁTICOS ---
const deliverCurrency = computed(() => toAccount.value?.currency_code || null)
const marketRate = computed(() =>
  transactionStore.findRate(deliverCurrency.value, localCurrencyCode),
)

// 🚨 Monto a pagar en moneda local (VES)
const amountToPayInLocal = computed(() => {
  if (form.amount_to_deliver <= 0 || form.received_rate <= 0) return 0
  return form.amount_to_deliver * form.received_rate
})

const commissionChargedAmount = computed(
  () => (form.amount_to_deliver * form.commission_charged_pct) / 100,
)
const commissionProviderAmount = computed(
  () => (form.amount_to_deliver * form.commission_provider_pct) / 100,
)
const totalDebitedFromPlatform = computed(
  () => form.amount_to_deliver + commissionProviderAmount.value,
)

// --- VALIDACIÓN DE SALDO ---
const amountError = computed(() => {
  if (toAccount.value && totalDebitedFromPlatform.value > toAccount.value.balance) {
    return `El monto total a debitar (${formatCurrency(totalDebitedFromPlatform.value, deliverCurrency.value)}) supera el saldo.`
  }
  return null
})

// --- WATCHERS ---
watch(selectedBroker, (broker) => {
  if (broker) form.commission_charged_pct = broker.commission
})

watch(marketRate, (rate) => {
  if (rate && rate > 0 && form.buy_rate === 0) {
    form.buy_rate = parseFloat((rate * 0.99).toFixed(4))
    form.received_rate = parseFloat((rate * 1.01).toFixed(4))
  }
})

watch(
  () => form.to_account_id,
  () => {
    form.buy_rate = 0
    form.received_rate = 0
  },
)

// --- NAVEGACIÓN Y ENVÍO ---
const validateStep = (step) => {
  clearError()
  if (step === 0 && !form.client_id) {
    notify.error('Debe seleccionar un cliente.')
    return false
  }
  if (step === 1) {
    if (!form.from_account_id || !form.to_account_id) {
      notify.error('Debe seleccionar ambas cuentas.')
      return false
    }
    if (form.amount_to_deliver <= 0) {
      notify.error('El monto a comprar debe ser mayor a cero.')
      return false
    }
    if (form.buy_rate <= 0 || form.received_rate <= 0) {
      notify.error('Las tasas deben ser mayores a cero.')
      return false
    }
    if (form.buy_rate >= form.received_rate) {
      notify.error('La tasa de compra no puede ser mayor o igual a la de venta.')
      return false
    }
    if (amountError.value) {
      notify.error(amountError.value)
      return false
    }
  }
  return true
}

const goToNextStep = () => {
  if (validateStep(currentStep.value)) currentStep.value++
}

const handleSubmit = async () => {
  if (!validateStep(1) || isSubmitting.value || amountError.value) {
    notify.error('Revise los campos, hay errores.')
    return
  }
  isSubmitting.value = true

  // Adaptar el payload al backend (DollarPurchaseController)
  const payload = {
    ...form,
    platform_account_id: form.to_account_id, // La cuenta de origen de la divisa
    amount_received: amountToPayInLocal.value, // El monto en VES
    deliver_currency_code: deliverCurrency.value,
  }

  try {
    await api.post('/transactions/dollar-purchase', payload)
    notify.success('Compra de divisa registrada.')
    router.push({ name: 'transactions_home' })
  } catch (error) {
    handleAxiosError(error)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => transactionStore.fetchAllSupportData())

// Helper de formato
const formatCurrency = (value, currency) => {
  if (value == null || !currency) return '...'
  const code = currency === 'USDT' ? 'USD' : currency
  try {
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: code }).format(value)
  } catch (e) {
    return `${currency} ${value}`
  }
}
</script>

<template>
  <div class="transaction-form-view">
    <FormWizard :title="'Registro de Compra de Divisa (Ej: VES a USD)'" v-model="currentStep">
      <template #step-0>
        <h2 class="step-title">1. Partes Involucradas</h2>
        <div class="form-grid">
          <BaseSelect
            v-model="form.client_id"
            label="Cliente"
            :options="transactionStore.getClients"
            required
          />
          <BaseSelect
            v-model="form.broker_id"
            label="Corredor (Broker)"
            :options="transactionStore.getBrokers"
            placeholder="Opcional"
          />
          <BaseSelect
            v-model="form.provider_id"
            label="Proveedor"
            :options="transactionStore.getProviders"
            placeholder="Opcional"
          />
        </div>
      </template>

      <template #step-1>
        <h2 class="step-title">2. Operación y Resumen</h2>
        <div class="form-grid-col2">
          <BaseSelect
            v-model="form.from_account_id"
            :label="`Cuenta Origen (Cliente Paga en ${localCurrencyCode})`"
            :options="fromAccountOptions"
            required
          />
          <BaseSelect
            v-model="form.to_account_id"
            label="Cuenta Destino (Plataforma Entrega)"
            :options="toAccountOptions"
            required
            :error="amountError"
          />
        </div>

        <h2 class="step-title section-title">Cálculos</h2>
        <div class="form-grid-col3">
          <BaseInput
            v-model.number="form.amount_to_deliver"
            :label="`Monto a Comprar (${deliverCurrency || 'Divisa'})`"
            type="number"
            step="0.01"
            required
          />
          <BaseInput
            v-model.number="form.buy_rate"
            :label="`Tasa de Compra (Costo)`"
            type="number"
            step="0.0001"
            required
          />
          <BaseInput
            v-model.number="form.received_rate"
            :label="`Tasa de Venta (Cliente)`"
            type="number"
            step="0.0001"
            required
          />
        </div>

        <h2 class="step-title section-title">Comisiones (Sobre Monto a Comprar)</h2>
        <div class="form-grid-col2">
          <BaseInput
            v-model.number="form.commission_charged_pct"
            label="Comisión Empresa (%)"
            type="number"
            step="0.01"
          />
          <BaseInput
            v-model.number="form.commission_provider_pct"
            label="Comisión Proveedor (%)"
            type="number"
            step="0.01"
          />
        </div>

        <div class="summary-box">
          <h2 class="step-title section-title">Resumen Final</h2>
          <div class="summary-grid">
            <div class="summary-card">
              <h4><FontAwesomeIcon icon="fa-solid fa-arrow-up" /> Cliente Paga</h4>
              <div class="summary-total debit">
                <span>Total a Pagar ({{ localCurrencyCode }}):</span>
                <strong>{{ formatCurrency(amountToPayInLocal, localCurrencyCode) }}</strong>
              </div>
            </div>
            <div class="summary-card">
              <h4><FontAwesomeIcon icon="fa-solid fa-arrow-down" /> Cliente Recibe</h4>
              <div class="summary-total credit">
                <span>Neto a Recibir ({{ deliverCurrency }}):</span>
                <strong>{{
                  formatCurrency(amountToDeliver - commissionChargedAmount, deliverCurrency)
                }}</strong>
              </div>
            </div>
          </div>
          <div v-if="amountError" class="error-box">
            <FontAwesomeIcon icon="fa-solid fa-exclamation-triangle" /> {{ amountError }}
          </div>
        </div>
      </template>

      <template #footer>
        <div class="wizard-nav">
          <button
            type="button"
            @click="currentStep--"
            :disabled="currentStep === 0"
            class="btn-prev"
          >
            Anterior
          </button>
          <button type="button" @click="goToNextStep" v-if="currentStep < 1" class="btn-next">
            Siguiente
          </button>
          <button
            type="button"
            @click="handleSubmit"
            v-if="currentStep === 1"
            :disabled="isSubmitting || amountError"
            class="btn-finish"
          >
            {{ isSubmitting ? 'Procesando...' : 'Finalizar Compra' }}
          </button>
        </div>
      </template>
    </FormWizard>
  </div>
</template>

<style scoped>
/* Estilos del Wizard (Comunes para ambos formularios) */
.step-title {
  font-size: 1.3rem;
  color: var(--color-text-light);
}
.step-subtitle {
  opacity: 0.8;
  margin-bottom: 30px;
}
.section-title {
  margin-top: 30px;
  margin-bottom: 15px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}
.form-grid-col2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px 30px;
}
.form-grid-col3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
}
.summary-box {
  margin-top: 20px;
}
.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.summary-card {
  background-color: var(--color-background);
  padding: 20px;
  border-radius: 8px;
}
.summary-card h4 {
  font-size: 1.1rem;
  color: var(--color-primary);
  margin-top: 0;
  margin-bottom: 15px;
}
.summary-line {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
  margin-bottom: 8px;
  opacity: 0.8;
}
.summary-total {
  display: flex;
  justify-content: space-between;
  font-size: 1.1rem;
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid var(--color-border);
}
.summary-total.debit strong {
  color: var(--color-danger);
}
.summary-total.credit strong {
  color: var(--color-success);
}
.error-box {
  margin-top: 20px;
  padding: 15px;
  background-color: #e74c3c20;
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  border-radius: 6px;
  text-align: center;
  font-weight: 500;
}
.wizard-nav {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  gap: 10px;
}
.wizard-nav button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-prev {
  background-color: var(--color-hover);
  color: var(--color-text-light);
}
.btn-next {
  background-color: var(--color-primary);
  color: var(--color-secondary);
}
.btn-finish {
  background-color: var(--color-success);
  color: var(--color-secondary);
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
