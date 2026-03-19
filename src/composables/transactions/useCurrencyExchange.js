import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useTransactionStore } from '@/stores/transaction'
import { useAuthStore } from '@/stores/auth'
import { useFormValidation } from '@/utils/useFormValidation'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

export function useCurrencyExchange() {
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
  const lastEditedDivisa = ref('') // 'commission' | 'amount'
  const clientReceivesAmount = ref('') // Monto final que recibe el cliente (Divisa)

  const form = reactive({
    client_id: '',
    capital_type: 'own',
    investor_id: '',
    investor_profit_pct: 0,
    investor_profit_amount: 0,
    broker_id: null,
    provider_id: null,
    platform_id: null,
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

  // --- FUNCIÓN DE RECARGA EN TIEMPO REAL ---
  const handleDataReload = async () => {
    await transactionStore.fetchAllSupportData()
  }

  // --- HELPERS DE EDICIÓN ---
  const onEditSent = () => (lastEdited.value = 'sent')
  const onEditReceived = () => (lastEdited.value = 'received')
  const onEditRate = () => (lastEdited.value = 'rate')
  const onEditClientReceives = () => (lastEditedDivisa.value = 'amount')

  // --- COMPUTED HELPERS ---
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

    const amountToCheck = parseFloat(form.amount_sent) || 0

    if (form.capital_type === 'own') {
      if (!fromAccount.value || !amountToCheck) return true
      const rawAccount = transactionStore.getAccounts?.find((a) => a.id == form.from_account_id)
      return rawAccount ? parseFloat(rawAccount.balance) >= amountToCheck : true
    }
    if (form.capital_type === 'investor') {
      if (!selectedInvestor.value || !amountToCheck) return true
      const investorBal = parseFloat(
        selectedInvestor.value.available_balance || selectedInvestor.value.current_balance || 0,
      )
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

  // --- LÓGICA MATEMÁTICA ---

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

  // --- WATCHERS ---

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
          } else if (lastEdited.value === 'received' && r > 0) {
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

  watch(
    () => form.commission_charged_pct,
    (newPct) => {
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
    },
  )

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

  watch(operationType, () => {
    // Reset de formulario al cambiar pestaña
    form.from_account_id = ''
    form.to_account_id = ''
    form.amount_sent = ''
    form.amount_received = ''
    form.exchange_rate = ''
    form.buy_rate = ''
    form.received_rate = ''
    form.provider_id = null
    form.platform_id = null
    form.broker_id = null
    form.commission_charged_pct = 0
    form.commission_provider_pct = 0
    form.commission_admin_pct = 0
    form.commission_broker_pct = 0
    clientReceivesAmount.value = ''
    lastEditedDivisa.value = ''
    Object.keys(errors.value).forEach((key) => clearError(key))
    resetCommissions()
  })

  // --- NAVEGACIÓN ---
  const nextStep = () => {
    if (currentStep.value === 1) {
      const isExternalCapital = ['investor'].includes(form.capital_type)
      const missingFrom = isExternalCapital ? false : !form.from_account_id

      if (missingFrom || !form.to_account_id || !form.client_id) {
        return Swal.fire('Falta información', 'Complete los campos obligatorios (*).', 'warning')
      }
    }
    if (currentStep.value < totalSteps) currentStep.value++
  }
  const prevStep = () => {
    if (currentStep.value > 1) currentStep.value--
  }

  // --- CONFIRMACIÓN SEGURA ---
  const handleConfirm = async () => {
    if (!hasSufficientBalance.value) return Swal.fire('Error', 'Saldo insuficiente', 'error')

    if (operationType.value === 'purchase') {
      if (!form.buy_rate || !form.received_rate)
        return Swal.fire('Falta Datos', 'Ingrese ambas tasas (Compra y Mercado).', 'warning')
    }

    isSubmitting.value = true

    try {
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

      if (operationType.value === 'currency_change') {
        payload.operation_type = 'exchange'
        const amountOut = parseFloat(clientReceivesAmount.value)
        const amountIn = parseFloat(form.amount_received)

        payload.amount_sent = amountOut
        payload.amount_received = amountIn
        payload.exchange_rate =
          amountIn > 0 && amountOut > 0 ? (amountIn / amountOut).toFixed(8) : 1
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
      const backendError = error.response?.data?.error
      const backendMessage = error.response?.data?.message
      const finalExplanation =
        backendError || backendMessage || error.message || 'Ocurrió un error en el servidor.'

      Swal.fire({
        title: 'Operación Rechazada',
        text: finalExplanation,
        icon: 'error',
        confirmButtonColor: '#e74c3c',
      })
    } finally {
      isSubmitting.value = false
    }
  }

  onMounted(async () => {
    await transactionStore.fetchAllSupportData()
  })

  return {
    // Estado
    currentStep,
    totalSteps,
    isSubmitting,
    operationType,
    form,
    clientReceivesAmount,
    errors,

    // Getters / Computed
    selectedInvestor,
    isComplexExchange,
    sourceAccounts,
    destinationAccounts,
    fromAccount,
    toAccount,
    selectedPlatform,
    selectedProvider,
    selectedBroker,
    sourceName,
    sourceCurrency,
    commissionCurrency,
    hasSufficientBalance,
    exchangePercentage,

    // Métodos
    handleDataReload,
    onEditSent,
    onEditReceived,
    onEditRate,
    onEditClientReceives,
    nextStep,
    prevStep,
    handleConfirm,
    getError,
    clearError,
  }
}
