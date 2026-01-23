<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'
import { useFormValidation } from '@/utils/useFormValidation'

import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const props = defineProps({
  show: Boolean,
  accountId: [Number, String, null],
})

const emit = defineEmits(['close', 'saved'])

const { errors, handleAxiosError, getError, clearError } = useFormValidation()

// --- ESTADO LOCAL DE DIVISAS ---
const currencies = ref([])
const currencyOptions = computed(() =>
  currencies.value.map((c) => ({
    id: c.code,
    name: `${c.code} - ${c.name}`,
  })),
)

const initialForm = {
  name: '',
  currency_code: 'USD',
  balance: 0.0,
  details: '',
}
const form = reactive({ ...initialForm })

const isLoading = ref(false)
const isSubmitting = ref(false)

const isEditing = computed(() => !!props.accountId)
const modalTitle = computed(() => (isEditing.value ? 'Editar Cuenta' : 'Crear Nueva Cuenta (Caja)'))

// --- ACCIONES ---
const fetchCurrencies = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/currencies?per_page=999')
    currencies.value = response.data.data
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

const resetForm = () => {
  Object.assign(form, initialForm)
  clearError()
  if (currencies.value.length > 0) {
    form.currency_code = currencies.value[0].code
  }
}

watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      if (props.accountId) {
        fetchAccount(props.accountId)
      } else {
        resetForm()
      }
    } else {
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
    <form @submit.prevent="handleSubmit" class="account-form">
      <div class="form-group">
        <BaseInput v-model="form.name" label="Nombre de la Cuenta (Ej: Zelle, Banesco VES)" name="name"
          :error="getError('name')" placeholder="Nombre descriptivo" icon="fa-solid fa-file-invoice-dollar" required
          @input="clearError('name')" />
      </div>

      <div class="form-group">
        <BaseSelect v-model="form.currency_code" label="Divisa de la Cuenta" name="currency_code"
          :options="currencyOptions" :error="getError('currency_code')" placeholder="Seleccione una divisa" required
          @change="clearError('currency_code')" :disabled="isLoading" />
      </div>

      <div class="form-group">
        <BaseInput v-model.number="form.balance" label="Balance Inicial (Sólo para Creación)" name="balance"
          type="number" step="0.01" :error="getError('balance')" icon="fa-solid fa-coins" placeholder="0.00"
          :disabled="isEditing || isLoading" required @input="clearError('balance')" />
      </div>

      <div class="form-group">
        <label for="details">Detalles / Descripción (Opcional)</label>
        <textarea id="details" v-model="form.details" name="details" class="custom-textarea" rows="3"
          :class="{ 'input-error': getError('details') }" @input="clearError('details')"></textarea>
        <p v-if="getError('details')" class="error-message">{{ getError('details') }}</p>
      </div>
    </form>

    <template #footer>
      <div class="modal-buttons">
        <button @click="emit('close')" type="button" class="btn-cancel-modal">Cancelar</button>
        <button @click="handleSubmit" type="button" class="btn-submit-modal" :disabled="isSubmitting || isLoading">
          <span v-if="isSubmitting">Guardando...</span>
          <span v-else>{{ isEditing ? 'Guardar Cambios' : 'Crear Cuenta' }}</span>
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-size: 0.9rem;
  color: #ccc;
}

.custom-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
  color: var(--color-text-light);
  border-radius: 6px;
  resize: vertical;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  /* Importante para width: 100% */
}

.custom-textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
  outline: none;
}

.input-error {
  border-color: #ef4444;
}

.error-message {
  color: #ef4444;
  font-size: 0.8rem;
  margin-top: 4px;
}

/* Botones Footer (Contenedor Flex) */
.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  width: 100%;
}

.btn-cancel-modal {
  background: transparent;
  border: 1px solid var(--color-border);
  color: #aaa;
  padding: 10px 20px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-cancel-modal:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.btn-submit-modal {
  background-color: var(--color-primary);
  color: #111;
  /* Contraste negro sobre amarillo */
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-submit-modal:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ==========================================================================
   RESPONSIVE (MÓVIL)
   ========================================================================== */
@media (max-width: 768px) {

  /* En móvil, los botones se apilan verticalmente */
  .modal-buttons {
    flex-direction: column-reverse;
    /* Cancelar abajo */
    gap: 12px;
  }

  .btn-cancel-modal,
  .btn-submit-modal {
    width: 100%;
    /* Botones anchos */
    padding: 14px;
    /* Más altos para el dedo */
    font-size: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* Ajuste de formulario */
  .form-group {
    margin-bottom: 15px;
  }

  .custom-textarea {
    font-size: 16px;
    /* Evita zoom en iOS */
  }
}
</style>