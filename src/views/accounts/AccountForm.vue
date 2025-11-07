<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import notify from '@/services/notify'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue' // Usamos el componente Select

const route = useRoute()
const router = useRouter()

const form = reactive({
  name: '',
  type: 'bank', // bank, cash, digital, etc.
  currency_code: 'USD',
  initial_balance: 0.0,
  details: '',
})

const errors = ref({})
const isLoading = ref(false)

const isEditing = computed(() => !!route.params.id)
const pageTitle = computed(() => (isEditing.value ? 'Editar Cuenta' : 'Nueva Cuenta Bancaria/Caja'))

// Opciones estáticas (idealmente vendrían de un endpoint /currencies)
const currencyOptions = [
  { code: 'USD', name: 'Dólar Americano' },
  { code: 'EUR', name: 'Euro' },
  { code: 'VED', name: 'Bolívar Digital' },
  { code: 'COP', name: 'Peso Colombiano' },
]

const accountTypeOptions = [
  { id: 'bank', name: 'Cuenta Bancaria' },
  { id: 'cash', name: 'Caja Chica (Efectivo)' },
  { id: 'digital', name: 'Billetera Digital' },
]

/**
 * Carga los datos de la cuenta si estamos en modo edición.
 */
const fetchAccount = async () => {
  if (!isEditing.value) return

  isLoading.value = true
  try {
    const response = await api.get(`/accounts/${route.params.id}`)

    // Rellenar el formulario
    Object.assign(form, response.data)
  } catch (error) {
    notify.error('No se pudo cargar la cuenta para edición.')
    router.push({ name: 'accounts_list' })
  } finally {
    isLoading.value = false
  }
}

/**
 * Envía el formulario (Crear o Actualizar).
 */
const handleSubmit = async () => {
  isLoading.value = true
  errors.value = {}

  try {
    let response

    if (isEditing.value) {
      // Nota: en edición, normalmente no se permite cambiar la moneda o el balance inicial.
      // Laravel debería ignorar esos campos.
      response = await api.put(`/accounts/${route.params.id}`, form)
      notify.success(`Cuenta "${response.data.name}" actualizada.`)
    } else {
      response = await api.post('/accounts', form)
      notify.success(`Cuenta "${response.data.name}" creada exitosamente.`)
    }

    router.push({ name: 'accounts_list' })
  } catch (error) {
    if (error.response && error.response.status === 422) {
      errors.value = error.response.data.errors
    }
    console.error('Error submitting form:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchAccount()
})
</script>

<template>
  <div class="account-form-view">
    <h2>{{ pageTitle }}</h2>

    <form @submit.prevent="handleSubmit" class="form-card">
      <BaseInput
        v-model="form.name"
        label="Nombre de la Cuenta"
        name="name"
        :error="errors.name ? errors.name[0] : ''"
        placeholder="Ej: Banesco Dólares, Caja General"
        required
      />

      <BaseSelect
        v-model="form.type"
        label="Tipo"
        name="type"
        :options="accountTypeOptions"
        track-by="id"
        label-by="name"
        :error="errors.type ? errors.type[0] : ''"
        placeholder="Seleccione el tipo de cuenta"
        required
      />

      <BaseSelect
        v-model="form.currency_code"
        label="Moneda"
        name="currency_code"
        :options="currencyOptions"
        track-by="code"
        label-by="name"
        :error="errors.currency_code ? errors.currency_code[0] : ''"
        placeholder="USD, EUR, VED..."
        :disabled="isEditing"
        required
      />

      <BaseInput
        v-model="form.initial_balance"
        label="Balance Inicial"
        name="initial_balance"
        type="number"
        step="0.01"
        :disabled="isEditing"
        :error="errors.initial_balance ? errors.initial_balance[0] : ''"
        required
      />

      <div class="form-group">
        <label for="details">Detalles / Notas</label>
        <textarea
          id="details"
          v-model="form.details"
          rows="3"
          placeholder="Información adicional (Ej: Banco, Nro. de cuenta)"
        ></textarea>
      </div>

      <div class="form-actions">
        <button type="submit" class="submit-btn" :disabled="isLoading">
          <span v-if="isLoading">Guardando...</span>
          <span v-else>{{ isEditing ? 'Actualizar Cuenta' : 'Crear Cuenta' }}</span>
        </button>
        <router-link :to="{ name: 'accounts_list' }" class="btn-cancel"> Cancelar </router-link>
      </div>
    </form>
  </div>
</template>

<style scoped>
.form-card {
  background-color: var(--color-secondary);
  padding: 30px;
  border-radius: 8px;
  max-width: 600px;
  margin-top: 20px;
}
/* Estilos adicionales para textarea si no está en BaseInput */
textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
  color: var(--color-text-light);
  border-radius: 4px;
  resize: vertical;
}
.form-group {
  margin-bottom: 18px;
}
.form-actions {
  margin-top: 30px;
  display: flex;
  gap: 15px;
  align-items: center;
}
.submit-btn {
  padding: 12px 20px;
  background-color: var(--color-primary);
  color: var(--color-secondary);
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition:
    background-color 0.2s,
    opacity 0.2s;
}
.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-cancel {
  color: var(--color-text-light);
  text-decoration: none;
  opacity: 0.8;
}
.btn-cancel:hover {
  opacity: 1;
}
</style>
