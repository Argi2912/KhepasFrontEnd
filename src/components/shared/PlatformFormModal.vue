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
    
    <!-- 🚨 8. ESTRUCTURA DE TEMPLATE IDÉNTICA A CLIENT -->
    <form class="modal-form">
      <BaseInput
        v-model="form.name"
        label="Nombre de la Plataforma"
        name="name"
        :error="getError('name')"
        placeholder="Nombre de la plataforma"
        required
        @input="clearError('name')"
      />

      <BaseInput
        v-model="form.email"
        label="Email"
        name="email"
        type="email"
        :error="getError('email')"
        placeholder="contacto@plataforma.com"
        @input="clearError('email')"
      />

      <BaseInput
        v-model="form.phone"
        label="Teléfono"
        name="phone"
        :error="getError('phone')"
        placeholder="+XX XXX XXX XX XX"
        @input="clearError('phone')"
      />

      <!-- (Quitamos el textarea de "details" que no se usa aquí) -->
      
    </form>

    <template #footer>
      <button @click="emit('close')" type="button" class="btn-cancel-modal">Cancelar</button>
      <button
        @click="handleSubmit"
        type="button"
        class="btn-submit-modal"
        :disabled="isSubmitting || isLoading"
      >
        <!-- 
          🚨 9. USANDO isSubmitting y isLoading
          (Esto arregla los errores de consola)
        -->
        <span v-if="isSubmitting">Guardando...</span>
        <span v-else>{{ isEditing ? 'Guardar Cambios' : 'Crear Plataforma' }}</span>
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
/* 🚨 10. ESTILOS IDÉNTICOS A CLIENT */
.modal-form {
  /* (no se necesita nada especial, los BaseInput fluyen) */
}

.form-group {
  margin-bottom: 20px;
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
  background-color: var(--color-primary); /* Usamos el color primario */
  color: var(--color-secondary);
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-submit-modal:hover:not(:disabled) {
  background-color: #ffc424; /* El hover primario */
}
.btn-submit-modal:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>