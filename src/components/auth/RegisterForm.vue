<template>
  <form
    @submit.prevent="handleSubmit"
    class="bg-dark-secondary p-8 rounded-xl shadow-2xl w-full max-w-lg"
  >
    <h2 class="text-3xl font-bold text-accent-green mb-6 text-center">Registro de Empresa</h2>

    <div class="grid grid-cols-2 gap-4">
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

    <div class="grid grid-cols-2 gap-4">
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

    <button
      type="submit"
      :disabled="authStore.loading"
      class="w-full bg-accent-green text-dark-primary py-2 mt-6 rounded-lg font-semibold hover:bg-opacity-90 transition-opacity disabled:opacity-50"
    >
      {{ authStore.loading ? 'Registrando...' : 'Registrarse y Acceder' }}
    </button>

    <p class="text-center text-gray-400 mt-4">
      ¿Ya tienes cuenta?
      <router-link :to="{ name: 'Login' }" class="text-accent-yellow hover:underline"
        >Inicia sesión</router-link
      >
    </p>
  </form>
</template>

<script>
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
        console.error('Registro fallido:', error)
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
/* Colores de la Paleta */
.bg-dark-secondary {
  background-color: #2b3139;
}
.text-accent-green {
  color: #0ecb81;
}
.text-accent-yellow {
  color: #f0b90b;
}
</style>
