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
  userId: [Number, null], // ID del usuario a editar
})

const emit = defineEmits(['close', 'saved'])

const { errors, handleAxiosError, getError, clearError } = useFormValidation()

// --- ESTADO LOCAL ---
const availableRoles = ref([]) // Lista de roles disponibles
const rolesOptions = computed(() =>
  availableRoles.value.map((r) => ({
    // El backend espera el 'name' (string) del rol
    id: r.name,
    name: r.name.toUpperCase(),
  })),
)

const initialForm = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: null, // 🚨 Coincide con el 'role' (string) del backend
}
const form = reactive({ ...initialForm })

const isLoading = ref(false)
const isSubmitting = ref(false)

const isEditing = computed(() => !!props.userId)
const modalTitle = computed(() => (isEditing.value ? 'Editar Usuario' : 'Crear Nuevo Usuario'))

// --- ACCIONES ---

const resetForm = () => {
  Object.assign(form, initialForm)
  clearError()
  // Asegurar que el rol por defecto esté seleccionado si ya se cargaron
  if (availableRoles.value.length > 0) {
    const defaultRole =
      availableRoles.value.find((r) => r.name === 'cajero') || availableRoles.value[0]
    form.role = defaultRole.name
  }
}

/**
 * Carga los roles disponibles desde la API.
 */
const fetchRoles = async () => {
  try {
    const response = await api.get('/users/available-roles')
    availableRoles.value = response.data // Ej: [{ id: 2, name: 'cajero' }, ...]
  } catch (error) {
    notify.error('Error al cargar los roles disponibles.')
  }
}

/**
 * 🚨 CORRECCIÓN CLAVE (Función Fetch)
 * Carga los datos del usuario a editar Y LOS ASIGNA AL FORMULARIO.
 */
const fetchUser = async (id) => {
  if (!id) return // No hacer nada si el ID es nulo

  isLoading.value = true
  try {
    const response = await api.get(`/users/${id}`)

    // El UserResource envuelve la respuesta en 'data'
    const userData = response.data.data

    // 🚨 ASIGNACIÓN DE DATOS (Esta era la parte que fallaba)
    form.name = userData.name
    form.email = userData.email

    // El UserResource devuelve roles como un array de strings: ['admin_tenant']
    if (userData.roles && userData.roles.length > 0) {
      form.role = userData.roles[0] // Asigna el 'name' del rol (ej: 'admin_tenant')
    }
  } catch (error) {
    notify.error('No se pudo cargar el usuario para edición.')
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

  // El payload debe coincidir con el backend ('role', no 'role_name')
  const payload = {
    name: form.name,
    email: form.email,
    role: form.role,
  }

  // Solo enviar contraseña si se escribió
  if (form.password) {
    payload.password = form.password
    payload.password_confirmation = form.password_confirmation
  }

  try {
    if (isEditing.value) {
      await api.put(`/users/${props.userId}`, payload)
      notify.success(`Usuario "${form.name}" actualizado.`)
    } else {
      // Para crear, usamos el 'form' reactivo completo
      await api.post('/users', form)
      notify.success(`Usuario "${form.name}" creado exitosamente.`)
    }

    emit('saved')
    emit('close')
  } catch (error) {
    handleAxiosError(error)
  } finally {
    isSubmitting.value = false
  }
}

// --- WATCHERS Y LIFECYCLE ---

/**
 * 🚨 CORRECCIÓN CLAVE (Watcher)
 * Observa el ID del usuario. Si cambia (de null a 5),
 * resetea el formulario y carga los nuevos datos.
 */
watch(
  () => props.userId,
  (newId) => {
    resetForm() // Limpiar datos anteriores
    if (newId) {
      // Si newId tiene un valor (modo Edición), buscar los datos
      fetchUser(newId)
    }
  },
  // 'immediate: true' no es necesario aquí si usamos el watcher de 'show'
)

/**
 * Observa el estado 'show' del modal.
 */
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      // Modal se está abriendo
      if (availableRoles.value.length === 0) {
        fetchRoles() // Cargar roles si no se han cargado
      }

      // Si se abre en modo CREACIÓN (userId es null), re-aplicar el rol por defecto
      if (!isEditing.value && availableRoles.value.length > 0) {
        const defaultRole =
          availableRoles.value.find((r) => r.name === 'cajero') || availableRoles.value[0]
        form.role = defaultRole.name
      }
    } else {
      // Modal se está cerrando
      resetForm()
    }
  },
)

onMounted(() => {
  fetchRoles() // Cargar roles al inicio
})
</script>

<template>
  <BaseModal :show="show" :title="modalTitle" @close="emit('close')" :is-loading="isLoading">
    <form class="space-y-6 py-2" @submit.prevent="handleSubmit">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <BaseInput
          v-model="form.name"
          label="Nombre Completo"
          name="name"
          :error="getError('name')"
          icon="fa-solid fa-user"
          placeholder="Nombre del empleado"
          required
          @input="clearError('name')"
        />
        <BaseInput
          v-model="form.email"
          label="Email (Único)"
          name="email"
          type="email"
          :error="getError('email')"
          icon="fa-solid fa-envelope"
          placeholder="ejemplo@tenant.com"
          required
          @input="clearError('email')"
        />
      </div>

      <BaseSelect
        v-model="form.role"
        label="Rol del Usuario"
        name="role"
        :options="rolesOptions"
        track-by="id"
        label-by="name"
        :error="getError('role')"
        placeholder="Asignar un rol"
        required
        @change="clearError('role')"
      />

      <div class="pt-4 border-t border-white/5">
        <h4 class="text-xs font-black uppercase tracking-[0.2em] text-primary mb-6">
          {{ isEditing ? 'Seguridad (Opcional)' : 'Seguridad y Acceso' }}
        </h4>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <BaseInput
            v-model="form.password"
            label="Contraseña"
            name="password"
            type="password"
            :error="getError('password')"
            icon="fa-solid fa-lock"
            :required="!isEditing"
            @input="clearError('password')"
          />
          <BaseInput
            v-model="form.password_confirmation"
            label="Confirmar"
            name="password_confirmation"
            type="password"
            :error="getError('password_confirmation')"
            icon="fa-solid fa-lock"
            :required="!isEditing"
            @input="clearError('password_confirmation')"
          />
        </div>
      </div>
    </form>

    <template #footer>
      <div class="flex items-center gap-3">
        <button 
          @click="emit('close')" 
          type="button" 
          class="px-5 py-2.5 text-sm font-bold text-white/40 hover:text-white transition-colors"
        >
          Cancelar
        </button>
        <button
          @click="handleSubmit"
          type="submit"
          class="bg-primary hover:bg-primary-dark text-secondary px-6 py-2.5 rounded-xl font-black text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          :disabled="isSubmitting || isLoading"
        >
          <span v-if="isSubmitting" class="flex items-center gap-2">
            <FontAwesomeIcon icon="fa-solid fa-circle-notch" spin /> Guardando...
          </span>
          <span v-else>{{ isEditing ? 'Actualizar Usuario' : 'Crear Usuario' }}</span>
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
/* Los estilos ahora vienen de global.css y Tailwind */
</style>
