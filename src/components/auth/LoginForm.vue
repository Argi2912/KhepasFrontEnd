// src/components/auth/LoginForm.vue (DISEÑO MEJORADO)

<template>
  <form
    @submit.prevent="handleSubmit"
    class="card-background p-10 rounded-2xl shadow-xl w-full max-w-sm border border-gray-700"
  >
    <h2 class="text-3xl font-extrabold text-accent-green mb-8 text-center tracking-wider">
      Iniciar Sesión
    </h2>

    <CustomInput
      id="email"
      label="Correo Electrónico"
      type="email"
      v-model="credentials.email"
      placeholder="ejemplo@empresa.com"
      required
    />

    <CustomInput
      id="password"
      label="Contraseña"
      type="password"
      v-model="credentials.password"
      placeholder="••••••••"
      required
    />

    <button
      type="submit"
      :disabled="authStore.loading"
      class="w-full bg-accent-green text-dark-primary py-3 mt-6 rounded-lg text-lg font-bold shadow-green hover:bg-opacity-85 transition-all duration-200 disabled:opacity-50"
    >
      {{ authStore.loading ? 'Accediendo...' : 'Acceder' }}
    </button>

    <p class="text-center text-gray-400 text-sm mt-6">
      ¿No tienes cuenta?
      <router-link
        :to="{ name: 'Register' }"
        class="text-accent-yellow font-medium hover:text-white transition-colors"
        >Regístrate aquí</router-link
      >
    </p>
  </form>
</template>

<script>
// ... (Lógica de script se mantiene igual)
import { reactive } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import CustomInput from '@/components/common/CustomInput.vue'

export default {
  name: 'LoginForm',
  components: { CustomInput },
  setup() {
    const authStore = useAuthStore()
    const credentials = reactive({
      email: 'admin@demo.com', // Valor por defecto de prueba
      password: 'password',
    })

    const handleSubmit = async () => {
      try {
        await authStore.handleLogin(credentials)
      } catch (error) {
        console.error('Login intento fallido:', error)
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
/* ==========================================================
   ESTILOS MINIMALISTAS (Binance)
   ========================================================== */
.card-background {
  background-color: #2b3139; /* Gris oscuro para el fondo de la tarjeta */
}
.text-dark-primary {
  color: #1c2127; /* Usado para el texto del botón verde */
}
.text-accent-green {
  color: #0ecb81; /* Verde Lima */
}
.bg-accent-green {
  background-color: #0ecb81;
}
.text-accent-yellow {
  color: #f0b90b; /* Amarillo Ámbar */
}
.shadow-xl {
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.3),
    0 4px 6px -2px rgba(0, 0, 0, 0.15);
}
/* Efecto de sombra sutil para el botón de acción principal */
.shadow-green {
  box-shadow: 0 4px 10px -2px rgba(14, 203, 129, 0.3); /* Sombra verde */
}
</style>
