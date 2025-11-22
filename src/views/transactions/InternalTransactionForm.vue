<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useTransactionStore } from '@/stores/transaction'
import { useAuthStore } from '@/stores/auth'
import { useFormValidation } from '@/utils/useFormValidation'
import { useRouter } from 'vue-router'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'

const router = useRouter()
const authStore = useAuthStore()
const transactionStore = useTransactionStore()
const { errors, handleAxiosError } = useFormValidation()

const isSubmitting = ref(false)

// Formulario actualizado
const form = reactive({
  account_id: '',
  user_id: authStore.authUser?.id,
  type: 'expense', // expense | income
  category: '',
  dueño: '',       // Dueño de la cuenta bancaria/caja
  person_name: '', // NUEVO: Nombre de la persona (quien recibe o entrega)
  amount: '',
  description: '',
  transaction_date: new Date().toISOString().split('T')[0],
})

onMounted(() => transactionStore.fetchAllSupportData())

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    await transactionStore.createInternalTransaction(form)
    router.push({ name: 'transactions_home' })
  } catch (error) {
    handleAxiosError(error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="internal-container">
    <h1>Movimiento de Caja (Interno)</h1>

    <div class="card">
      <form @submit.prevent="handleSubmit">
        <div class="type-selector">
          <label :class="{ active: form.type === 'income', income: true }">
            <input type="radio" value="income" v-model="form.type" />
            INGRESO / APORTE
          </label>
          <label :class="{ active: form.type === 'expense', expense: true }">
            <input type="radio" value="expense" v-model="form.type" />
            EGRESO / GASTO
          </label>
        </div>

        <div class="form-grid">
          <BaseSelect
            label="Cuenta Afectada"
            :options="transactionStore.getAccounts"
            v-model="form.account_id"
            required
            :error="errors.account_id"
          />

          <BaseInput
            label="Monto"
            type="number"
            v-model="form.amount"
            required
            :error="errors.amount"
          />
          
          <BaseInput
            label="Dueño de la Cuenta"
            placeholder="Titular de la cuenta"
            v-model="form.dueño"
            required
            :error="errors.dueño"
          />

          <BaseInput
            label="Nombre de la Persona"
            placeholder="Quien entrega o recibe el dinero"
            v-model="form.person_name"
            required
            :error="errors.person_name"
          />
        </div>

        <BaseInput
          label="Categoría (Ej: Nómina, Servicios, Alquiler)"
          v-model="form.category"
          required
          :error="errors.category"
          class="mt-4"
        />

        <BaseInput 
            label="Descripción / Notas" 
            v-model="form.description" 
            class="mt-4"
        />

        <div class="actions">
          <button type="button" @click="router.back()" class="btn-cancel">Cancelar</button>
          <button type="submit" class="btn-save" :disabled="isSubmitting">
            {{ isSubmitting ? 'Guardando...' : 'Registrar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.internal-container {
  max-width: 600px;
  margin: 20px auto;
}
.card {
  background: var(--color-secondary);
  padding: 30px;
  border-radius: 10px;
}

.type-selector {
  display: flex;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}
.type-selector label {
  flex: 1;
  text-align: center;
  padding: 15px;
  cursor: pointer;
  font-weight: bold;
  opacity: 0.7;
}
.type-selector input {
  display: none;
}
.type-selector label.active {
  opacity: 1;
  color: white;
}
.type-selector label.income.active {
  background-color: #28a745;
}
.type-selector label.expense.active {
  background-color: #dc3545;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 20px;
}

.btn-save {
  background: var(--color-primary);
  color: white;
  padding: 10px 25px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
.btn-cancel {
  background: transparent;
  border: 1px solid #ccc;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}
</style>
