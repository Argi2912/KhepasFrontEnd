<template>
  <div>
    <h1 class="page-title">Editar Mi Perfil</h1>

    <div class="profile-card">
      <form @submit.prevent="handleSubmit">
        <div class="form-grid">
          <CustomInput id="first_name" label="Nombre" v-model="profileForm.first_name" required />
          <CustomInput id="last_name" label="Apellido" v-model="profileForm.last_name" required />
        </div>
        <CustomInput
          id="email"
          label="Correo Electrónico"
          type="email"
          v-model="profileForm.email"
          required
        />
        <CustomInput
          id="phone_number"
          label="Teléfono"
          v-model="profileForm.phone_number"
          placeholder="(Opcional)"
        />

        <hr class="form-divider" />

        <h3 class="form-subtitle">Cambiar Contraseña</h3>
        <p class="form-subtitle-help">
          Deje estos campos en blanco si no desea cambiar su contraseña.
        </p>

        <div class="form-grid">
          <CustomInput
            id="password"
            label="Nueva Contraseña"
            type="password"
            v-model="profileForm.password"
          />
          <CustomInput
            id="password_confirmation"
            label="Confirmar Nueva Contraseña"
            type="password"
            v-model="profileForm.password_confirmation"
          />
        </div>

        <div class="action-section">
          <button
            type="submit"
            :disabled="authStore.loading"
            class="btn-layout-primary"
            style="width: auto; padding-left: 2rem; padding-right: 2rem"
          >
            {{ authStore.loading ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
// --- (Script sin cambios) ---
import { reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import CustomInput from '@/components/common/CustomInput.vue'
import { useToast } from 'vue-toastification'

const authStore = useAuthStore()
const toast = useToast()
const profileForm = reactive({
  first_name: '',
  last_name: '',
  email: '',
  phone_number: '',
  password: '',
  password_confirmation: '',
})

onMounted(() => {
  if (authStore.user) {
    profileForm.first_name = authStore.user.first_name
    profileForm.last_name = authStore.user.last_name
    profileForm.email = authStore.user.email
    profileForm.phone_number = authStore.user.phone_number || ''
  }
})

const handleSubmit = async () => {
  if (profileForm.password && profileForm.password !== profileForm.password_confirmation) {
    toast.error('Las nuevas contraseñas no coinciden.')
    return
  }
  try {
    await authStore.handleProfileUpdate(profileForm)
    profileForm.password = ''
    profileForm.password_confirmation = ''
  } catch (error) {
    // Manejado por interceptor
  }
}
</script>

<style scoped>
/* (Estilos de .form-divider, .form-subtitle, etc. sin cambios) */
.form-divider {
  border: none;
  border-top: 1px solid var(--color-border);
  margin-top: 2rem;
  margin-bottom: 2rem;
}
.form-subtitle {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}
.form-subtitle-help {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
}
</style>
