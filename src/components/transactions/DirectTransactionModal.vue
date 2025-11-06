<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-card modal-large">
      <div class="modal-header">
        <h2 class="modal-title">{{ modalTitle }}</h2>
        <button class="modal-close-btn" @click="closeModal">×</button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="modal-body">
          <div v-if="mode === 'register'">
            <p>Modo de Registro...</p>
          </div>

          <div v-if="mode === 'settle'">
            <p>Modo de Saldar Cuentas...</p>
          </div>

          <div v-if="mode === 'exchange'">
            <div v-show="exchangeStep === 1">
              <h3 class="form-subtitle">Paso 1: Montos y Cajas</h3>
              <CustomInput
                id="date"
                label="Fecha de la Operación"
                type="date"
                v-model="exchangeData.date"
                required
              />

              <div class="grid grid-cols-2 gap-4">
                <div class="input-wrapper">
                  <label for="cash_given_id" class="input-label">Caja Origen (Entrega)</label>
                  <select
                    id="cash_given_id"
                    v-model="exchangeData.cash_given_id"
                    class="input-style"
                    required
                    @change="onCashChange"
                  >
                    <option disabled value="">Seleccione caja...</option>
                    <option v-for="cash in cashStore.cashes" :key="cash.id" :value="cash.id">
                      {{ cash.name }} ({{ cash.currency.code }})
                    </option>
                  </select>
                </div>

                <div class="input-wrapper">
                  <label for="cash_received_id" class="input-label">Caja Destino (Recibe)</label>
                  <select
                    id="cash_received_id"
                    v-model="exchangeData.cash_received_id"
                    class="input-style"
                    required
                    @change="onCashChange"
                  >
                    <option disabled value="">Seleccione caja...</option>
                    <option v-for="cash in cashStore.cashes" :key="cash.id" :value="cash.id">
                      {{ cash.name }} ({{ cash.currency.code }})
                    </option>
                  </select>
                </div>
              </div>

              <div v-if="rateStore.loading" class="rate-info loading">
                Buscando tasa de cambio...
              </div>
              <div v-if="!rateStore.loading && rateStore.latestRate" class="rate-info success">
                Tasa Oficial ({{ formatDate(rateStore.latestRate.date) }}): 1
                {{ rateStore.latestRate.from_currency.code }} = {{ rateStore.latestRate.rate }}
                {{ rateStore.latestRate.to_currency.code }}
              </div>
              <div v-if="!rateStore.loading && rateStore.error" class="rate-info error">
                {{ rateStore.error }}
              </div>

              <CustomInput
                id="amount_given"
                label="Monto a Entregar (Bruto)"
                type="number"
                v-model.number="exchangeData.amount_given"
                :placeholder="`Monto en ${selectedCashGiven?.currency.code || '...'}`"
                required
              />
            </div>

            <div v-show="exchangeStep === 2">
              <h3 class="form-subtitle">Paso 2: Actores y Comisiones</h3>

              <UserSelectOrCreate
                id="customer_user_id"
                label="Cliente"
                v-model="exchangeData.customer_user_id"
                roleName="Client"
                placeholder="Buscar o crear cliente..."
                required
              />

              <div class="grid grid-cols-2 gap-4">
                <UserSelectOrCreate
                  id="provider_user_id"
                  label="Proveedor (Opcional)"
                  v-model="exchangeData.provider_user_id"
                  roleName="Provider"
                  placeholder="Buscar o crear proveedor..."
                />
                <UserSelectOrCreate
                  id="broker_user_id"
                  label="Corredor (Tracking)"
                  v-model="exchangeData.broker_user_id"
                  roleName="Broker"
                  placeholder="Buscar o crear corredor..."
                  required
                />
              </div>
              <h3 class="form-subtitle">Comisiones (basado en Monto Bruto)</h3>
              <div class="grid grid-cols-2 gap-4">
                <CustomInput
                  id="c_provider"
                  label="% Gasto Proveedor"
                  type="number"
                  v-model.number="exchangeData.commission_provider_percentage"
                  required
                />
                <CustomInput
                  id="c_company"
                  label="% Ingreso Empresa"
                  type="number"
                  v-model.number="exchangeData.commission_company_percentage"
                  required
                />
              </div>
              <CustomInput
                v-if="isVesSale"
                id="c_platform"
                label="% Gasto Plataforma (Pasarela)"
                type="number"
                v-model.number="exchangeData.commission_platform_percentage"
                required
              />
            </div>

            <div v-show="exchangeStep === 3">
              <h3 class="form-subtitle">Paso 3: Resumen de la Operación</h3>

              <div class="summary-card">
                <div class="summary-item">
                  <span class="summary-label">Entregado (Origen):</span>
                  <span class="summary-value">{{
                    formatDisplayCurrency(summary.amount_given, selectedCashGiven?.currency.code)
                  }}</span>
                </div>
                <div class="summary-item summary-negative">
                  <span class="summary-label"
                    >(-) Gasto Proveedor ({{ exchangeData.commission_provider_percentage }}%):</span
                  >
                  <span class="summary-value">{{
                    formatDisplayCurrency(summary.provider_amount, selectedCashGiven?.currency.code)
                  }}</span>
                </div>
                <div v-if="isVesSale" class="summary-item summary-negative">
                  <span class="summary-label"
                    >(-) Gasto Plataforma ({{
                      exchangeData.commission_platform_percentage
                    }}%):</span
                  >
                  <span class="summary-value">{{
                    formatDisplayCurrency(summary.platform_amount, selectedCashGiven?.currency.code)
                  }}</span>
                </div>
                <div class="summary-item summary-negative">
                  <span class="summary-label"
                    >(-) Ingreso Empresa ({{ exchangeData.commission_company_percentage }}%):</span
                  >
                  <span class="summary-value">{{
                    formatDisplayCurrency(summary.company_amount, selectedCashGiven?.currency.code)
                  }}</span>
                </div>
                <div class="summary-item summary-total">
                  <span class="summary-label">Neto a Convertir:</span>
                  <span class="summary-value">{{
                    formatDisplayCurrency(
                      summary.net_amount_to_convert,
                      selectedCashGiven?.currency.code,
                    )
                  }}</span>
                </div>
              </div>

              <div class="summary-card">
                <div class="summary-item">
                  <span class="summary-label">Tasa Oficial:</span>
                  <span class="summary-value-text"
                    >1 {{ selectedCashGiven?.currency.code }} = {{ rateStore.latestRate?.rate }}
                    {{ selectedCashReceived?.currency.code }}</span
                  >
                </div>
                <div class="summary-item summary-total highlight">
                  <span class="summary-label">Total a Recibir (Destino):</span>
                  <span class="summary-value">{{
                    formatDisplayCurrency(
                      summary.amount_received,
                      selectedCashReceived?.currency.code,
                    )
                  }}</span>
                </div>
              </div>

              <CustomInput
                id="description"
                label="Descripción (Opcional)"
                type="text"
                v-model="exchangeData.description"
                placeholder="Detalles de la operación"
              />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type.button="button" class="btn-secondary" @click="closeModal">Cancelar</button>

          <div v-if="mode === 'exchange'" class="wizard-nav">
            <button
              v-if="exchangeStep > 1"
              type.button="button"
              class="btn-secondary"
              @click="exchangeStep--"
            >
              Atrás
            </button>
            <button
              v-if="exchangeStep < 3"
              type.button="button"
              class="btn-layout-primary"
              @click="nextStep"
              :disabled="!isStep1Valid"
            >
              Siguiente
            </button>
            <button
              v-if="exchangeStep === 3"
              type="submit"
              class="btn-binance"
              :disabled="transactionStore.loading"
            >
              {{ transactionStore.loading ? 'Procesando...' : 'Confirmar Intercambio' }}
            </button>
          </div>

          <div v-else>
            <button type="submit" class="btn-layout-primary" :disabled="transactionStore.loading">
              {{ transactionStore.loading ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import CustomInput from '@/components/common/CustomInput.vue'
// ==========================================================
// CORRECCIÓN: Importar tu componente
// (Ajusta la ruta si es necesario)
// ==========================================================
import UserSelectOrCreate from '@/components/common/UserSelectOrCreate.vue'

// Stores
import { useTransactionStore } from '@/stores/transactionStore'
import { useCashStore } from '@/stores/cashStore'
import { useExchangeRateStore } from '@/stores/exchangeRateStore'
import { useUserStore } from '@/stores/userStore' // <-- Store existente
import { useToast } from 'vue-toastification'

const props = defineProps({
  isVisible: Boolean,
  mode: String, // 'register', 'settle', 'exchange'
  transactionToSettle: Object,
  // Props de tu modal original (para register/settle)
  flowType: String,
  formData: Object,
  isDirectFlow: Boolean,
  isPendingFlow: Boolean,
  settleData: Object,
  isSettleCXP: Boolean,
  transactionData: Object,
})
const emit = defineEmits(['close', 'update:flowType', 'save'])

const toast = useToast()
const transactionStore = useTransactionStore()
const cashStore = useCashStore()
const rateStore = useExchangeRateStore()
const userStore = useUserStore() // <-- Store existente (corregido en Paso 1)

// --- ESTADO GENERAL ---
const modalTitle = computed(() => {
  if (props.mode === 'register') return 'Registrar Movimiento'
  if (props.mode === 'settle') return 'Saldar Transacción Pendiente'
  if (props.mode === 'exchange') return 'Intercambio de Divisas'
  return 'Modal'
})

// --- LÓGICA DE INTERCAMBIO (EXCHANGE) ---
const exchangeStep = ref(1)
const exchangeData = ref({
  date: new Date().toISOString().split('T')[0],
  cash_given_id: '',
  cash_received_id: '',
  amount_given: 0,
  customer_user_id: '',
  provider_user_id: '',
  broker_user_id: '',
  commission_provider_percentage: 0,
  commission_company_percentage: 0,
  commission_platform_percentage: 0,
  description: '',
})

// Computadas para Exchange
const selectedCashGiven = computed(() =>
  cashStore.cashes.find((c) => c.id === exchangeData.value.cash_given_id),
)
const selectedCashReceived = computed(() =>
  cashStore.cashes.find((c) => c.id === exchangeData.value.cash_received_id),
)
const isVesSale = computed(() => selectedCashReceived.value?.currency.code === 'VES')
const isStep1Valid = computed(() => {
  return (
    exchangeData.value.cash_given_id &&
    exchangeData.value.cash_received_id &&
    exchangeData.value.amount_given > 0 &&
    rateStore.latestRate
  ) // Debe existir una tasa para continuar
})

// Cálculos del Resumen (Paso 3)
const summary = computed(() => {
  const amountGiven = parseFloat(exchangeData.value.amount_given) || 0

  const providerAmount =
    amountGiven * (parseFloat(exchangeData.value.commission_provider_percentage) / 100)
  const companyAmount =
    amountGiven * (parseFloat(exchangeData.value.commission_company_percentage) / 100)
  const platformAmount = isVesSale.value
    ? amountGiven * (parseFloat(exchangeData.value.commission_platform_percentage) / 100)
    : 0

  const totalExpenseCommissions = providerAmount + platformAmount
  const netAmountToConvert = amountGiven - totalExpenseCommissions - companyAmount
  const amountReceived = netAmountToConvert * (rateStore.latestRate?.rate || 0)

  return {
    amount_given: amountGiven,
    provider_amount: providerAmount,
    company_amount: companyAmount,
    platform_amount: platformAmount,
    net_amount_to_convert: netAmountToConvert,
    amount_received: amountReceived,
  }
})

// --- OBSERVADORES (Watchers) ---
watch(
  () => props.isVisible,
  (newVal) => {
    if (newVal) {
      // Cargar solo las cajas.
      // Los componentes UserSelectOrCreate cargan sus propios usuarios.
      cashStore.fetchCashes({})

      // ==========================================================
      // CORRECCIÓN: Eliminamos el 'fetchUsers' de aquí.
      // El error de la línea 382 ya no existe.
      // ==========================================================

      if (props.mode === 'exchange') {
        resetExchangeForm()
      }
    }
  },
)

// Observador para buscar tasa automáticamente
function onCashChange() {
  rateStore.fetchLatestRate(
    selectedCashGiven.value?.currency_id,
    selectedCashReceived.value?.currency_id,
    exchangeData.value.date,
  )
  if (!isVesSale.value) {
    exchangeData.value.commission_platform_percentage = 0
  }
}

// --- MÉTODOS ---
const closeModal = () => {
  emit('close')
}

const resetExchangeForm = () => {
  exchangeStep.value = 1
  exchangeData.value = {
    date: new Date().toISOString().split('T')[0],
    cash_given_id: '',
    cash_received_id: '',
    amount_given: 0,
    customer_user_id: '',
    provider_user_id: '',
    broker_user_id: userStore.user?.id || '', // Auto-llenar corredor logueado
    commission_provider_percentage: 0,
    commission_company_percentage: 0,
    commission_platform_percentage: 0,
    description: '',
  }
  rateStore.clearRate() // Asumo que tienes esta acción
}

const nextStep = () => {
  if (exchangeStep.value === 1 && isStep1Valid.value) {
    exchangeStep.value = 2
  } else if (exchangeStep.value === 2) {
    // Validar paso 2
    const totalPct =
      exchangeData.value.commission_provider_percentage +
      exchangeData.value.commission_company_percentage +
      exchangeData.value.commission_platform_percentage
    if (totalPct >= 100) {
      toast.error('La suma de comisiones no puede ser 100% o más.')
      return
    }
    if (summary.value.net_amount_to_convert <= 0) {
      toast.error('El monto a entregar es insuficiente para cubrir las comisiones.')
      return
    }
    exchangeStep.value = 3
  }
}

const handleSubmit = async () => {
  try {
    if (props.mode === 'exchange') {
      // Validaciones finales (Paso 3)
      if (summary.value.net_amount_to_convert <= 0) {
        toast.error('Error: El neto a convertir es cero o negativo.')
        return
      }
      // Enviar datos
      await transactionStore.executeExchange(exchangeData.value)
      toast.success('Intercambio registrado exitosamente.')
    } else if (props.mode === 'register') {
      // ... tu lógica de handleSubmit para 'register'
      emit('save', { flow: props.flowType, data: props.formData })
    } else if (props.mode === 'settle') {
      // ... tu lógica de handleSubmit para 'settle'
      const settleDataToSend = { ...props.settleData }
      if (props.isSettleCXP) {
        settleDataToSend.cxp_transaction_id = props.transactionToSettle.id
        await transactionStore.processPaymentPayable(settleDataToSend)
      } else {
        settleDataToSend.cxc_transaction_id = props.transactionToSettle.id
        await transactionStore.processPaymentReceivable(settleDataToSend)
      }
      toast.success('Transacción saldada exitosamente.')
    }

    closeModal()
  } catch (error) {
    console.error('Error al procesar la transacción:', error)
  }
}

// --- UTILIDADES DE FORMATO ---
const formatDisplayCurrency = (value, code) => {
  if (typeof value !== 'number') value = 0
  if (!code) code = 'USD'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 4,
  }).format(value)
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString()
}
</script>

<style scoped>
/* Estilos para el Wizard de Intercambio */
.wizard-nav {
  display: flex;
  gap: 0.75rem;
  margin-left: auto;
}
.rate-info {
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  font-weight: 500;
  text-align: center;
}
.rate-info.loading {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}
.rate-info.success {
  background-color: #0ecb811a;
  color: #0ecb81;
}
.rate-info.error {
  background-color: #d630311a;
  color: #d63031;
}

/* Estilos para el Resumen (Paso 3) */
.summary-card {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}
.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 0.7rem 0;
  border-bottom: 1px solid var(--color-bg-tertiary);
}
.summary-item:last-child {
  border-bottom: none;
}
.summary-label {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin-right: 1rem;
}
.summary-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  text-align: right;
}
.summary-value-text {
  font-size: 0.9rem;
  color: var(--color-text-primary);
  text-align: right;
}
.summary-negative .summary-value {
  color: #d63031; /* Rojo */
}
.summary-total {
  border-top: 2px solid var(--color-border);
  margin-top: 0.5rem;
  padding-top: 0.7rem;
}
.summary-total.highlight .summary-value {
  color: var(--color-accent-yellow);
  font-size: 1.2rem;
}
.modal-large {
  max-width: 800px;
}
.form-subtitle {
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.5rem;
}
.btn-binance {
  background-color: var(--color-accent-yellow);
  color: #1c2127;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 700;
  transition: all 0.2s ease;
}
.btn-binance:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Estilos de tu modal original (para que no se rompa el modo register) */
.input-wrapper {
  position: relative; /* Necesario para el dropdown de UserSelectOrCreate */
  width: 100%;
  margin-bottom: 1.25rem;
  text-align: left;
}
.input-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #d1d5db;
  margin-bottom: 0.5rem;
}
.input-style {
  width: 100%;
  background-color: #363a43;
  color: #eaecef;
  border: 1px solid #4a515c;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  transition: all 0.2s ease;
}
.input-style:focus {
  border-color: var(--color-accent-yellow);
  box-shadow: 0 0 0 3px rgba(240, 185, 11, 0.3);
  outline: none;
}
.btn-secondary {
  padding: 0.75rem 1.25rem;
  font-weight: 600;
  background-color: #363a43;
  color: #eaecef;
  border-radius: 8px;
  transition: background-color 0.2s;
}
.btn-secondary:hover {
  background-color: #4a515c;
}
.btn-layout-primary {
  /* Asegurando que exista */
  padding: 0.75rem 1.25rem;
  font-weight: 700;
  background-color: var(--color-accent-yellow);
  color: #1c2127;
  border-radius: 8px;
  transition: all 0.2s ease;
}
</style>
