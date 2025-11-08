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

const form = reactive({
  // 'number' SE ELIMINA, el backend lo genera

  client_id: null,
  broker_id: null,
  provider_id: null,
  admin_user_id: authStore.authUser?.id,
  from_account_id: null,
  to_account_id: null,
  amount_received: 0.0, // Monto que envía el cliente (Origen)
  commission_charged_pct: 0.0,
  commission_provider_pct: 0.0,
  commission_admin_pct: 0.0,
})

// --- LÓGICA DE DATOS ---
const fromAccount = computed(() =>
  transactionStore.accounts.find((a) => a.id == form.from_account_id),
)
const toAccount = computed(() => transactionStore.accounts.find((a) => a.id == form.to_account_id))
const selectedBroker = computed(() =>
  transactionStore.getBrokers.find((b) => b.id == form.broker_id),
)

const exchangeRate = computed(() => {
  if (!fromAccount.value || !toAccount.value) return 0
  return transactionStore.findRate(fromAccount.value.currency_code, toAccount.value.currency_code)
})

// --- CÁLCULOS AUTOMÁTICOS ---
const amountToDeliver = computed(() =>
  exchangeRate.value && form.amount_received > 0 ? form.amount_received * exchangeRate.value : 0,
)
const commissionChargedAmount = computed(
  () => (form.amount_received * form.commission_charged_pct) / 100,
)
const commissionProviderAmount = computed(
  () => (form.amount_received * form.commission_provider_pct) / 100,
)
const commissionAdminAmount = computed(
  () => (form.amount_received * form.commission_admin_pct) / 100,
)

// Total a debitar de la cuenta de origen (Monto + comisiones)
const totalDebitedFromOrigin = computed(() => {
  return (
    parseFloat(form.amount_received || 0) +
    commissionChargedAmount.value +
    commissionProviderAmount.value +
    commissionAdminAmount.value
  )
})

// --- VALIDACIÓN DE SALDO ---
const amountError = computed(() => {
  if (fromAccount.value && totalDebitedFromOrigin.value > fromAccount.value.balance) {
    // Usamos el formatCurrency local
    return `El monto total a debitar (${formatCurrency(totalDebitedFromOrigin.value, fromAccount.value.currency_code)}) supera el saldo disponible.`
  }
  return null
})

watch(selectedBroker, (broker) => {
  if (broker) form.commission_charged_pct = broker.commission
})

// --- NAVEGACIÓN Y ENVÍO ---
const validateStep = (step) => {
  clearError()
  if (step === 0 && !form.client_id) {
    notify.error('Debe seleccionar un cliente.')
    return false
  }

  if (step === 1) {
    // 'number' SE ELIMINA de la validación

    if (!form.from_account_id || !form.to_account_id) {
      notify.error('Debe seleccionar ambas cuentas.')
      return false
    }
    if (form.from_account_id === form.to_account_id) {
      notify.error('Las cuentas no pueden ser la misma.')
      return false
    }
    if (!exchangeRate.value) {
      notify.error('No hay tasa de cambio para este par de divisas.')
      return false
    }
    if (form.amount_received <= 0) {
      notify.error('El monto a recibir debe ser mayor a cero.')
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
  if (
    !validateStep(0) ||
    !validateStep(1) ||
    !validateStep(2) ||
    isSubmitting.value ||
    amountError.value
  ) {
    notify.error('Revise los campos, hay errores.')
    return
  }
  isSubmitting.value = true
  try {
    await api.post('/transactions/currency-exchange', form)
    notify.success('Cambio de divisa registrado.')
    router.push({ name: 'transactions_home' })
  } catch (error) {
    handleAxiosError(error)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => transactionStore.fetchAllSupportData())

// 🚨 FUNCIÓN DE AYUDA (que faltó en turnos anteriores)
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
    <FormWizard title="Registro de Cambio de Divisas (Ej: USD a VES)" v-model="currentStep">
      <template #step-0>
        <h2 class="step-title">1. Partes Involucradas</h2>
        <div class="form-grid">
          <BaseSelect
            v-model="form.client_id"
            label="Cliente"
            :options="transactionStore.getClients"
            placeholder="Seleccione un cliente"
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
            label="Proveedor (Quien Paga)"
            :options="transactionStore.getProviders"
            placeholder="Opcional"
          />
        </div>
      </template>

      <template #step-1>
        <h2 class="step-title">2. Detalles de la Operación</h2>

        <div class="form-grid-col2 section-title">
          <div class="account-selection">
            <BaseSelect
              v-model="form.from_account_id"
              label="Cuenta Origen (Cliente Envía)"
              :options="transactionStore.getAccounts"
              required
            />
            <BaseSelect
              v-model="form.to_account_id"
              label="Cuenta Destino (Cliente Recibe)"
              :options="transactionStore.getAccounts"
              required
            />
          </div>
          <div class="amount-details">
            <BaseInput
              v-model.number="form.amount_received"
              label="Monto Recibido (Origen)"
              type="number"
              step="0.01"
              :placeholder="fromAccount?.currency_code"
              required
              :error="amountError"
            />
            <div class="info-box rate-box">
              <p>Tasa de Cambio Aplicada (Automática)</p>
              <h3 :class="{ 'rate-found': exchangeRate }">
                {{ exchangeRate ? exchangeRate.toFixed(4) : 'NO DISPONIBLE' }}
              </h3>
            </div>
          </div>
        </div>
      </template>

      <template #step-2>
        <h2 class="step-title">3. Comisiones (Opcional)</h2>
        <p class="step-subtitle">
          Aplicadas sobre el Monto Recibido ({{ fromAccount?.currency_code || '?' }}).
        </p>
        <div class="form-grid-col3">
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
          <BaseInput
            v-model.number="form.commission_admin_pct"
            label="Comisión Plataforma (%)"
            type="number"
            step="0.01"
          />
        </div>
      </template>

      <template #step-3>
        <h2 class="step-title">4. Resumen y Confirmación</h2>
        <div class="summary-grid">
          <div class="summary-card">
            <h4>
              <FontAwesomeIcon icon="fa-solid fa-arrow-up" /> Origen (Débito de
              {{ fromAccount?.name }})
            </h4>
            <div class="summary-line">
              <span>Monto Recibido:</span>
              <strong>{{
                formatCurrency(form.amount_received, fromAccount?.currency_code)
              }}</strong>
            </div>
            <div class="summary-line com-line">
              <span>Com. Empresa:</span>
              <span>{{ formatCurrency(commissionChargedAmount, fromAccount?.currency_code) }}</span>
            </div>
            <div class="summary-line com-line">
              <span>Com. Proveedor:</span>
              <span>{{
                formatCurrency(commissionProviderAmount, fromAccount?.currency_code)
              }}</span>
            </div>
            <div class="summary-line com-line">
              <span>Com. Plataforma:</span>
              <span>{{ formatCurrency(commissionAdminAmount, fromAccount?.currency_code) }}</span>
            </div>
            <div class="summary-total debit">
              <span>Total Débito:</span>
              <strong>{{
                formatCurrency(totalDebitedFromOrigin, fromAccount?.currency_code)
              }}</strong>
            </div>
          </div>
          <div class="summary-card">
            <h4>
              <FontAwesomeIcon icon="fa-solid fa-arrow-down" /> Destino (Crédito a
              {{ toAccount?.name }})
            </h4>
            <div class="summary-total credit">
              <span>Total a Entregar:</span>
              <strong>{{ formatCurrency(amountToDeliver, toAccount?.currency_code) }}</strong>
            </div>
          </div>
        </div>
        <div v-if="amountError" class="error-box">
          <FontAwesomeIcon icon="fa-solid fa-exclamation-triangle" /> {{ amountError }}
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
          <button type="button" @click="goToNextStep" v-if="currentStep < 3" class="btn-next">
            Siguiente
          </button>
          <button
            type="button"
            @click="handleSubmit"
            v-if="currentStep === 3"
            :disabled="isSubmitting || amountError"
            class="btn-finish"
          >
            {{ isSubmitting ? 'Procesando...' : 'Finalizar Transacción' }}
          </button>
        </div>
      </template>
    </FormWizard>
  </div>
</template>

<style scoped>
/* Estilos del Wizard */
.section-title {
  margin-top: 30px;
} /* 🚨 Añadido para el espaciado */
.step-title {
  font-size: 1.3rem;
  color: var(--color-text-light);
}
.step-subtitle {
  opacity: 0.8;
  margin-bottom: 30px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}
.form-grid-col2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}
.form-grid-col3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
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
