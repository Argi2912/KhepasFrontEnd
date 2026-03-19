<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import notify from '@/services/notify'
import BaseInput from '@/components/ui/BaseInput.vue'

const route = useRoute()
const router = useRouter()

// 🚨 Paso 1: Usar los campos de Plataforma (name, email, phone)
const form = reactive({
  name: '',
  email: '',
  phone: '',
})

const errors = ref({})
const isLoading = ref(false)

const isEditing = computed(() => !!route.params.id)
// 🚨 Paso 2: Cambiar títulos
const pageTitle = computed(() => (isEditing.value ? 'Editar Plataforma' : 'Nueva Plataforma'))

/**
 * Carga los datos de la plataforma si estamos en modo edición.
 */
const fetchPlatform = async () => {
  if (!isEditing.value) return

  isLoading.value = true
  try {
    // 🚨 Paso 3: Usar el endpoint de /platforms
    const response = await api.get(`/platforms/${route.params.id}`)
    
    // Rellenar el formulario con los datos
    Object.assign(form, response.data) // Asumiendo que la API devuelve { data: {...} }
  } catch (error) {
    notify.error('No se pudo cargar la plataforma para edición.')
    router.push({ name: 'platforms_list' }) // 🚨 Volver a la lista de plataformas
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

    // 🚨 Paso 4: Usar endpoints de /platforms
    if (isEditing.value) {
      response = await api.put(`/platforms/${route.params.id}`, form)
      notify.success(`Plataforma "${response.data.name}" actualizada.`)
    } else {
      response = await api.post('/platforms', form)
      notify.success(`Plataforma "${response.data.name}" creada exitosamente.`)
    }

    router.push({ name: 'platforms_list' }) // 🚨 Volver a la lista de plataformas
  } catch (error) {
    if (error.response && error.response.status === 422) {
      errors.value = error.response.data.errors
    } else {
      // Usar el interceptor de api.js para notificaciones genéricas
      console.error('Error submitting form:', error)
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchPlatform()
})
</script>

<template>
  <div class="platform-form-view">
    <h2>{{ pageTitle }}</h2>

    <form @submit.prevent="handleSubmit" class="form-card">
      <BaseInput
        v-model="form.name"
        label="Nombre de la Plataforma"
        name="name"
        :error="errors.name ? errors.name[0] : ''"
        placeholder="Nombre de la plataforma"
        required
      />

      <BaseInput
        v-model="form.email"
        label="Email"
        name="email"
        type="email"
        :error="errors.email ? errors.email[0] : ''"
        placeholder="contacto@plataforma.com"
      />

      <BaseInput
        v-model="form.phone"
        label="Teléfono"
        name="phone"
        :error="errors.phone ? errors.phone[0] : ''"
        placeholder="+1 555 123 4567"
      />

      <div class="form-actions">
        <button type="submit" class="submit-btn" :disabled="isLoading">
          <span v-if="isLoading">Guardando...</span>
          <span v-else>{{ isEditing ? 'Actualizar Plataforma' : 'Crear Plataforma' }}</span>
        </button>
        <router-link :to="{ name: 'platforms_list' }" class="btn-cancel"> Cancelar </router-link>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* Estilos 100% copiados de ProviderForm.vue */
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