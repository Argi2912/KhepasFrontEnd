<script setup>
import { reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import notify from '@/services/notify'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useRouter } from 'vue-router'
import { useFormValidation } from '@/utils/useFormValidation'

const router = useRouter()
const authStore = useAuthStore()
const { handleAxiosError, getError, clearError } = useFormValidation()

const form = reactive({
  email: '',
  password: '',
})

const isLoading = ref(false)

const handleLogin = async () => {
  if (!form.email || !form.password) {
    notify.warning('Por favor, ingresa tu email y contraseña.')
    return
  }

  isLoading.value = true
  try {
    await authStore.login(form)
    notify.success('¡Bienvenido de nuevo!')
  } catch (error) {
    if (!handleAxiosError(error)) {
      console.error('Login error:', error)
      notify.error('Credenciales incorrectas o error de servidor')
    }
  } finally {
    isLoading.value = false
  }
}

const goBack = () => router.push({ name: 'landing' })
const goToRegister = () => router.push({ name: 'register' })
</script>

<template>
  <div class="glass-card auth-card">
    <div class="brand-header">
      <div class="logo-box">T</div>
      <h1 class="brand-title">Conpay<span class="gold-dot">.</span></h1>
      <p class="brand-tagline">Panel de Administración</p>
    </div>

    <div class="separator"></div>

    <form @submit.prevent="handleLogin" class="auth-form">
      <div class="input-group">
        <label>Correo Electrónico</label>
        <div class="input-field" :class="{ 'input-error': getError('email') }">
          <font-awesome-icon icon="fa-solid fa-envelope" class="field-icon" />
          <input 
            v-model="form.email" 
            type="email" 
            placeholder="admin@empresa.com" 
            required 
            @input="clearError('email')"
          />
        </div>
        <span v-if="getError('email')" class="error-msg">{{ getError('email') }}</span>
      </div>

      <div class="input-group">
        <label>Contraseña</label>
        <div class="input-field" :class="{ 'input-error': getError('password') }">
          <font-awesome-icon icon="fa-solid fa-lock" class="field-icon" />
          <input 
            v-model="form.password" 
            type="password" 
            placeholder="••••••••" 
            required 
            @input="clearError('password')"
          />
        </div>
        <span v-if="getError('password')" class="error-msg">{{ getError('password') }}</span>
      </div>

      <button type="submit" class="primary-btn" :disabled="isLoading">
        <span v-if="isLoading" class="spinner"></span>
        <span v-else>Iniciar Sesión</span>
      </button>
    </form>

    <div class="auth-footer">
      <p>¿No tienes una cuenta? <span @click="goToRegister" class="gold-link">Regístrate aquí</span></p>
      <div class="back-link" @click="goBack">
        <font-awesome-icon icon="fa-solid fa-arrow-left" /> Volver al inicio
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Tarjeta de Cristal */
.glass-card {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  padding: 45px;
  width: 100%;
  max-width: 450px; /* Un poco más angosto que el registro */
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.6);
}

.brand-header { text-align: center; margin-bottom: 25px; }

.logo-box {
  width: 50px; height: 50px; background: #f0b90b; color: #000;
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 900; border-radius: 12px; font-size: 1.6rem; margin: 0 auto 15px;
}

.brand-title { color: #fff; font-size: 2rem; font-weight: 800; margin: 0; letter-spacing: -1px; }
.gold-dot { color: #f0b90b; }
.brand-tagline { color: #848e9c; font-size: 0.95rem; margin-top: 8px; }

.separator { 
  height: 1px; 
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); 
  margin: 25px 0; 
}

.input-group { margin-bottom: 20px; }
.input-group label { display: block; color: #eaecef; font-size: 0.85rem; margin-bottom: 10px; }

.input-field {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  display: flex; align-items: center;
  padding: 0 16px; transition: 0.3s;
}

.input-field:focus-within { border-color: #f0b90b; box-shadow: 0 0 0 1px #f0b90b; }

.input-error {
  border-color: #ff4d4f !important;
  box-shadow: 0 0 0 1px #ff4d4f !important;
}

.error-msg {
  color: #ff4d4f;
  font-size: 0.75rem;
  margin-top: 8px;
  display: block;
  text-align: left;
}

.field-icon { color: #f0b90b; font-size: 0.9rem; opacity: 0.8; }

input {
  background: transparent; border: none; color: #fff; padding: 14px;
  width: 100%; outline: none; font-size: 0.95rem;
}

.primary-btn {
  background: #f0b90b; color: #000; border: none; padding: 16px;
  border-radius: 14px; font-weight: 700; cursor: pointer;
  transition: 0.3s; margin-top: 10px; width: 100%; font-size: 1rem;
}

.primary-btn:hover:not(:disabled) { 
  background: #ffc424; 
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(240, 185, 11, 0.2); 
}

.auth-footer { text-align: center; margin-top: 30px; color: #848e9c; font-size: 0.9rem; }
.gold-link { color: #f0b90b; font-weight: 600; cursor: pointer; }
.gold-link:hover { text-decoration: underline; }

.back-link {
  margin-top: 20px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: 0.2s;
}
.back-link:hover { color: #fff; }

.spinner {
  width: 20px; height: 20px; border: 3px solid rgba(0,0,0,0.1);
  border-top-color: #000; border-radius: 50%; display: inline-block;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>