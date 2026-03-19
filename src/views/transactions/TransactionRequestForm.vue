<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseCard from '@/components/shared/BaseCard.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import api from '@/services/api'
import notify from '@/services/notify'
import { useTransactionRequestStore } from '@/stores/transactionRequest'
import { useTransactionStore } from '@/stores/transaction'

const router = useRouter()
const requestStore = useTransactionRequestStore()
const transactionStore = useTransactionStore()

const isSubmitting = ref(false)
const clients = ref([])

const form = reactive({
  client_id: '',
  type: 'withdrawal',
  amount: '',
  currency_code: 'USD',
  source_origin: '',
  destination_target: '',
  notes: ''
})

const errors = reactive({})

const transactionTypes = [
  { id: 'withdrawal', name: 'Retiro (Withdrawal)' },
  { id: 'exchange', name: 'Intercambio (Exchange)' }
]

onMounted(async () => {
  // Cargar clientes
  try {
    const { data } = await api.get('/clients?per_page=100')
    const clientsList = data.data || data
    clients.value = Array.isArray(clientsList) 
      ? clientsList.map(c => ({ id: c.id, name: c.name || c.alias })) 
      : []
  } catch (error) {
    notify.error('Error al cargar clientes')
  }

  // Cargar monedas si no están
  if (transactionStore.currencies.length === 0) {
    await transactionStore.fetchAllSupportData()
  }
})

const handleSubmit = async () => {
  isSubmitting.value = true
  Object.keys(errors).forEach(key => errors[key] = '')

  try {
    await requestStore.createRequest({ ...form })
    router.push({ name: 'transaction_requests_list' })
  } catch (error) {
    if (error.response?.data?.errors) {
      Object.assign(errors, error.response.data.errors)
    } else {
      notify.error(error.response?.data?.message || 'Error al procesar la solicitud')
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6 animate-fade-in">
    <div>
      <h1 class="text-3xl font-black text-white tracking-tight">Nueva Solicitud</h1>
      <p class="text-white/40 text-sm mt-1">Registra una solicitud de retiro o intercambio para un cliente.</p>
    </div>

    <BaseCard>
      <form @submit.prevent="handleSubmit" class="space-y-6">
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BaseSelect
            label="Cliente Asignado"
            :options="clients"
            v-model="form.client_id"
            required
            :error="errors.client_id?.[0]"
          />

          <BaseSelect
            label="Tipo de Operación"
            :options="transactionTypes"
            v-model="form.type"
            required
            :error="errors.type?.[0]"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BaseInput
            label="Monto a Procesar"
            type="number"
            step="0.01"
            v-model="form.amount"
            required
            :error="errors.amount?.[0]"
          />

          <BaseSelect
            label="Moneda Base"
            :options="transactionStore.getCurrencies"
            v-model="form.currency_code"
            required
            :error="errors.currency_code?.[0]"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BaseInput
            label="Origen de Fondos"
            placeholder="Ej: Banesco, Binance, Zelle..."
            v-model="form.source_origin"
            :error="errors.source_origin?.[0]"
          />

          <BaseInput
            label="Destino / Instrucción"
            placeholder="Ej: Efectivo, USDT, Cta Banesco..."
            v-model="form.destination_target"
            :error="errors.destination_target?.[0]"
          />
        </div>

        <BaseInput
          label="Notas Extra"
          v-model="form.notes"
          :error="errors.notes?.[0]"
          placeholder="Condiciones, detalles de cuenta, etc."
        />

        <div class="flex justify-end gap-3 pt-6 border-t border-white/5">
          <button 
            type="button" 
            @click="router.back()" 
            class="px-5 py-2.5 rounded-xl font-bold transition-all text-white/50 hover:text-white"
          >
            Cancelar
          </button>
          <BaseButton type="submit" :disabled="isSubmitting" variant="primary">
            <FontAwesomeIcon v-if="isSubmitting" icon="fa-solid fa-circle-notch" spin class="mr-2" />
            <FontAwesomeIcon v-else icon="fa-solid fa-paper-plane" class="mr-2" />
            {{ isSubmitting ? 'Registrando...' : 'Generar Solicitud' }}
          </BaseButton>
        </div>
      </form>
    </BaseCard>
  </div>
</template>
