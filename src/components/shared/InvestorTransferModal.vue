<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useTransactionStore } from '@/stores/transaction'
import { useAuthStore } from '@/stores/auth' // <--- 1. IMPORTAR AUTH STORE
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import notify from '@/services/notify'

const props = defineProps({
  show: Boolean,
  investor: Object
})

const emit = defineEmits(['close', 'saved'])
const transactionStore = useTransactionStore()
const authStore = useAuthStore() // <--- 2. INICIALIZAR AUTH STORE
const isSubmitting = ref(false)

const form = reactive({
  amount: '',
  destination_account_id: '',
  description: '',
  transaction_date: new Date().toISOString().split('T')[0]
})

onMounted(async () => {
  if (transactionStore.getAccounts.length === 0) {
    await transactionStore.fetchAllSupportData()
  }
})

const maxAvailable = computed(() => {
  return parseFloat(props.investor?.current_balance || props.investor?.available_balance || 0)
})

const hasInsufficientFunds = computed(() => {
  const amount = parseFloat(form.amount)
  if (!amount) return false
  return amount > maxAvailable.value
})

const handleSubmit = async () => {
  if (hasInsufficientFunds.value) return notify.error('Saldo insuficiente')

  isSubmitting.value = true
  try {
    await transactionStore.createInternalTransaction({
      // DATOS DE ORIGEN
      source_type: 'investor',
      account_id: props.investor.id,
      type: 'expense',

      // DATOS DE DESTINO
      entity_type: 'App\\Models\\Account',
      entity_id: form.destination_account_id,

      // DATOS DE LA TRANSACCIÓN
      amount: form.amount,
      category: 'Transferencia de Capital a Caja',
      description: form.description || `Traslado de fondos de ${props.investor.name}`,
      transaction_date: form.transaction_date,

      // 👇 3. AQUÍ ESTABA EL ERROR: FALTABA EL ID DEL USUARIO
      user_id: authStore.authUser?.id
    })

    notify.success('Dinero movido exitosamente')
    emit('saved')
    emit('close')

    // Limpiar
    form.amount = ''
    form.destination_account_id = ''
    form.description = ''

  } catch (error) {
    console.error(error)
    // Mostrar error exacto si viene del backend
    const msg = error.response?.data?.message || 'Error al mover los fondos'
    notify.error(msg)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 bg-black/60 flex justify-center items-center z-[1000]">
    <div class="bg-background p-6 rounded-xl w-[450px] text-white border border-white/10">
      <div class="flex justify-between items-center mb-5 border-b border-white/10 pb-3">
        <h3 class="text-lg font-bold text-primary">Trasladar Fondos a Mis Cuentas</h3>
        <button @click="$emit('close')" class="bg-transparent border-none text-white/50 text-2xl cursor-pointer hover:text-white">&times;</button>
      </div>

      <div class="bg-white/5 p-4 rounded-lg mb-5 text-sm">
        <p>Origen: <strong class="text-white">{{ investor?.name }}</strong></p>
        <p>Saldo Disponible: <strong class="text-success">{{ maxAvailable.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}</strong></p>
        <p class="text-xs text-white/40 mt-1 italic">Nota: Esto solo afecta la liquidez, no el Capital Base.</p>
      </div>

      <form @submit.prevent="handleSubmit">
        <BaseSelect label="Destino (Tu Cuenta/Caja)" :options="transactionStore.getAccounts" v-model="form.destination_account_id" required placeholder="Selecciona tu cuenta..." />
        <BaseInput label="Monto a Mover" type="number" step="0.01" v-model="form.amount" required />

        <p v-if="hasInsufficientFunds" class="text-danger text-sm -mt-3 mb-3">
          ⚠️ El monto excede el saldo disponible ({{ maxAvailable }})
        </p>

        <BaseInput label="Fecha" type="date" v-model="form.transaction_date" required />
        <BaseInput label="Nota (Opcional)" v-model="form.description" />

        <div class="flex justify-end gap-3 mt-5">
          <button type="button" @click="$emit('close')" class="bg-transparent border border-white/20 text-white/70 py-2.5 px-5 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">Cancelar</button>
          <button type="submit" class="bg-primary text-black py-2.5 px-5 border-none rounded-lg font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors" :disabled="isSubmitting || hasInsufficientFunds">
            {{ isSubmitting ? 'Procesando...' : 'Transferir' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>