<script setup>
import { reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import notify from '@/services/notify'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const form = reactive({
  email: 'admin@kephas.com',
  password: 'password',
})

const isLoading = ref(false)
const authStore = useAuthStore()

const handleLogin = async () => {
  if (!form.email || !form.password) {
    notify.warning('Por favor, ingresa tu email y contraseña.')
    return
  }

  isLoading.value = true
  try {
    await authStore.login(form)
    notify.success('¡Bienvenido!')
  } catch (error) {
    // El interceptor maneja la notificación de errores 401/422.
    console.error('Login error details:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="login-card-container">
    <div class="login-card">
      <div class="header">
        <h1 class="logo-text">TuConpay</h1>
        <p class="subtitle">Acceso al Panel de Administración del Tenant</p>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <div class="input-wrapper">
            <FontAwesomeIcon icon="fa-solid fa-user" class="input-icon" />
            <input id="email" v-model="form.email" type="email" :disabled="isLoading" placeholder="admin@tenant.com"
              required />
          </div>
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <div class="input-wrapper">
            <FontAwesomeIcon icon="fa-solid fa-lock" class="input-icon" />
            <input id="password" v-model="form.password" type="password" :disabled="isLoading" placeholder="********"
              required />
          </div>
        </div>

        <button type="submit" class="submit-btn" :disabled="isLoading">
          <span v-if="isLoading">Cargando...</span>
          <span v-else>Iniciar Sesión</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Estilos para el AuthLayout */
.login-card-container {
  /* Ocupa el 100% de la vista, centrado por el AuthLayout */
  width: 100%;
  padding: 20px;
}

.login-card {
  background-color: var(--color-secondary);
  padding: 50px 40px;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.7);
  width: 100%;
  max-width: 450px;
  margin: auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.logo-text {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 5px;
}

.subtitle {
  color: #aaa;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 25px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.95rem;
  color: #ccc;
  font-weight: 500;
}

.input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
  border-radius: 6px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.input-wrapper:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.input-icon {
  color: var(--color-primary);
  margin: 0 12px;
  font-size: 1rem;
  opacity: 0.7;
}

input {
  flex-grow: 1;
  padding: 12px 0;
  border: none;
  background: transparent;
  color: var(--color-text-light);
}

input:focus {
  outline: none;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background-color: var(--color-primary);
  color: var(--color-secondary);
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition:
    background-color 0.2s,
    opacity 0.2s;
  margin-top: 10px;
}

.submit-btn:hover:not(:disabled) {
  background-color: #ffc424;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
