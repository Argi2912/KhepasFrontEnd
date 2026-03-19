<script setup>
import { ref, reactive, computed, watch } from 'vue'

import api from '@/services/api'
import notify from '@/services/notify'
// 🚨 1. IMPORTACIÓN CON LLAVES (¡Correcto!)
import { useFormValidation } from '@/utils/useFormValidation'

import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

// 🚨 2. ADAPTAR PROPS A 'platformId'
const props = defineProps({
  show: Boolean,
  platformId: [Number, String, null], // ID de la plataforma
})

const emit = defineEmits(['close', 'saved'])

// 🚨 3. USAR LAS FUNCIONES CORRECTAS DE TU VALIDATOR
const { errors, handleAxiosError, getError, clearError } = useFormValidation()

// 🚨 4. ADAPTAR FORMULARIO
const initialForm = {
  name: '',
  email: '',
  phone: '',
}
const form = reactive({ ...initialForm })

// 🚨 5. DEFINIR LAS MISMAS VARIABLES DE ESTADO
const isLoading = ref(false)
const isSubmitting = ref(false)

const isEditing = computed(() => !!props.platformId)
const modalTitle = computed(() => (isEditing.value ? 'Editar Plataforma' : 'Nueva Plataforma'))

const resetForm = () => {
  Object.assign(form, initialForm)
  errors.value = {}
}

const fetchPlatform = async (id) => {
  if (!id) return

  isLoading.value = true
  try {
    // 🚨 6. USAR API DE PLATAFORMAS
    const response = await api.get(`/platforms/${id}`)
    Object.assign(form, response.data) // Asumiendo que la API devuelve { data: {...} }
  } catch (error) {
    notify.error('No se pudo cargar la plataforma para edición.')
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
    // 🚨 7. USAR API DE PLATAFORMAS
    if (isEditing.value) {
      await api.put(`/platforms/${props.platformId}`, form)
      notify.success(`Plataforma "${form.name}" actualizada.`)
    } else {
      await api.post('/platforms', form)
      notify.success(`Plataforma "${form.name}" creada exitosamente.`)
    }

    emit('saved')
    emit('close')
  } catch (error) {
    handleAxiosError(error) // Usar el manejador de errores
  } finally {
    isSubmitting.value = false
  }
}

// Watcher para cargar datos cuando el ID cambia
watch(
  () => props.platformId,
  (newId) => {
    resetForm()
    if (newId) {
      fetchPlatform(newId)
    }
  },
  { immediate: true },
)

// Watcher para limpiar el formulario cuando se cierra el modal
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
    <form>
      <BaseInput v-model="form.name" label="Nombre de la Plataforma" name="name" :error="getError('name')" placeholder="Nombre de la plataforma" required @input="clearError('name')" />
      <BaseInput v-model="form.email" label="Email" name="email" type="email" :error="getError('email')" placeholder="contacto@plataforma.com" @input="clearError('email')" />
      <BaseInput v-model="form.phone" label="Teléfono" name="phone" :error="getError('phone')" placeholder="+XX XXX XXX XX XX" @input="clearError('phone')" />
    </form>

    <template #footer>
      <button @click="emit('close')" type="button" class="bg-transparent border-none text-white/50 py-2.5 px-4 cursor-pointer mr-2 hover:text-white transition-colors">Cancelar</button>
      <button @click="handleSubmit" type="button" class="py-2.5 px-5 bg-primary text-secondary border-none rounded-lg font-bold cursor-pointer transition-colors hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed" :disabled="isSubmitting || isLoading">
        <span v-if="isSubmitting">Guardando...</span>
        <span v-else>{{ isEditing ? 'Guardar Cambios' : 'Crear Plataforma' }}</span>
      </button>
    </template>
  </BaseModal>
</template>