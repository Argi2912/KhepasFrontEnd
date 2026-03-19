import { reactive, ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import notify from '@/services/notify'

export function useBalance(props, emit) {
  const authStore = useAuthStore()
  const isSubmitting = ref(false)
  const isLoading = ref(false)
  const myAccounts = ref([])
  const currencies = ref([])

  const form = reactive({
    amount: '',
    type: 'income',
    description: '',
    category: 'Carga de Saldo',
    transaction_date: new Date().toISOString().split('T')[0],
    target_account_id: null,
    percentage: '',
    debt_currency_id: null
  })

  const isProvider = computed(() => props.resource === 'providers')
  const isInvestor = computed(() => props.resource === 'investors')

  const calculatedDebt = computed(() => {
    if (!form.amount) return 0
    const amount = parseFloat(form.amount) || 0
    const pct = parseFloat(form.percentage) || 0
    return amount + (amount * (pct / 100))
  })

  const updateCategory = () => {
    if (isProvider.value) {
      form.category = 'Financiamiento / Deuda'
      return
    }
    if (form.type === 'income') {
      form.category = isInvestor.value ? 'Inyección de Capital' : 'Incremento de Saldo'
    } else {
      form.category = 'Egreso / Liquidación'
    }
  }

  const fetchData = async () => {
    isLoading.value = true
    try {
      const [accRes, currRes] = await Promise.all([
        api.get('/accounts?per_page=999'),
        api.get('/currencies?per_page=999')
      ])
      myAccounts.value = accRes.data.data
      currencies.value = currRes.data.data
    } catch (error) {
      notify.error('Fallo al sincronizar cuentas y divisas.')
    } finally {
      isLoading.value = false
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(amount || 0)
  }

  const resetForm = () => {
    Object.assign(form, {
      amount: '',
      description: '',
      target_account_id: null,
      percentage: '',
      debt_currency_id: null,
      type: 'income',
      transaction_date: new Date().toISOString().split('T')[0]
    })
    updateCategory()
  }

  const handleSubmit = async () => {
    isSubmitting.value = true
    updateCategory()

    try {
      if (isProvider.value) {
        if (!form.target_account_id) throw new Error('Debe especificar la cuenta de recepción.')
        if (!form.debt_currency_id) throw new Error('Debe definir la moneda de la obligación.')
        if (!form.amount || form.amount <= 0) throw new Error('El monto debe ser superior a cero.')

        const payload = {
          amount_received: form.amount,
          target_account_id: form.target_account_id,
          interest_percentage: form.percentage || 0,
          debt_amount: calculatedDebt.value,
          debt_currency_id: form.debt_currency_id,
          description: form.description || 'Financiamiento operativo',
          transaction_date: form.transaction_date,
          type: 'income'
        }

        await api.post(`/providers/${props.entityId}/balance`, payload)
        notify.success('Obligación financiera registrada.')
        emit('saved')
        emit('close')
        return
      }

      if (form.type === 'expense' && Number(form.amount) > props.availableBalance) {
        throw new Error(`Fondos insuficientes. Límite: ${formatCurrency(props.availableBalance)}`)
      }

      const payload = {
        account_id: props.entityId,
        user_id: authStore.authUser?.id,
        source_type: isInvestor.value ? 'investor' : 'account',
        type: form.type,
        amount: Math.abs(form.amount),
        category: form.category,
        description: form.description || 'Ajuste manual de tesorería',
        transaction_date: form.transaction_date,
        entity_type: (form.type === 'expense' && form.target_account_id) ? 'App\\Models\\Account' : null,
        entity_id: (form.type === 'expense' && form.target_account_id) ? form.target_account_id : null
      }

      await api.post('/transactions/internal', payload)
      notify.success('Operación de tesorería completada.')
      emit('saved')
      emit('close')

    } catch (error) {
       notify.error(error.response?.data?.message || error.message || 'Fallo en la operación.')
    } finally {
       isSubmitting.value = false
    }
  }

  watch(() => props.show, (val) => {
    if (val) {
      resetForm()
      fetchData()
    }
  })

  return {
    form,
    isSubmitting,
    isLoading,
    myAccounts,
    currencies,
    calculatedDebt,
    isProvider,
    isInvestor,
    formatCurrency,
    handleSubmit,
    updateCategory
  }
}
