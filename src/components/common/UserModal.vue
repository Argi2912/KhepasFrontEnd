<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-card">
      <div class="modal-header">
        <h2 class="modal-title">{{ isEditMode ? 'Editar Usuario' : 'Añadir Nuevo Usuario' }}</h2>
        <button class="modal-close-btn" @click="closeModal">×</button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="modal-body">
          <div class="form-grid">
            <CustomInput id="first_name" label="Nombre" v-model="formData.first_name" required />
            <CustomInput id="last_name" label="Apellido" v-model="formData.last_name" required />
          </div>

          <CustomInput
            id="email"
            label="Correo Electrónico"
            type="email"
            v-model="formData.email"
            required
          />
          <CustomInput
            id="phone_number"
            label="Teléfono"
            v-model="formData.phone_number"
            placeholder="(Opcional)"
          />

          <div class="input-wrapper">
            <label for="role_name" class="input-label">Rol del Usuario</label>
            <select id="role_name" v-model="formData.role_name" class="input-style" required>
              <option value="Client">Client</option>
              <option value="Broker">Broker</option>
              <option value="Provider">Provider</option>
              <option value="Tenant Admin">Tenant Admin</option>
            </select>
          </div>

          <CustomInput
            id="password"
            label="Contraseña"
            type="password"
            :placeholder="isEditMode ? 'Dejar en blanco para no cambiar' : ''"
            v-model="formData.password"
            :required="!isEditMode"
          />
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="closeModal">Cancelar</button>
          <button type="submit" class="btn-layout-primary" :disabled="isLoading">
            {{ isLoading ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, defineProps, defineEmits } from 'vue'
import CustomInput from '@/components/common/CustomInput.vue'

const props = defineProps({
  isVisible: Boolean,
  userToEdit: Object, // null si es para "Añadir"
  isLoading: Boolean,
})

const emit = defineEmits(['close', 'save'])

// Estado local del formulario
const formData = ref({})

// Computada para saber si estamos en modo Edición o Creación
const isEditMode = computed(() => !!props.userToEdit?.id)

// Observador: Rellena el formulario cuando 'isVisible' cambia
watch(
  () => props.isVisible,
  (newVal) => {
    if (newVal) {
      // Solo actualizar cuando el modal se HACE visible
      if (isEditMode.value) {
        // Modo Edición
        formData.value = {
          id: props.userToEdit.id,
          first_name: props.userToEdit.first_name,
          last_name: props.userToEdit.last_name,
          email: props.userToEdit.email,
          phone_number: props.userToEdit.phone_number || '',

          // --- SOLUCIÓN: Usar 'role_name' ---
          role_name: props.userToEdit.roles?.[0]?.name || 'Client',

          password: '', // Siempre vacío por seguridad
        }
      } else {
        // Modo Creación
        formData.value = {
          first_name: '',
          last_name: '',
          email: '',
          phone_number: '',

          // --- SOLUCIÓN: Usar 'role_name' ---
          role_name: 'Client', // Default a 'Client'

          password: '',
        }
      }
    }
  },
)

const closeModal = () => {
  emit('close')
}

const handleSubmit = () => {
  emit('save', formData.value)
}
</script>

<style scoped>
/* Estilos del modal y formulario importados de layout.css y auth.css */
</style>
