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

const currentStep = ref(0)
const isSubmitting = ref(false)
const localCurrencyCode = 'VES'

// NUEVO: Entrega física de la divisa
const isDivisaDelivered = ref(true)

const form = reactive({
  client_id: null,
  broker_id: null,
  provider_id: null,
  admin_user_id: authStore.authUser?.id,

  from_account_id: null,
  platform_account_id: null,

  amount_to_deliver: 0.0,

  buy_rate: 0.0,
  received_rate: 0.0,

  commission_charged_pct: 0.0,
  commission_provider_pct: 0.0,

  deliver_currency_code: '',
})

const selectedBroker = computed(() =>
  transactionStore.getBrokers.find((b) => b.id == form.broker_id),
)

const fromAccount = computed(() =>
  transactionStore.accounts.find((a) => a.id == form.from_account_id),
)
const platformAccount = computed(() =>
  transactionStore.accounts.find((a) => a.id == form.platform_account_id),
)

const fromAccountOptions = computed(() =>
  transactionStore.getAccounts.filter((a) => a.currency_code === localCurrencyCode),
)
const platformAccountOptions = computed(() =>
  transactionStore.getAccounts.filter((a) => a.currency_code !== localCurrencyCode),
)

const deliverCurrency = computed(() => platformAccount.value?.currency_code || null)

const ratePair = computed(() => {
  if (!deliverCurrency.value) {
    return { buy_rate: null, received_rate: null }
  }
  return transactionStore.getRatePair(localCurrencyCode, deliverCurrency.value)
})

const baseAmountInVes = computed(() => {
  if (form.amount_to_deliver <= 0 || !form.received_rate) return 0
  return form.amount_to_deliver * form.received_rate
})

const commissionCharged_USD = computed(
  () => (form.amount_to_deliver * form.commission_charged_pct) / 100,
)
const commissionProvider_USD = computed(
  () => (form.amount_to_deliver * form.commission_provider_pct) / 100,
)

const commissionCharged_VES = computed(() => commissionCharged_USD.value * form.received_rate)
const commissionProvider_VES = computed(() => commissionProvider_USD.value * form.received_rate)

const totalVesCredit = computed(() => {
  return baseAmountInVes.value + commissionCharged_VES.value + commissionProvider_VES.value
})

const totalUsdDebit_Platform = computed(() => {
  return parseFloat(form.amount_to_deliver || 0) + commissionProvider_USD.value
})

const platformAccountError = computed(() => {
  if (
    platformAccount.value &&
    totalUsdDebit_Platform.value > 0 &&
    totalUsdDebit_Platform.value > platformAccount.value.balance
  ) {
    return `El débito total (${formatCurrency(totalUsdDebit_Platform.value, deliverCurrency.value)}) supera el saldo de esta cuenta.`
  }
  return null
})

const generalAmountError = computed(() => platformAccountError.value)

watch(selectedBroker, (broker) => {
  if (broker) form.commission_charged_pct = broker.commission || 0
})

watch(ratePair, (rates) => {
  form.buy_rate = rates.buy_rate || 0
  form.received_rate = rates.received_rate || 0
})

watch(platformAccount, (account) => {
  form.deliver_currency_code = account ? account.currency_code : ''
})

const validateStep = (step) => {
  clearError()
  if (step === 0 && !form.client_id) {
    notify.error('Debe seleccionar un cliente.')
    return false
  }

  if (step === 1) {
    if (!form.from_account_id || !form.platform_account_id) {
      notify.error('Debe seleccionar ambas cuentas.')
      return false
    }
    if (!form.buy_rate || !form.received_rate) {
      notify.error('No se encontraron las tasas para este par de divisas.')
      return false
    }
    if (form.buy_rate >= form.received_rate) {
      notify.error('La tasa de compra no puede ser mayor o igual a la de venta.')
      return false
    }
    if (form.amount_to_deliver <= 0) {
      notify.error('El monto a comprar debe ser mayor a cero.')
      return false
    }
    if (generalAmountError.value) {
      notify.error(generalAmountError.value)
      return false
    }
  }
  return true
}

const goToNextStep = () => {
  if (validateStep(currentStep.value)) currentStep.value++
}

const handleSubmit = async () => {
  if (!validateStep(1) || isSubmitting.value || generalAmountError.value) {
    notify.error('Revise los campos, hay errores.')
    return
  }
  isSubmitting.value = true

  const payload = {
    ...form,
    amount_received: baseAmountInVes.value,
    delivered: isDivisaDelivered.value, // ← ESTE ES EL NUEVO CAMPO
  }
  delete payload.amount_to_deliver

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

const formatCurrency = (value, currency) => {
  if (value == null || !currency) return '...'
  const code = currency === 'USDT' ? 'USD' : currency
  try {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: code,
    }).format(value)
  } catch (e) {
    return `${currency} ${value}`
  }
}
</script>

<template>
  <div class="transaction-form-view">
    <FormWizard title="Registro de Compra de Divisa (VES a USD)" v-model="currentStep">
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

        <div class="form-grid-col2 section-title">
          <BaseSelect
            v-model="form.from_account_id"
            :label="`Cuenta Destino (Plataforma Recibe ${localCurrencyCode})`"
            :options="fromAccountOptions"
            required
          />
          <BaseSelect
            v-model="form.platform_account_id"
            label="Cuenta Origen (Plataforma Paga Divisa)"
            :options="platformAccountOptions"
            required
            :error="platformAccountError"
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
          <div class="info-box rate-box">
            <p>Tasa de Compra (Costo)</p>
            <h3 :class="{ 'rate-found': form.buy_rate }">
              {{ form.buy_rate ? form.buy_rate.toFixed(6) : '...' }}
            </h3>
          </div>
          <div class="info-box rate-box">
            <p>Tasa de Venta (Cliente)</p>
            <h3 :class="{ 'rate-found': form.received_rate }">
              {{ form.received_rate ? form.received_rate.toFixed(6) : '...' }}
            </h3>
          </div>
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

        <!-- NUEVO CHECKBOX -->
        <div class="delivery-checkbox-section">
          <label class="checkbox-label">
            <input type="checkbox" v-model="isDivisaDelivered" />
            <span class="checkmark"></span>
            <strong>La divisa fue entregada físicamente al cliente</strong>
          </label>
          <div v-if="!isDivisaDelivered" class="warning-text">
            <FontAwesomeIcon icon="fa-solid fa-exclamation-triangle" />
            La transacción quedará en estado <strong>PENDIENTE DE ENTREGA</strong>
          </div>
        </div>

        <div class="summary-box">
          <h2 class="step-title section-title">Resumen Final (Calculado)</h2>
          <div class="summary-grid">
            <div class="summary-card">
              <h4><FontAwesomeIcon icon="fa-solid fa-arrow-up" /> Plataforma Recibe (VES)</h4>
              <div class="summary-line">
                <span>Monto Base (VES):</span>
                <strong>{{ formatCurrency(baseAmountInVes, localCurrencyCode) }}</strong>
              </div>
              <div class="summary-line com-line">
                <span>Com. Empresa (VES):</span>
                <span>{{ formatCurrency(commissionCharged_VES, localCurrencyCode) }}</span>
              </div>
              <div class="summary-line com-line">
                <span>Com. Proveedor (VES):</span>
                <span>{{ formatCurrency(commissionProvider_VES, localCurrencyCode) }}</span>
              </div>
              <div class="summary-total credit">
                <span>Total a Recibir (VES):</span>
                <strong>{{ formatCurrency(totalVesCredit, localCurrencyCode) }}</strong>
              </div>
            </div>
            <div class="summary-card">
              <h4><FontAwesomeIcon icon="fa-solid fa-arrow-down" /> Plataforma Paga (Divisa)</h4>
              <div class="summary-line">
                <span>Monto Cliente:</span>
                <strong>{{ formatCurrency(form.amount_to_deliver, deliverCurrency) }}</strong>
              </div>
              <div class="summary-line com-line">
                <span>Com. Proveedor:</span>
                <span>{{ formatCurrency(commissionProvider_USD, deliverCurrency) }}</span>
              </div>
              <div class="summary-total debit">
                <span>Total a Pagar ({{ deliverCurrency }}):</span>
                <strong>{{ formatCurrency(totalUsdDebit_Platform, deliverCurrency) }}</strong>
              </div>
            </div>
          </div>

          <div v-if="generalAmountError" class="error-box">
            <FontAwesomeIcon icon="fa-solid fa-exclamation-triangle" />
            {{ generalAmountError }}
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
            :disabled="isSubmitting || generalAmountError"
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
/* Tus estilos originales + el del checkbox */
.delivery-checkbox-section {
  margin: 40px 0 30px;
  padding: 25px;
  background: rgba(255, 193, 7, 0.15);
  border: 2px dashed #ffc107;
  border-radius: 12px;
  text-align: center;
  font-size: 1.2rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  cursor: pointer;
  font-weight: bold;
}

.checkbox-label input[type='checkbox'] {
  width: 28px;
  height: 28px;
}

.warning-text {
  margin-top: 12px;
  color: #ffc107;
  font-weight: bold;
  font-size: 1.1rem;
}

/* Resto de tus estilos originales sin cambio */
.step-title {
  font-size: 1.3rem;
  color: var(--color-text-light);
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
.summary-line.com-line {
  font-size: 0.9rem;
  opacity: 0.6;
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
.info-box {
  background-color: var(--color-background);
  padding: 15px;
  border-radius: 8px;
}
.info-box p {
  margin: 0 0 5px 0;
  font-size: 0.9rem;
  opacity: 0.7;
}
.info-box h3 {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-danger);
}
.info-box h3.rate-found {
  color: var(--color-success);
}
.rate-box {
  margin-top: 30px;
}
.form-grid-col3 .info-box {
  margin-top: 0;
}
.form-grid-col3 .rate-box {
  margin-top: 0;
}
.form-grid-col3 > *:not(h2) {
  height: 100%;
}
.form-grid-col3 .info-box {
  display: flex;
  flex-direction: column;
  justify-content: center;
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
