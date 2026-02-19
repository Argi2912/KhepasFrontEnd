<script setup>
import { ref, reactive, watch } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'
import { useFormValidation } from '@/utils/useFormValidation'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const props = defineProps({
  show: Boolean,
  user: Object, // El usuario a editar
})

const emit = defineEmits(['close', 'saved'])
const { errors, handleAxiosError, getError, clearError } = useFormValidation()

const form = reactive({
  name: '',
  email: '',
  is_active: true,
})

const isSubmitting = ref(false)

const resetForm = () => {
  form.name = ''
  form.email = ''
  form.is_active = true
  clearError()
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    await api.put(`/superadmin/users/${props.user.id}`, {
      name: form.name,
      email: form.email,
      is_active: form.is_active,
    })
    notify.success(`Usuario "${form.name}" actualizado.`)
    emit('saved')
    emit('close')
  } catch (error) {
    handleAxiosError(error)
  } finally {
    isSubmitting.value = false
  }
}

// Cuando el usuario cambia, cargar datos en el form
watch(
  () => props.user,
  (newUser) => {
    if (newUser) {
      form.name = newUser.name
      form.email = newUser.email
      form.is_active = newUser.is_active
    }
  },
  { immediate: true },
)

watch(
  () => props.show,
  (val) => {
    if (!val) resetForm()
  },
)
</script>

<template>
  <BaseModal :show="show" title="Editar Usuario" @close="emit('close')">
    <form class="modal-form" @submit.prevent="handleSubmit">
      <BaseInput v-model="form.name" label="Nombre Completo" name="name" :error="getError('name')"
        icon="fa-solid fa-user" required @input="clearError('name')" />

      <BaseInput v-model="form.email" label="Email" name="email" type="email" :error="getError('email')"
        icon="fa-solid fa-envelope" required @input="clearError('email')" />

      <div class="toggle-row">
        <span class="toggle-label">Estado del Usuario</span>
        <label class="toggle-switch">
          <input type="checkbox" v-model="form.is_active" />
          <span class="toggle-slider"></span>
        </label>
        <span :class="['toggle-status', form.is_active ? 'active' : 'inactive']">
          {{ form.is_active ? 'ACTIVO' : 'INACTIVO' }}
        </span>
      </div>

      <div class="user-meta" v-if="user">
        <div class="meta-item">
          <span class="meta-label">Tenant</span>
          <span class="meta-value">{{ user.tenant }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Rol</span>
          <span class="meta-value role-tag">{{ user.role?.toUpperCase() }}</span>
        </div>
      </div>
    </form>

    <template #footer>
      <button @click="emit('close')" type="button" class="btn-cancel-modal">Cancelar</button>
      <button @click="handleSubmit" type="submit" class="btn-submit-modal" :disabled="isSubmitting">
        {{ isSubmitting ? 'Guardando...' : 'Guardar Cambios' }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.toggle-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
  padding: 12px;
  background: #2b3139;
  border-radius: 8px;
}

.toggle-label {
  font-size: 0.9rem;
  color: #ccc;
}

.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #444;
  border-radius: 24px;
  transition: 0.3s;
}

.toggle-slider::before {
  content: "";
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background: white;
  border-radius: 50%;
  transition: 0.3s;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: #0ecb81;
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.toggle-status {
  font-size: 0.8rem;
  font-weight: bold;
}

.toggle-status.active {
  color: #0ecb81;
}

.toggle-status.inactive {
  color: #e74c3c;
}

.user-meta {
  margin-top: 16px;
  padding: 12px;
  background: #2b3139;
  border-radius: 8px;
  display: flex;
  gap: 20px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 0.75rem;
  color: #888;
  text-transform: uppercase;
}

.meta-value {
  font-size: 0.95rem;
  color: #fff;
  font-weight: 600;
}

.role-tag {
  color: var(--color-primary);
}

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
  background-color: var(--color-success, #0ecb81);
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
