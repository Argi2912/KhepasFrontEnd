<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue' // 🚨 Importar onMounted
import api from '@/services/api'
import notify from '@/services/notify'
import { useFormValidation } from '@/utils/useFormValidation'

import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const props = defineProps({
  show: Boolean,
  accountId: [Number, String, null], // ID de la cuenta a editar
})

const emit = defineEmits(['close', 'saved'])

const { errors, handleAxiosError, getError, clearError } = useFormValidation()

// --- ESTADO LOCAL DE DIVISAS ---
const currencies = ref([]) // Lista cruda de objetos Currency
const currencyOptions = computed(() =>
  currencies.value.map((c) => ({
    id: c.code,
    name: `${c.code} - ${c.name}`,
  })),
)
// ------------------------------

const initialForm = {
  name: '',
  currency_code: 'USD', // Por defecto
  balance: 0.0,
  details: '',
}
const form = reactive({ ...initialForm })

const isLoading = ref(false)
const isSubmitting = ref(false)

const isEditing = computed(() => !!props.accountId)
const modalTitle = computed(() => (isEditing.value ? 'Editar Cuenta' : 'Crear Nueva Cuenta (Caja)'))

// --- ACCIONES ---

/**
 * Carga la lista de divisas desde el backend.
 */
const fetchCurrencies = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/currencies?per_page=999')
    currencies.value = response.data.data
    // Si la divisa por defecto no está en la lista, establecer la primera de la lista
    if (!isEditing.value && currencies.value.length > 0) {
      form.currency_code = currencies.value[0].code
    }
  } catch (error) {
    notify.error('Error al cargar la lista de divisas.')
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

/**
 * Carga los datos de la cuenta a editar.
 */
const fetchAccount = async (id) => {
  isLoading.value = true
  try {
    const response = await api.get(`/accounts/${id}`)
    Object.assign(form, response.data)
  } catch (error) {
    notify.error('No se pudo cargar la cuenta para edición.')
    emit('close')
  } finally {
    isLoading.value = false
  }
}

/**
 * Envía el formulario.
 */
const handleSubmit = async () => {
  isSubmitting.value = true
  clearError()

  try {
    if (isEditing.value) {
      await api.put(`/accounts/${props.accountId}`, form)
      notify.success('Cuenta actualizada exitosamente.')
    } else {
      await api.post('/accounts', form)
      notify.success('Cuenta creada exitosamente.')
    }
    emit('saved')
    emit('close')
  } catch (error) {
    handleAxiosError(error)
  } finally {
    isSubmitting.value = false
  }
}

/**
 * Lógica de cierre y reinicio.
 */
const resetForm = () => {
  Object.assign(form, initialForm)
  clearError()
  // Reestablece la divisa por defecto si se tiene la lista
  if (currencies.value.length > 0) {
    form.currency_code = currencies.value[0].code
  }
}

// --- WATCHERS Y LIFECYCLE ---

// Se llama cuando el modal se abre/cierra o cuando se cambia el ID de edición
watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      // Si se abre
      if (props.accountId) {
        // Modo edición: Cargar la cuenta
        fetchAccount(props.accountId)
      } else {
        // Modo creación: Resetear el formulario
        resetForm()
      }
    } else {
      // Si se cierra: Resetear el ID de edición por seguridad
      resetForm()
    }
  },
)

onMounted(() => {
  fetchCurrencies()
})
</script>

<template>
  <BaseModal :show="show" :title="modalTitle" @close="emit('close')" :is-loading="isLoading">
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <BaseInput
          v-model="form.name"
          label="Nombre de la Cuenta (Ej: Zelle, Banesco VES)"
          name="name"
          :error="getError('name')"
          placeholder="Nombre descriptivo"
          icon="fa-solid fa-file-invoice-dollar"
          required
          @input="clearError('name')"
        />
      </div>

      <div class="form-group">
        <BaseSelect
          v-model="form.currency_code"
          label="Divisa de la Cuenta"
          name="currency_code"
          :options="currencyOptions"
          :error="getError('currency_code')"
          placeholder="Seleccione una divisa"
          required
          @change="clearError('currency_code')"
          :disabled="isLoading"
        />
      </div>

      <div class="form-group">
        <BaseInput
          v-model.number="form.balance"
          label="Balance Inicial (Sólo para Creación)"
          name="balance"
          type="number"
          step="0.01"
          :error="getError('balance')"
          icon="fa-solid fa-coins"
          placeholder="0.00"
          :disabled="isEditing || isLoading"
          required
          @input="clearError('balance')"
        />
      </div>

      <div class="form-group">
        <label for="details">Detalles / Descripción (Opcional)</label>
        <textarea
          id="details"
          v-model="form.details"
          name="details"
          class="custom-textarea"
          rows="3"
          :class="{ 'input-error': getError('details') }"
          @input="clearError('details')"
        ></textarea>
        <p v-if="getError('details')" class="error-message">{{ getError('details') }}</p>
      </div>
    </form>

    <template #footer>
      <button @click="emit('close')" type="button" class="btn-cancel-modal">Cancelar</button>
      <button
        @click="handleSubmit"
        type="button"
        class="btn-submit-modal"
        :disabled="isSubmitting || isLoading"
      >
        <span v-if="isSubmitting">Guardando...</span>
        <span v-else>{{ isEditing ? 'Guardar Cambios' : 'Crear Cuenta' }}</span>
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
/* Estilos reutilizados... */
.form-group {
  margin-bottom: 20px;
}
.custom-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
  color: var(--color-text-light);
  border-radius: 6px;
  resize: vertical;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.custom-textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
  outline: none;
}
/* Estilos para los botones del footer */
.btn-cancel-modal {
  background: none;
  border: none;
  color: #aaa;
  padding: 10px 15px;
  cursor: pointer;
}
.btn-submit-modal {
  background-color: var(--color-primary);
  color: var(--color-secondary);
  padding: 10px 15px;
  border-radius: 6px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-submit-modal:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
