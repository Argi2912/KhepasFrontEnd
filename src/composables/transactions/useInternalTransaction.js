import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import notify from '@/services/notify'
import { useAuthStore } from '@/stores/auth'
import { useTransactionStore } from '@/stores/transaction'
import { useFormValidation } from '@/utils/useFormValidation'
import { useCategories } from '@/composables/useCategories'

export function useInternalTransaction() {
  const router = useRouter()
  const authStore = useAuthStore()
  const transactionStore = useTransactionStore()
  const { errors, handleAxiosError } = useFormValidation()
  const { getCategoriesByType } = useCategories()

  const isSubmitting = ref(false)

  const lists = reactive({
    employees: [],
    clients: [],
    providers: [],
    brokers: [],
    platforms: [],
    investors: [] 
  })

  const form = reactive({
    account_id: '',
    user_id: authStore.authUser?.id,
    type: 'expense', 
    category: '',
    entity_type: '',
    entity_id: '',
    dueño: '',
    person_name: '',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_status: 'paid' 
  })

  const entityTypes = [
    { id: 'App\\Models\\Employee', name: 'Gestión de Nóminas (Empleados)' },
    { id: 'App\\Models\\Client', name: 'Clientes' },
    { id: 'App\\Models\\Provider', name: 'Proveedores' },
    { id: 'App\\Models\\Broker', name: 'Corredores' },
    { id: 'App\\Models\\Platform', name: 'Plataformas' },
    { id: 'App\\Models\\Investor', name: 'Inversionistas' },
    { id: 'manual', name: 'Otro / Manual' }
  ]

  const categoryOptions = computed(() => {
    return getCategoriesByType(form.type).map(cat => ({ id: cat, name: cat }))
  })

  const entityOptions = computed(() => {
    switch (form.entity_type) {
      case 'App\\Models\\Employee': return lists.employees
      case 'App\\Models\\Client': return lists.clients
      case 'App\\Models\\Provider': return lists.providers
      case 'App\\Models\\Broker': return lists.brokers
      case 'App\\Models\\Platform': return lists.platforms
      case 'App\\Models\\Investor': return lists.investors
      default: return []
    }
  })

  const fetchSupportData = async () => {
    await transactionStore.fetchAllSupportData()

    const fetchList = async (url, listKey, mapper) => {
      try {
        const { data } = await api.get(url)
        lists[listKey] = (data.data || data).map(mapper)
      } catch (e) {
        console.warn(`No se pudo cargar: ${listKey}`, e)
      }
    }

    await Promise.all([
      fetchList('/clients?per_page=100', 'clients', x => ({ id: x.id, name: x.name || x.alias })),
      fetchList('/providers?per_page=100', 'providers', x => ({ id: x.id, name: x.name || x.alias })),
      fetchList('/brokers?per_page=100', 'brokers', x => ({ id: x.id, name: x.name || x.alias })),
      fetchList('/platforms?per_page=100', 'platforms', x => ({ id: x.id, name: x.name })),
      fetchList('/employees?per_page=100', 'employees', x => ({ id: x.id, name: x.name })),
      fetchList('/investors?per_page=100', 'investors', x => ({ id: x.id, name: x.name || x.alias }))
    ])
  }

  onMounted(fetchSupportData)

  watch(() => form.entity_type, () => {
    form.entity_id = ''
    form.person_name = ''
    form.dueño = ''
  })

  watch(() => form.entity_id, (newId) => {
    if (!newId || form.entity_type === 'manual') return
    const selected = entityOptions.value.find(item => item.id === newId)
    if (selected) {
      form.person_name = selected.name
      const typeName = entityTypes.find(t => t.id === form.entity_type)?.name
      form.dueño = typeName || 'Registrado'
    }
  })

  const handleSubmit = async () => {
    isSubmitting.value = true
    Object.keys(errors).forEach(key => errors[key] = '')

    try {
      const payload = { ...form, source_type: 'account' }
      if (payload.entity_type === 'manual') {
        payload.entity_type = null
        payload.entity_id = null
      }

      await api.post('/transactions/internal', payload)
      notify.success('Transacción registrada exitosamente')
      router.back()
    } catch (error) {
      if (error.response?.data?.message) {
        errors.amount = error.response.data.message
        return
      }
      handleAxiosError(error)
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    form,
    lists,
    entityTypes,
    categoryOptions,
    entityOptions,
    isSubmitting,
    errors,
    handleSubmit,
    transactionStore,
    router
  }
}
