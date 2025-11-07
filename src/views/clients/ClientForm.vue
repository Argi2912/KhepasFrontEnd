<!-- src/views/clients/ClientForm.vue -->
<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import api from '@/services/api'
import notify from '@/services/notify'
import { useFormValidation } from '@/utils/useFormValidation'

import BaseInput from '@/components/ui/BaseInput.vue'
import BaseCard from '@/components/shared/BaseCard.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { errors, handleAxiosError, getError } = useFormValidation()

const form = reactive({
  name: '',
  email: '',
  phone: '',
  details: '',
})

const isLoading = ref(false)
const isSubmitting = ref(false)

const isEditing = computed(() => !!route.params.id)
const pageTitle = computed(() => (isEditing.value ? 'Editar Cliente' : 'Nuevo Cliente'))
const permissionKey = 'manage_clients'

// Chequeo de permiso al acceder al formulario
if (!authStore.can(permissionKey)) {
  notify.error('Acceso denegado a formularios de clientes.')
  router.push({ name: 'clients_list' })
}

/**
 * Carga los datos del cliente si estamos en modo edición.
 */
const fetchClient = async () => {
  if (!isEditing.value) return

  isLoading.value = true
  try {
    const response = await api.get(`/clients/${route.params.id}`)
    Object.assign(form, response.data)
  } catch (error) {
    notify.error('No se pudo cargar el cliente para edición.')
    router.push({ name: 'clients_list' })
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
    let response

    if (isEditing.value) {
      response = await api.put(`/clients/${route.params.id}`, form)
      notify.success(`Cliente "${response.data.name}" actualizado.`)
    } else {
      response = await api.post('/clients', form)
      notify.success(`Cliente "${response.data.name}" creado exitosamente.`)
    }

    router.push({ name: 'clients_list' })
  } catch (error) {
    handleAxiosError(error) // Mapea los errores 422 de Laravel
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchClient()
})
</script>

<template>
  <div class="client-form-view">
    <h1>{{ pageTitle }}</h1>

    <form @submit.prevent="handleSubmit">
      <BaseCard
        title="Datos del Cliente"
        subtitle="Información necesaria para registrar transacciones."
        class="form-card"
      >
        <BaseInput
          v-model="form.name"
          label="Nombre / Razón Social"
          name="name"
          :error="getError('name')"
          icon="fa-solid fa-user-circle"
          placeholder="Nombre o Razón Social del cliente"
          required
        />

        <BaseInput
          v-model="form.email"
          label="Email"
          name="email"
          type="email"
          :error="getError('email')"
          icon="fa-solid fa-envelope"
          placeholder="contacto@cliente.com"
        />

        <BaseInput
          v-model="form.phone"
          label="Teléfono"
          name="phone"
          :error="getError('phone')"
          icon="fa-solid fa-phone"
          placeholder="+XX XXX XXX XX XX"
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

        <template #footer>
          <div class="form-actions">
            <button type="submit" class="btn-submit" :disabled="isSubmitting || isLoading">
              <span v-if="isSubmitting">Guardando...</span>
              <span v-else>{{ isEditing ? 'Actualizar Cliente' : 'Crear Cliente' }}</span>
            </button>
            <router-link :to="{ name: 'clients_list' }" class="btn-cancel"> Cancelar </router-link>
          </div>
        </template>
      </BaseCard>
    </form>
  </div>
</template>

<style scoped>
h1 {
  font-size: 1.6rem;
  margin-bottom: 25px;
}
.form-card {
  max-width: 700px;
}

.form-group {
  margin-bottom: 25px;
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
label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.95rem;
  color: #ccc;
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 15px;
  align-items: center;
  justify-content: flex-end;
}

.btn-submit {
  padding: 12px 25px;
  background-color: var(--color-success);
  color: var(--color-secondary);
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition:
    background-color 0.2s,
    opacity 0.2s;
}

.btn-submit:hover:not(:disabled) {
  background-color: #0dcf92;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  color: var(--color-text-light);
  text-decoration: none;
  opacity: 0.8;
}
</style>
