<script setup>
import { ref, reactive, computed, watch } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'
import { useFormValidation } from '@/utils/useFormValidation'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const props = defineProps({
  show: Boolean,
  currencyId: [Number, String, null], // CAMBIO: Recibe ID numérico
})

const emit = defineEmits(['close', 'saved'])
const { errors, handleAxiosError, getError, clearError } = useFormValidation()

const initialForm = { code: '', name: '' }
const form = reactive({ ...initialForm })
const isLoading = ref(false)
const isSubmitting = ref(false)

const isEditing = computed(() => !!props.currencyId)
const modalTitle = computed(() => (isEditing.value ? 'Editar Divisa' : 'Crear Nueva Divisa'))

const resetForm = () => {
  Object.assign(form, initialForm)
  clearError()
}

// Carga datos por ID
const fetchCurrency = async (id) => {
  if (!id) return
  isLoading.value = true
  try {
    // CAMBIO: GET por ID
    const response = await api.get(`/currencies/${id}`)
    Object.assign(form, response.data)
  } catch (error) {
    notify.error('No se pudo cargar la divisa para edición.')
    emit('close')
  } finally {
    isLoading.value = false
  }
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    if (isEditing.value) {
      // CAMBIO: PUT por ID
      await api.put(`/currencies/${props.currencyId}`, { name: form.name })
      notify.success(`Divisa "${form.name}" actualizada.`)
    } else {
      await api.post('/currencies', form)
      notify.success(`Divisa "${form.name}" creada exitosamente.`)
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
  () => props.currencyId,
  (newId) => {
    resetForm()
    if (newId) fetchCurrency(newId)
  },
  { immediate: true },
)

watch(
  () => props.show,
  (newVal) => {
    if (!newVal) resetForm()
  },
)
</script>

<template>
  <BaseModal :show="show" :title="modalTitle" @close="emit('close')" :is-loading="isLoading">
    <form class="modal-form" @submit.prevent="handleSubmit">
      <BaseInput
        v-model="form.code"
        label="Código ISO"
        name="code"
        :error="getError('code')"
        placeholder="Ej: USD"
        required
        :disabled="isEditing"
        :maxlength="3"
        @input="((form.code = form.code.toUpperCase()), clearError('code'))"
      />

      <BaseInput
        v-model="form.name"
        label="Nombre Completo"
        name="name"
        :error="getError('name')"
        placeholder="Ej: Dólar Estadounidense"
        required
        @input="clearError('name')"
      />
    </form>

    <template #footer>
      <button @click="emit('close')" type="button" class="btn-cancel-modal">Cancelar</button>
      <button
        @click="handleSubmit"
        type="submit"
        class="btn-submit-modal"
        :disabled="isSubmitting || isLoading"
      >
        <span v-if="isSubmitting">Guardando...</span>
        <span v-else>{{ isEditing ? 'Guardar Cambios' : 'Crear Divisa' }}</span>
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
/* (Mismos estilos que tenías) */
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
