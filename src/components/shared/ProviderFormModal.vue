<script setup>
import { ref, reactive, computed, watch } from 'vue'

import api from '@/services/api'
import notify from '@/services/notify'
import { useFormValidation } from '@/utils/useFormValidation'

import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const props = defineProps({
  show: Boolean,
  providerId: [Number, String, null], // ID del proveedor a editar (null para crear)
})

const emit = defineEmits(['close', 'saved'])

const { errors, handleAxiosError, getError, clearError } = useFormValidation()

// Quitamos commission_percentage, solo dejamos el switch
const initialForm = {
  name: '',
  email: '',
  phone: '',
  details: '',
  is_commission_informative: false // Por defecto: False (Sí genera deuda)
}
const form = reactive({ ...initialForm })

const isLoading = ref(false)
const isSubmitting = ref(false)

const isEditing = computed(() => !!props.providerId)
const modalTitle = computed(() => (isEditing.value ? 'Editar Proveedor' : 'Nuevo Proveedor'))

const resetForm = () => {
  Object.assign(form, initialForm)
  errors.value = {}
}

const fetchProvider = async (id) => {
  if (!id) return

  isLoading.value = true
  try {
    const response = await api.get(`/providers/${id}`)

    const data = response.data
    // Asegurarnos de que el booleano se asigne correctamente para el Switch
    data.is_commission_informative = !!data.is_commission_informative

    Object.assign(form, data)
  } catch (error) {
    notify.error('No se pudo cargar el proveedor para edición.')
    emit('close')
  } finally {
    isLoading.value = false
  }
}

const handleSubmit = async () => {
  isSubmitting.value = true

  try {
    if (isEditing.value) {
      await api.put(`/providers/${props.providerId}`, form)
      notify.success(`Proveedor "${form.name}" actualizado.`)
    } else {
      await api.post('/providers', form)
      notify.success(`Proveedor "${form.name}" creado exitosamente.`)
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
  () => props.providerId,
  (newId) => {
    resetForm()
    if (newId) {
      fetchProvider(newId)
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
      <BaseInput v-model="form.name" label="Nombre / Razón Social" name="name" :error="getError('name')"
        icon="fa-solid fa-building" placeholder="Nombre o Razón Social del proveedor" required
        @input="clearError('name')" />

      <BaseInput v-model="form.email" label="Email" name="email" type="email" :error="getError('email')"
        icon="fa-solid fa-envelope" placeholder="contacto@proveedor.com" @input="clearError('email')" />

      <BaseInput v-model="form.phone" label="Teléfono" name="phone" :error="getError('phone')" icon="fa-solid fa-phone"
        placeholder="+XX XXX XXX XX XX" @input="clearError('phone')" />

      <div class="form-group commission-setting-box">
        <div class="setting-info">
          <label class="setting-title">Comisión Informativa</label>
          <span class="setting-desc">
            Si se activa, la comisión que indiques en las operaciones solo restará tu ganancia real, pero <strong>NO
              generará Deuda (Por Pagar)</strong> con este proveedor.
          </span>
        </div>

        <label class="toggle-switch">
          <input type="checkbox" v-model="form.is_commission_informative">
          <span class="slider round"></span>
        </label>
      </div>

      <div class="form-group">
        <label for="details">Detalles / Notas</label>
        <textarea id="details" v-model="form.details" rows="4" class="custom-textarea"
          placeholder="Notas importantes sobre el proveedor"></textarea>
      </div>
    </form>

    <template #footer>
      <button @click="emit('close')" type="button" class="btn-cancel-modal">Cancelar</button>
      <button @click="handleSubmit" type="button" class="btn-submit-modal" :disabled="isSubmitting || isLoading">
        <span v-if="isSubmitting">Guardando...</span>
        <span v-else>{{ isEditing ? 'Guardar Cambios' : 'Crear Proveedor' }}</span>
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
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
  transition: border-color 0.2s, box-shadow 0.2s;
}

.custom-textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
  outline: none;
}

/* --- ESTILOS PARA LA COMISIÓN INFORMATIVA --- */
.commission-setting-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  margin-bottom: 20px;
}

.setting-info {
  display: flex;
  flex-direction: column;
  padding-right: 15px;
}

.setting-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-text-light);
  margin-bottom: 4px;
}

.setting-desc {
  font-size: 0.8rem;
  color: #888;
  line-height: 1.4;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #555;
  transition: .3s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
}

input:checked+.slider {
  background-color: var(--color-primary, #10b981);
}

input:focus+.slider {
  box-shadow: 0 0 1px var(--color-primary, #10b981);
}

input:checked+.slider:before {
  transform: translateX(20px);
}

.slider.round {
  border-radius: 24px;
}

.slider.round:before {
  border-radius: 50%;
}

/* Botones footer */
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