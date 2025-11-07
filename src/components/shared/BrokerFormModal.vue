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
  brokerId: [Number, String, null], // ID del corredor a editar
})

const emit = defineEmits(['close', 'saved'])

const { errors, handleAxiosError, getError, clearError } = useFormValidation()

const initialForm = {
  user_id: null,
  default_commission_rate: 0.0,
}
const form = reactive({ ...initialForm })

const usersOptions = ref([]) // Opciones para BaseSelect
const isLoading = ref(false)
const isSubmitting = ref(false)

const isEditing = computed(() => !!props.brokerId)
const modalTitle = computed(() =>
  isEditing.value ? 'Editar Tasa del Corredor' : 'Registrar Nuevo Corredor',
)
const commissionKey = 'default_commission_rate'

const resetForm = () => {
  Object.assign(form, initialForm)
  errors.value = {}
}

/**
 * Carga usuarios que aún NO son corredores (solo en modo creación).
 */
const fetchUsersOptions = async () => {
  try {
    // Asumimos que el endpoint /users acepta un filtro para traer solo los que no son corredores.
    // Si no, cargamos todos y el backend debe manejar la validación/asignación de rol.
    const response = await api.get('/users', { params: { filter_by_role: 'non_broker' } })

    usersOptions.value = response.data.data.map((u) => ({
      id: u.id,
      name: `${u.name} (${u.email})`,
    }))
  } catch (error) {
    notify.error('Error al cargar la lista de usuarios para asignar.')
  }
}

/**
 * Carga los datos del corredor si estamos editando.
 */
const fetchBroker = async (id) => {
  if (!id) return

  isLoading.value = true
  try {
    const response = await api.get(`/brokers/${id}`)

    // Solo actualizamos la tasa en edición
    form.default_commission_rate = response.data[commissionKey]
  } catch (error) {
    notify.error('No se pudo cargar el corredor para edición.')
    emit('close')
  } finally {
    isLoading.value = false
  }
}

/**
 * Envía el formulario (Crear o Actualizar).
 */
const handleSubmit = async () => {
  isSubmitting.value = true

  try {
    if (isEditing.value) {
      // 🚨 En edición, solo se actualiza la tasa
      await api.put(`/brokers/${props.brokerId}`, { [commissionKey]: form[commissionKey] })
      notify.success(`Tasa de comisión actualizada.`)
    } else {
      // 🚨 En creación, se requiere user_id y la tasa
      await api.post('/brokers', form)
      notify.success(`Corredor registrado exitosamente.`)
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
  () => props.brokerId,
  (newId) => {
    resetForm()
    if (newId) {
      fetchBroker(newId)
    }
  },
  { immediate: true },
)

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      fetchUsersOptions() // Cargar usuarios cada vez que se abre en modo CREATE
    } else {
      resetForm()
    }
  },
)

onMounted(() => {
  fetchUsersOptions()
})
</script>

<template>
  <BaseModal :show="show" :title="modalTitle" @close="emit('close')">
    <form class="modal-form">
      <BaseSelect
        v-if="!isEditing"
        v-model="form.user_id"
        label="Usuario del Tenant a Asignar"
        name="user_id"
        :options="usersOptions"
        track-by="id"
        label-by="name"
        :error="getError('user_id')"
        placeholder="Seleccione un usuario disponible"
        required
        @change="clearError('user_id')"
      />

      <BaseInput
        v-model.number="form.default_commission_rate"
        label="Tasa de Comisión por Defecto (%)"
        name="default_commission_rate"
        type="number"
        step="0.01"
        :error="getError('default_commission_rate')"
        icon="fa-solid fa-percent"
        placeholder="1.50"
        required
        @input="clearError('default_commission_rate')"
      />

      <p v-if="isEditing" class="note-editing">
        Solo se puede actualizar la tasa de comisión. El usuario asignado es permanente.
      </p>
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
        <span v-else>{{ isEditing ? 'Actualizar Tasa' : 'Registrar Corredor' }}</span>
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
/* Estilos para el formulario dentro del modal */
.modal-form {
  /* No hay necesidad de max-width aquí ya que el modal lo limita */
}
.note-editing {
  background-color: var(--color-hover);
  padding: 10px;
  border-left: 3px solid var(--color-primary);
  font-size: 0.9rem;
  color: #ccc;
  margin-top: -10px;
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
