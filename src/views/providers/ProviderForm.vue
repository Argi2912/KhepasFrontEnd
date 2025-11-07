<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import notify from '@/services/notify'
import BaseInput from '@/components/ui/BaseInput.vue'

const route = useRoute()
const router = useRouter()

const form = reactive({
  name: '',
  contact_person: '',
  email: '',
  phone: '',
})

const errors = ref({})
const isLoading = ref(false)

const isEditing = computed(() => !!route.params.id)
const pageTitle = computed(() => (isEditing.value ? 'Editar Proveedor' : 'Nuevo Proveedor'))

/**
 * Carga los datos del proveedor si estamos en modo edición.
 */
const fetchProvider = async () => {
  if (!isEditing.value) return

  isLoading.value = true
  try {
    const response = await api.get(`/providers/${route.params.id}`)

    // Rellenar el formulario con los datos
    Object.assign(form, response.data)
  } catch (error) {
    notify.error('No se pudo cargar el proveedor para edición.')
    router.push({ name: 'providers_list' })
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
      response = await api.put(`/providers/${route.params.id}`, form)
      notify.success(`Proveedor "${response.data.name}" actualizado.`)
    } else {
      response = await api.post('/providers', form)
      notify.success(`Proveedor "${response.data.name}" creado exitosamente.`)
    }

    router.push({ name: 'providers_list' })
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
  fetchProvider()
})
</script>

<template>
  <div class="provider-form-view">
    <h2>{{ pageTitle }}</h2>

    <form @submit.prevent="handleSubmit" class="form-card">
      <BaseInput
        v-model="form.name"
        label="Nombre / Razón Social"
        name="name"
        :error="errors.name ? errors.name[0] : ''"
        placeholder="Nombre del proveedor o empresa"
        required
      />

      <BaseInput
        v-model="form.contact_person"
        label="Persona de Contacto"
        name="contact_person"
        :error="errors.contact_person ? errors.contact_person[0] : ''"
        placeholder="Nombre de la persona clave"
      />

      <BaseInput
        v-model="form.email"
        label="Email"
        name="email"
        type="email"
        :error="errors.email ? errors.email[0] : ''"
        placeholder="contacto@proveedor.com"
      />

      <BaseInput
        v-model="form.phone"
        label="Teléfono"
        name="phone"
        :error="errors.phone ? errors.phone[0] : ''"
        placeholder="+58 412 XXX XX XX"
      />

      <div class="form-actions">
        <button type="submit" class="submit-btn" :disabled="isLoading">
          <span v-if="isLoading">Guardando...</span>
          <span v-else>{{ isEditing ? 'Actualizar Proveedor' : 'Crear Proveedor' }}</span>
        </button>
        <router-link :to="{ name: 'providers_list' }" class="btn-cancel"> Cancelar </router-link>
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
