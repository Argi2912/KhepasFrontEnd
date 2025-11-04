<template>
  <form @submit.prevent="handleSubmit" class="auth-card register-card">
    <div class="logo-section">
      <h2 class="title">Registro de Empresa</h2>
    </div>

    <div class="form-grid">
      <CustomInput id="first_name" label="Nombre" v-model="credentials.first_name" required />
      <CustomInput id="last_name" label="Apellido" v-model="credentials.last_name" required />
    </div>

    <CustomInput
      id="email"
      label="Correo Electrónico"
      type="email"
      v-model="credentials.email"
      required
    />
    <CustomInput
      id="phone_number"
      label="Teléfono"
      v-model="credentials.phone_number"
      placeholder="(Opcional)"
    />

    <div class="form-grid">
      <CustomInput
        id="password"
        label="Contraseña"
        type="password"
        v-model="credentials.password"
        required
      />
      <CustomInput
        id="password_confirmation"
        label="Confirmar Contraseña"
        type="password"
        v-model="credentials.password_confirmation"
        required
      />
    </div>

    <CustomInput
      id="tenant_id"
      label="ID del Tenant (ID de la Empresa)"
      type="number"
      v-model="credentials.tenant_id"
      placeholder="Ej: 1 (Para el demo)"
      required
    />

    <div class="action-section">
      <button type="submit" :disabled="authStore.loading" class="btn-primary">
        {{ authStore.loading ? 'Registrando...' : 'Registrarse y Acceder' }}
      </button>
    </div>

    <p class="auth-link">
      ¿Ya tienes cuenta?
      <router-link :to="{ name: 'Login' }">Inicia sesión</router-link>
    </p>
  </form>
</template>

<script>
// El script que subiste es correcto y se mantiene.
import { reactive } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import CustomInput from '@/components/common/CustomInput.vue'
import { useToast } from 'vue-toastification'

export default {
  name: 'RegisterForm',
  components: { CustomInput },
  setup() {
    const authStore = useAuthStore()
    const toast = useToast()

    const credentials = reactive({
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      password: '',
      password_confirmation: '',
      tenant_id: '1', // Valor por defecto para el MVP/seed
    })

    const handleSubmit = async () => {
      if (credentials.password !== credentials.password_confirmation) {
        toast.error('Las contraseñas no coinciden.')
        return
      }
      try {
        await authStore.handleRegister(credentials)
      } catch (error) {
        // Notificación manejada por el interceptor
      }
    }

    return {
      credentials,
      handleSubmit,
      authStore,
    }
  },
}
</script>

<style scoped>
/* ¡No se necesitan estilos aquí! 
  Todo es manejado por auth.css
*/
</style>
