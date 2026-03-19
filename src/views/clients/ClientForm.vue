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
  <div class="space-y-8 animate-fade-in max-w-3xl mx-auto md:mx-0">
    <div class="flex items-center gap-4">
      <router-link 
        :to="{ name: 'clients_list' }" 
        class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
      >
        <FontAwesomeIcon icon="fa-solid fa-arrow-left" />
      </router-link>
      <h1 class="text-3xl font-black text-white tracking-tight">{{ pageTitle }}</h1>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-10">
      <BaseCard
        title="Datos del Cliente"
        subtitle="Información necesaria para registrar transacciones y contacto."
        class="shadow-2xl border border-white/5"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <BaseInput
            v-model="form.name"
            label="Nombre / Razón Social"
            name="name"
            :error="getError('name')"
            icon="fa-solid fa-user-circle"
            placeholder="Ej: Inversiones Globales S.A."
            required
            class="md:col-span-2"
          />

          <BaseInput
            v-model="form.email"
            label="Correo Electrónico"
            name="email"
            type="email"
            :error="getError('email')"
            icon="fa-solid fa-envelope"
            placeholder="contacto@cliente.com"
          />

          <BaseInput
            v-model="form.phone"
            label="Teléfono de Contacto"
            name="phone"
            :error="getError('phone')"
            icon="fa-solid fa-phone"
            placeholder="+56 9 XXXX XXXX"
          />

          <div class="md:col-span-2 space-y-2">
            <label for="details" class="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Detalles / Notas Internas</label>
            <textarea
              id="details"
              v-model="form.details"
              rows="4"
              class="w-full bg-secondary-light/50 border border-white/10 rounded-xl p-4 text-white hover:border-white/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-white/10 resize-none font-medium text-sm"
              placeholder="Notas importantes sobre acuerdos, crédito o preferencias..."
            ></textarea>
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-end gap-5">
            <router-link 
              :to="{ name: 'clients_list' }" 
              class="text-sm font-bold text-white/40 hover:text-white transition-colors"
            > 
              Cancelar 
            </router-link>
            <button 
              type="submit" 
              class="bg-primary hover:bg-primary-dark text-secondary px-8 py-3 rounded-xl font-black text-sm transition-all shadow-lg shadow-primary/10 active:scale-95 disabled:opacity-50" 
              :disabled="isSubmitting || isLoading"
            >
              <span v-if="isSubmitting" class="flex items-center gap-2">
                <FontAwesomeIcon icon="fa-solid fa-circle-notch" spin /> Guardando...
              </span>
              <span v-else>{{ isEditing ? 'Actualizar Cliente' : 'Registrar Cliente' }}</span>
            </button>
          </div>
        </template>
      </BaseCard>
    </form>
  </div>
</template>

<style scoped>
/* Los estilos ahora vienen de global.css y Tailwind */
</style>
