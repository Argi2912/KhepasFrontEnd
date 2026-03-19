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
  <div class="space-y-8 animate-fade-in max-w-3xl">
    <div class="flex items-center gap-4">
      <router-link 
        :to="{ name: 'providers_list' }" 
        class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
      >
        <FontAwesomeIcon icon="fa-solid fa-arrow-left" />
      </router-link>
      <h1 class="text-3xl font-black text-white tracking-tight">{{ pageTitle }}</h1>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-8">
      <BaseCard
        title="Información del Proveedor"
        subtitle="Datos básicos y persona de contacto clave para la relación comercial."
        class="border border-white/5 shadow-2xl"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BaseInput
            v-model="form.name"
            label="Nombre / Razón Social"
            name="name"
            :error="errors.name ? errors.name[0] : ''"
            icon="fa-solid fa-building"
            placeholder="Nombre de la empresa"
            required
            class="md:col-span-2"
          />

          <BaseInput
            v-model="form.contact_person"
            label="Persona de Contacto"
            name="contact_person"
            :error="errors.contact_person ? errors.contact_person[0] : ''"
            icon="fa-solid fa-user-tie"
            placeholder="Nombre del ejecutivo"
          />

          <BaseInput
            v-model="form.email"
            label="Correo Electrónico"
            name="email"
            type="email"
            :error="errors.email ? errors.email[0] : ''"
            icon="fa-solid fa-envelope"
            placeholder="contacto@proveedor.com"
          />

          <BaseInput
            v-model="form.phone"
            label="Teléfono de Contacto"
            name="phone"
            :error="errors.phone ? errors.phone[0] : ''"
            icon="fa-solid fa-phone"
            placeholder="+58 412 XXX XX XX"
          />
        </div>

        <template #footer>
          <div class="flex items-center justify-end gap-5">
            <router-link 
              :to="{ name: 'providers_list' }" 
              class="text-sm font-bold text-white/40 hover:text-white transition-colors"
            > 
              Cancelar 
            </router-link>
            <button 
              type="submit" 
              class="bg-primary hover:bg-primary-dark text-secondary px-8 py-3 rounded-xl font-black text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50" 
              :disabled="isLoading"
            >
              <span v-if="isLoading" class="flex items-center gap-2">
                <FontAwesomeIcon icon="fa-solid fa-circle-notch" spin /> Procesando...
              </span>
              <span v-else>{{ isEditing ? 'Actualizar Proveedor' : 'Registrar Proveedor' }}</span>
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
