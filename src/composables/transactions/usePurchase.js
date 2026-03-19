import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useTransactionStore } from '@/stores/transaction'
import { useAuthStore } from '@/stores/auth'
import { useFormValidation } from '@/utils/useFormValidation'
import api from '@/services/api'
import notify from '@/services/notify'
import { useRouter } from 'vue-router'

export function usePurchase() {
  const router = useRouter()
  const authStore = useAuthStore()
  const transactionStore = useTransactionStore()
  const { handleAxiosError, clearError } = useFormValidation()

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

  const commissionCharged_VES = computed(() => commissionItems.value.charged_ves)
  // Wait, I need to recalculate these properly or just use the logic from the component
  const commissionCharged_VES_raw = computed(() => commissionCharged_USD.value * form.received_rate)
  const commissionProvider_VES_raw = computed(() => commissionProvider_USD.value * form.received_rate)

  const totalVesCredit = computed(() => {
    return baseAmountInVes.value + commissionCharged_VES_raw.value + commissionProvider_VES_raw.value
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
      delivered: isDivisaDelivered.value,
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

  onMounted(() => transactionStore.fetchAllSupportData())

  return {
    // Estado
    currentStep,
    isSubmitting,
    isDivisaDelivered,
    form,
    localCurrencyCode,

    // Computed
    fromAccountOptions,
    platformAccountOptions,
    deliverCurrency,
    baseAmountInVes,
    commissionCharged_VES: commissionCharged_VES_raw,
    commissionProvider_VES: commissionProvider_VES_raw,
    commissionProvider_USD,
    totalVesCredit,
    totalUsdDebit_Platform,
    platformAccountError,
    generalAmountError,

    // Métodos
    goToNextStep,
    handleSubmit,
    formatCurrency,
  }
}
