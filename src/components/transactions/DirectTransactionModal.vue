// src/components/transactions/DirectTransactionModal.vue
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
            <h3 class="form-subtitle">Datos Generales</h3>
            <div class="grid grid-cols-2 gap-4">
              <CustomInput id="date" label="Fecha" type="date" v-model="formData.date" required />
              <div class="input-wrapper">
                <label for="flow" class="input-label">Tipo de Flujo</label>
                <select id="flow" v-model="flowType" class="input-style" required>
                  <option value="DIRECT_INGRESO">Ingreso Directo</option>
                  <option value="DIRECT_EGRESO">Egreso Directo</option>
                  <option value="PENDING_CXP">Registro Cuenta por Pagar (CXP)</option>
                  <option value="PENDING_CXC">Registro Cuenta por Cobrar (CXC)</option>
                </select>
              </div>
            </div>
            <div class="form-section">
              <div v-if="isDirectFlow">
                <h3 class="form-subtitle mt-4">Detalle del Movimiento de Caja</h3>
                <div class="grid grid-cols-2 gap-4">
                  <div class="input-wrapper">
                    <label for="cash_id" class="input-label"
                      >Caja de {{ flowType.includes('INGRESO') ? 'Destino' : 'Origen' }}</label
                    >
                    <select id="cash_id" v-model="formData.cash_id" class="input-style" required>
                      <option disabled value="">Seleccione caja...</option>
                      <option v-for="cash in availableCashes" :key="cash.id" :value="cash.id">
                        {{ cash.name }} ({{ cash.currency?.code || 'N/A' }})
                      </option>
                    </select>
                  </div>
                  <div class="input-wrapper">
                    <label for="account_id" class="input-label">Cuenta de Contrapartida</label>
                    <select
                      id="account_id"
                      v-model="formData.account_id"
                      class="input-style"
                      required
                    >
                      <option disabled value="">Seleccione cuenta...</option>
                      <option
                        v-for="account in filteredAccounts"
                        :key="account.id"
                        :value="account.id"
                      >
                        {{ account.name }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
              <div v-else-if="isPendingFlow">
                <h3 class="form-subtitle mt-4">Detalle de Cuenta Pendiente</h3>
                <div class="input-wrapper">
                  <label for="user_id" class="input-label">
                    {{ flowType === 'PENDING_CXP' ? 'Proveedor' : 'Cliente' }} (Usuario)
                  </label>
                  <select id="user_id" v-model="formData.user_id" class="input-style" required>
                    <option disabled value="">Seleccione un usuario...</option>
                    <option value="1">Ej. Proveedor A (ID: 1)</option>
                    <option value="2">Ej. Cliente B (ID: 2)</option>
                  </select>
                </div>
              </div>
            </div>
            <CustomInput
              id="amount"
              label="Monto"
              type="number"
              v-model="formData.amount"
              step="0.01"
              required
            />
            <CustomInput
              id="description"
              label="Descripción / Motivo"
              v-model="formData.description"
              placeholder="Ej: Pago de nómina, Venta de servicios"
            />
          </div>
          <div v-else-if="mode === 'settle'">
            <h3 class="form-subtitle">
              Saldar Transacción Pendiente #{{ transactionData?.reference_code }}
            </h3>
            <p class="form-subtitle-help">
              Monto Pendiente: **{{ formatCurrency(amountToSettle) }}**
            </p>
            <div class="grid grid-cols-2 gap-4">
              <CustomInput
                id="settle_date"
                label="Fecha de Pago/Cobro"
                type="date"
                v-model="settleData.date"
                required
              />
              <div class="input-wrapper">
                <label for="settle_cash_id" class="input-label"
                  >Caja ({{ isSettleCXP ? 'Origen' : 'Destino' }})</label
                >
                <select
                  id="settle_cash_id"
                  v-model="settleData.cash_id"
                  class="input-style"
                  required
                >
                  <option disabled value="">Seleccione caja...</option>
                  <option v-for="cash in availableCashes" :key="cash.id" :value="cash.id">
                    {{ cash.name }} ({{ cash.currency?.code }})
                  </option>
                </select>
              </div>
            </div>
            <CustomInput
              id="settle_amount"
              label="Monto a Pagar/Cobrar"
              type="number"
              v-model="settleData.amount"
              :max="amountToSettle"
              step="0.01"
              required
            />
            <CustomInput
              id="settle_description"
              label="Descripción"
              v-model="settleData.description"
              placeholder="Pago a proveedor por factura..."
            />
          </div>
          <div v-else-if="mode === 'view'">
            <div v-if="transactionStore.loading" class="text-center py-5">
              Cargando detalles de la transacción...
            </div>
            <div v-else-if="!viewData" class="text-center py-5 text-red-500">
              Error: No se pudieron obtener los detalles (ID: {{ props.transactionData?.id }}).
            </div>
            <div v-else>
              <h3 class="form-subtitle">Detalles de Asiento Contable</h3>
              <div class="details-header mb-4">
                <p><strong>Referencia:</strong> {{ viewData.reference_code }}</p>
                <p><strong>Fecha:</strong> {{ formatDate(viewData.date) }}</p>
                <p><strong>Descripción:</strong> {{ viewData.description }}</p>
                <p><strong>Estado:</strong> {{ translateStatus(viewData.status) }}</p>
              </div>
              <table class="content-table details-table">
                <thead>
                  <tr>
                    <th style="width: 50%">Cuenta</th>
                    <th class="text-right">Débito</th>
                    <th class="text-right">Crédito</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="detail in viewData.details" :key="detail.id">
                    <td>{{ detail.account?.name || 'N/A' }}</td>
                    <td class="text-right">
                      <span v-if="detail.is_debit">{{ formatCurrency(detail.amount) }}</span>
                    </td>
                    <td class="text-right">
                      <span v-if="!detail.is_debit">{{ formatCurrency(detail.amount) }}</span>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>Totales:</strong></td>
                    <td class="text-right">
                      <strong>{{ formatCurrency(calculateTotal(true)) }}</strong>
                    </td>
                    <td class="text-right">
                      <strong>{{ formatCurrency(calculateTotal(false)) }}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div v-else-if="mode === 'exchange'">
            <h3 class="form-subtitle">Operación de Intercambio</h3>

            <CustomInput
              id="exchange_date"
              label="Fecha de Operación"
              type="date"
              v-model="exchangeData.date"
              required
            />

            <div class="grid grid-cols-2 gap-4">
              <div class="input-wrapper">
                <label for="cash_given_id" class="input-label">Caja Origen (Entrego)</label>
                <select
                  id="cash_given_id"
                  v-model="exchangeData.cash_given_id"
                  class="input-style"
                  required
                >
                  <option disabled value="">Seleccione caja...</option>
                  <option v-for="cash in availableCashes" :key="cash.id" :value="cash.id">
                    {{ cash.name }} ({{ cash.currency?.code || 'N/A' }}) - Saldo:
                    {{ formatCurrency(cash.balance, cash.currency?.symbol || '$') }}
                  </option>
                </select>
              </div>

              <CustomInput
                id="amount_given"
                label="Monto Entregado"
                type="number"
                v-model="exchangeData.amount_given"
                step="0.01"
                required
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="input-wrapper">
                <label for="cash_received_id" class="input-label">Caja Destino (Recibo)</label>
                <select
                  id="cash_received_id"
                  v-model="exchangeData.cash_received_id"
                  class="input-style"
                  required
                >
                  <option disabled value="">Seleccione caja...</option>
                  <option v-for="cash in availableCashes" :key="cash.id" :value="cash.id">
                    {{ cash.name }} ({{ cash.currency?.code || 'N/A' }}) - Saldo:
                    {{ formatCurrency(cash.balance, cash.currency?.symbol || '$') }}
                  </option>
                </select>
              </div>

              <CustomInput
                id="amount_received"
                label="Monto Recibido (Automático)"
                type="number"
                v-model="exchangeData.amount_received"
                step="0.01"
                required
                :readonly="true"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <CustomInput
                id="fee"
                label="Comisión (Opcional, divisa Origen)"
                type="number"
                v-model="exchangeData.fee"
                step="0.01"
              />
              <div class="input-wrapper">
                <label class="input-label">Tasa de Cambio (Info)</label>
                <span class="input-style-static">
                  {{ calculatedRateText }}
                </span>
              </div>
            </div>

            <CustomInput
              id="description"
              label="Descripción (Opcional)"
              v-model="exchangeData.description"
              placeholder="Ej: Intercambio USD a VEF"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="closeModal">
            {{ mode === 'view' ? 'Cerrar' : 'Cancelar' }}
          </button>
          <button
            v-if="mode !== 'view'"
            type="submit"
            class="btn-layout-primary"
            :disabled="isLoading || transactionStore.loading || exchangeRateStore.loading"
          >
            {{ submitButtonText }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, defineProps, defineEmits } from 'vue'
import CustomInput from '@/components/common/CustomInput.vue'
import { useCashStore } from '@/stores/cashStore'
import { useAccountStore } from '@/stores/accountStore'
import { useTransactionStore } from '@/stores/transactionStore'
import { useCurrencyStore } from '@/stores/currencyStore'
import { useExchangeRateStore } from '@/stores/exchangeRateStore'
import { useToast } from 'vue-toastification'

const props = defineProps({
  isVisible: Boolean,
  isLoading: Boolean,
  mode: { type: String, default: 'register' },
  transactionData: Object,
})
const emit = defineEmits(['close'])

const cashStore = useCashStore()
const accountStore = useAccountStore()
const transactionStore = useTransactionStore()
const currencyStore = useCurrencyStore()
const exchangeRateStore = useExchangeRateStore()
const toast = useToast()

const formData = ref({})
const flowType = ref('DIRECT_INGRESO')
const settleData = ref({})
const exchangeData = ref({})

const modalTitle = computed(() => {
  if (props.mode === 'settle') return 'Saldar Cuenta Pendiente'
  if (props.mode === 'view')
    return `Detalle de Asiento: ${viewData.value?.reference_code || 'Cargando...'}`
  if (props.mode === 'exchange') return 'Ejecutar Intercambio de Divisas'
  return 'Registrar Nuevo Movimiento'
})

const submitButtonText = computed(() => {
  if (props.mode === 'settle') return 'Procesar Pago/Cobro'
  if (props.mode === 'exchange') return 'Ejecutar Intercambio'
  return 'Guardar Transacción'
})

const viewData = computed(() => transactionStore.viewedTransaction)
const isDirectFlow = computed(() => flowType.value.startsWith('DIRECT'))
const isPendingFlow = computed(() => flowType.value.startsWith('PENDING'))
const isSettleCXP = computed(() => props.transactionData?.type === 'CXP')

const amountToSettle = computed(() => {
  return props.transactionData?.details?.[0]?.amount || 0
})

const availableCashes = computed(() => {
  return cashStore.cashes.filter((cash) => cash.currency_id && cash.currency)
})

const calculatedRateText = computed(() => {
  if (exchangeRateStore.loading) {
    return 'Buscando tasa...'
  }
  if (exchangeRateStore.error) {
    return 'Tasa no disponible.'
  }
  const rateObj = exchangeRateStore.latestRate
  if (rateObj && rateObj.from_currency && rateObj.to_currency) {
    const rate = parseFloat(rateObj.rate).toFixed(4)
    const from = rateObj.from_currency.code
    const to = rateObj.to_currency.code
    return `1.00 ${from} = ${rate} ${to}`
  }
  return 'Seleccione cajas...'
})

const filteredAccounts = computed(() => {
  const allAccounts = accountStore.accounts || []

  if (flowType.value === 'DIRECT_INGRESO') {
    return allAccounts.filter((a) => a.type === 'INGRESS' || a.type === 'ASSET')
  }
  if (flowType.value === 'DIRECT_EGRESO') {
    return allAccounts.filter((a) => a.type === 'EGRESS' || a.type === 'LIABILITY')
  }
  return []
})

watch(
  () => props.isVisible,
  (newVal) => {
    if (newVal) {
      exchangeRateStore.clearRate()

      cashStore.fetchCashes({})
      accountStore.fetchAllAccountsForDropdowns()
      currencyStore.fetchActiveCurrencies()

      if (props.mode === 'view' && props.transactionData?.id) {
        transactionStore.fetchTransactionDetails(props.transactionData.id)
      } else {
        transactionStore.viewedTransaction = null
      }

      if (props.mode === 'register') {
        flowType.value = 'DIRECT_INGRESO'
        formData.value = {
          date: new Date().toISOString().slice(0, 10),
          description: '',
          cash_id: '',
          amount: 0.01,
          account_id: '',
          user_id: '',
        }
      } else if (props.mode === 'settle') {
        settleData.value = {
          date: new Date().toISOString().slice(0, 10),
          amount: amountToSettle.value,
          cash_id: '',
          description: `Pago/Cobro de ${props.transactionData?.reference_code}`,
        }
      } else if (props.mode === 'exchange') {
        exchangeData.value = {
          date: new Date().toISOString().slice(0, 10),
          cash_given_id: '',
          amount_given: 0.01, // Iniciar en 0.01 para disparar cálculo
          cash_received_id: '',
          amount_received: 0, // Inicia en 0, se auto-calcula
          fee: 0,
          description: '',
        }
      }
    }
  },
)

watch(flowType, () => {
  formData.value.cash_id = ''
  formData.value.account_id = ''
  formData.value.user_id = ''
})

// Observa cambios en las CAJAS seleccionadas para buscar la tasa
watch(
  () => [exchangeData.value.cash_given_id, exchangeData.value.cash_received_id],
  ([givenId, receivedId]) => {
    if (props.mode !== 'exchange' || !props.isVisible) return

    if (givenId && receivedId) {
      const cashGiven = availableCashes.value.find((c) => c.id === givenId)
      const cashReceived = availableCashes.value.find((c) => c.id === receivedId)

      if (cashGiven && cashReceived) {
        exchangeRateStore.fetchLatestRate(cashGiven.currency_id, cashReceived.currency_id)
      }
    } else {
      exchangeRateStore.clearRate()
    }
  },
)

// Observa cambios en el MONTO ENTREGADO o en la TASA para recalcular
watch(
  () => [exchangeData.value.amount_given, exchangeRateStore.latestRate],
  ([amountGiven, rateObject]) => {
    if (props.mode !== 'exchange' || !props.isVisible) return

    const amount = parseFloat(amountGiven)
    if (rateObject && rateObject.rate && amount > 0) {
      const rate = parseFloat(rateObject.rate)
      const calculated = (amount * rate).toFixed(2)
      exchangeData.value.amount_received = parseFloat(calculated)
    } else {
      exchangeData.value.amount_received = 0
    }
  },
  { deep: true },
)

const closeModal = () => emit('close')

const handleSubmit = async () => {
  try {
    if (props.mode === 'register') {
      let response
      const data = { ...formData.value }

      if (flowType.value === 'PENDING_CXP') data.provider_user_id = data.user_id
      if (flowType.value === 'PENDING_CXC') data.customer_user_id = data.user_id

      if (flowType.value === 'DIRECT_INGRESO') data.account_credit_id = data.account_id
      if (flowType.value === 'DIRECT_EGRESO') data.account_debit_id = data.account_id

      if (flowType.value === 'DIRECT_INGRESO')
        response = await transactionStore.addDirectIngress(data)
      else if (flowType.value === 'DIRECT_EGRESO')
        response = await transactionStore.addDirectEgress(data)
      else if (flowType.value === 'PENDING_CXP')
        response = await transactionStore.addAccountPayable(data)
      else if (flowType.value === 'PENDING_CXC')
        response = await transactionStore.addAccountReceivable(data)
    } else if (props.mode === 'settle') {
      let response
      const settleDataToSend = { ...settleData.value }

      if (isSettleCXP.value) {
        settleDataToSend.cxp_transaction_id = props.transactionData.id
        response = await transactionStore.processPaymentPayable(settleDataToSend)
      } else {
        settleDataToSend.cxc_transaction_id = props.transactionData.id
        response = await transactionStore.processPaymentReceivable(settleDataToSend)
      }
    } else if (props.mode === 'exchange') {
      const data = exchangeData.value
      if (data.cash_given_id === data.cash_received_id) {
        toast.error('La caja de origen y destino no pueden ser la misma.')
        return
      }
      if (exchangeRateStore.error || !exchangeRateStore.latestRate) {
        toast.error('No hay una tasa de cambio válida para esta operación.')
        return
      }
      await transactionStore.executeExchange(data)
    }

    closeModal()
  } catch (error) {
    console.error('Error en el handleSubmit:', error)
  }
}

const formatCurrency = (value, symbol = '$') => {
  const number = parseFloat(value)
  if (isNaN(number)) return `${symbol} 0.00`
  return `${symbol} ${number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString.replace(/-/g, '/'))
  if (isNaN(date)) return 'Fecha Inválida'
  return date.toLocaleDateString()
}

const translateStatus = (status) => {
  const statuses = {
    PENDING: 'Pendiente',
    COMPLETED: 'Completada',
    CANCELED: 'Cancelada',
    DRAFT: 'Borrador',
  }
  return statuses[status] || status
}

const calculateTotal = (isDebit) => {
  const details = viewData.value?.details || []

  // FIX CRÍTICO: Comparamos el valor booleano (isDebit) con el valor numérico (1 o 0) de la API.
  const expectedDebitValue = isDebit ? 1 : 0

  const totalCents = details
    // Usamos Number(d.is_debit) para asegurarnos de que el valor de la API (1 o 0) sea un número
    .filter((d) => Number(d.is_debit) === expectedDebitValue)
    .reduce((sum, d) => {
      // FIX de Robustez: Aseguramos que el monto sea un número válido antes de multiplicar
      const amountValue = Number(d.amount) || 0

      const amountCents = Math.round(amountValue * 100)
      return sum + amountCents // El Math.abs no es necesario ya que los montos son positivos
    }, 0)

  return totalCents / 100
}
</script>

<style scoped>
/* Estilos tomados de layout.css */
.form-subtitle {
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.3rem;
}
.form-subtitle-help {
  font-size: 0.9rem;
  color: var(--color-accent-yellow);
  margin-top: 0.25rem;
  font-weight: 600;
}
.modal-large {
  max-width: 800px;
}
.details-header {
  background-color: var(--color-bg-tertiary);
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
}
.details-header p {
  margin-bottom: 0.25rem;
}
.details-table th,
.details-table td {
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
}
.details-table tfoot {
  border-top: 2px solid var(--color-accent-yellow);
}
.text-right {
  text-align: right;
}
.input-style-static {
  width: 100%;
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  min-height: 44px;
  display: flex;
  align-items: center;
}
/* CAMBIO: Estilo para el input readonly */
input:read-only {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  cursor: not-allowed;
}
</style>
