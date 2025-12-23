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
  <div v-if="show" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Trasladar Fondos a Mis Cuentas</h3>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>

      <div class="modal-body">
        <div class="info-box">
          <p>Origen: <strong>{{ investor?.name }}</strong></p>
          <p>Saldo Disponible: <strong class="text-green">{{ maxAvailable.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD' }) }}</strong></p>
          <p class="note">Nota: Esto solo afecta la liquidez, no el Capital Base.</p>
        </div>

        <form @submit.prevent="handleSubmit">
          <BaseSelect label="Destino (Tu Cuenta/Caja)" :options="transactionStore.getAccounts"
            v-model="form.destination_account_id" required placeholder="Selecciona tu cuenta..." />

          <BaseInput label="Monto a Mover" type="number" step="0.01" v-model="form.amount" required />

          <p v-if="hasInsufficientFunds" class="error-text">
            ⚠️ El monto excede el saldo disponible ({{ maxAvailable }})
          </p>

          <BaseInput label="Fecha" type="date" v-model="form.transaction_date" required />
          <BaseInput label="Nota (Opcional)" v-model="form.description" />

          <div class="modal-actions">
            <button type="button" @click="$emit('close')" class="btn-cancel">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="isSubmitting || hasInsufficientFunds">
              {{ isSubmitting ? 'Procesando...' : 'Transferir' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #1e2023;
  padding: 25px;
  border-radius: 12px;
  width: 450px;
  color: white;
  border: 1px solid #333;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #333;
  padding-bottom: 10px;
}

.close-btn {
  background: none;
  border: none;
  color: #aaa;
  font-size: 1.5rem;
  cursor: pointer;
}

.info-box {
  background: rgba(255, 255, 255, 0.05);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 0.9rem;
}

.text-green {
  color: #27ae60;
}

.note {
  font-size: 0.8rem;
  color: #888;
  margin-top: 5px;
  font-style: italic;
}

.error-text {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: -10px;
  margin-bottom: 10px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary {
  background: #fcd535;
  color: black;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  background: transparent;
  border: 1px solid #555;
  color: #ccc;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}
</style>