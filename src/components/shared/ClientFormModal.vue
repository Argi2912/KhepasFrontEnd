<script setup>
import { ref, reactive, computed, watch } from 'vue'

import api from '@/services/api'
import notify from '@/services/notify'
import { useFormValidation } from '@/utils/useFormValidation'

import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const props = defineProps({
  show: Boolean,
  clientId: [Number, String, null], // ID del cliente a editar (null para crear)
})

const emit = defineEmits(['close', 'saved'])

const { errors, handleAxiosError, getError, clearError } = useFormValidation()

const initialForm = {
  name: '',
  email: '',
  phone: '',
  details: '',
}
const form = reactive({ ...initialForm })

const isLoading = ref(false)
const isSubmitting = ref(false)

const isEditing = computed(() => !!props.clientId)
const modalTitle = computed(() => (isEditing.value ? 'Editar Cliente' : 'Nuevo Cliente'))

const resetForm = () => {
  Object.assign(form, initialForm)
  errors.value = {}
}

const fetchClient = async (id) => {
  if (!id) return

  isLoading.value = true
  try {
    const response = await api.get(`/clients/${id}`)
    Object.assign(form, response.data)
  } catch (error) {
    notify.error('No se pudo cargar el cliente para edición.')
    emit('close')
  } finally {
    isLoading.value = false
  }
}

/**
 * Envía el formulario (Crear o Actualizar).
 * Llamado directamente por el botón en el footer.
 */
const handleSubmit = async () => {
  isSubmitting.value = true

  try {
    if (isEditing.value) {
      await api.put(`/clients/${props.clientId}`, form)
      notify.success(`Cliente "${form.name}" actualizado.`)
    } else {
      await api.post('/clients', form)
      notify.success(`Cliente "${form.name}" creado exitosamente.`)
    }

    emit('saved')
    emit('close')
  } catch (error) {
    handleAxiosError(error)
  } finally {
    isSubmitting.value = false
  }
}

watch(
  () => props.clientId,
  (newId) => {
    resetForm()
    if (newId) {
      fetchClient(newId)
    }
  },
  { immediate: true },
)

watch(
  () => props.show,
  (newVal) => {
    if (!newVal) {
      resetForm()
    }
  },
)
</script>

<template>
  <BaseModal :show="show" :title="modalTitle" @close="emit('close')">
    <form class="modal-form">
      <BaseInput
        v-model="form.name"
        label="Nombre / Razón Social"
        name="name"
        :error="getError('name')"
        icon="fa-solid fa-user-circle"
        placeholder="Nombre o Razón Social"
        required
        @input="clearError('name')"
      />

      <BaseInput
        v-model="form.email"
        label="Email"
        name="email"
        type="email"
        :error="getError('email')"
        icon="fa-solid fa-envelope"
        placeholder="contacto@cliente.com"
        @input="clearError('email')"
      />

      <BaseInput
        v-model="form.phone"
        label="Teléfono"
        name="phone"
        :error="getError('phone')"
        icon="fa-solid fa-phone"
        placeholder="+XX XXX XXX XX XX"
        @input="clearError('phone')"
      />

      <div class="form-group">
        <label for="details">Detalles / Notas</label>
        <textarea
          id="details"
          v-model="form.details"
          rows="4"
          class="custom-textarea"
          placeholder="Notas importantes sobre el cliente"
        ></textarea>
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
        <span v-else>{{ isEditing ? 'Guardar Cambios' : 'Crear Cliente' }}</span>
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
/* Estilos para el formulario dentro del modal */
.modal-form {
  /* Mantiene el flujo de los inputs */
}

/* Estilo para el textarea (replicando BaseInput) */
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

.form-group {
  margin-bottom: 20px;
}

/* Estilos para los botones del footer */
.btn-cancel-modal {
  background: none;
  border: none;
  color: #aaa;
  padding: 10px 15px;
  cursor: pointer;
  margin-right: 10px;
}

.btn-submit-modal {
  padding: 10px 20px;
  background-color: var(--color-success);
  color: var(--color-secondary);
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-submit-modal:hover:not(:disabled) {
  background-color: #0dcf92;
}
.btn-submit-modal:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
