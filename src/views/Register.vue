<script setup>
import { reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import notify from '@/services/notify'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  company_name: '',
  admin_name: '',
  admin_email: '',
  password: '',
  password_confirmation: '',
  plan: 'basic', // Valor por defecto
  method: 'stripe', // Valor por defecto
})

const isLoading = ref(false)

const handleRegister = async () => {
  isLoading.value = true
  try {
    // 1. Llamamos a la store
    const response = await authStore.register(form)

    // DEBUG: Mira qué llega exactamente en la consola
    console.log('Respuesta completa del backend:', response)

    // 2. Verificamos la URL.
    // A veces Axios envuelve la respuesta en .data, a veces la store ya lo hace.
    const url = response.data?.url || response.url

    if (url) {
      notify.success('Redirigiendo a la pasarela de pago...')
      // Pequeño delay para que el usuario vea el mensaje
      setTimeout(() => {
        window.location.href = url
      }, 1000)
    } else {
      notify.error('No se recibió la URL de pago.')
    }
  } catch (error) {
    // Si el backend responde con error 422 o 500
    const msg = error.response?.data?.error || 'Error al procesar el registro'
    notify.error(msg)
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

const goToLogin = () => router.push({ name: 'login' })
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h2>Crea tu Casa de Cambio</h2>
        <p>Configura tu plataforma multi-tenant en minutos</p>
      </div>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-section">
          <label><font-awesome-icon icon="building" /> Nombre de la Empresa</label>
          <input v-model="form.company_name" type="text" placeholder="Ej. Cambio Seguro" required />
        </div>

        <div class="form-row">
          <div class="form-section">
            <label><font-awesome-icon icon="user" /> Nombre Admin</label>
            <input v-model="form.admin_name" type="text" placeholder="Tu nombre" required />
          </div>
          <div class="form-section">
            <label><font-awesome-icon icon="envelope" /> Email Admin</label>
            <input v-model="form.admin_email" type="email" placeholder="admin@correo.com" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-section">
            <label><font-awesome-icon icon="lock" /> Contraseña</label>
            <input v-model="form.password" type="password" placeholder="••••••••" required />
          </div>
          <div class="form-section">
            <label><font-awesome-icon icon="lock" /> Confirmar</label>
            <input v-model="form.password_confirmation" type="password" placeholder="••••••••" required />
          </div>
        </div>

        <div class="plans-container">
          <label class="section-title">Selecciona tu Plan</label>
          <div class="plan-cards">
            <div class="plan-card" :class="{ active: form.plan === 'basic' }" @click="form.plan = 'basic'">
              <div class="plan-info">
                <h3>Básico</h3>
                <p>$10.00<span>/mes</span></p>
              </div>
              <ul class="plan-features">
                <li><font-awesome-icon icon="check" /> 1 Usuario</li>
                <li><font-awesome-icon icon="check" /> Gestión de Caja</li>
              </ul>
            </div>
            <div class="plan-card" :class="{ active: form.plan === 'pro' }" @click="form.plan = 'pro'">
              <div class="plan-info">
                <h3>Profesional</h3>
                <p>$29.99<span>/mes</span></p>
              </div>
              <ul class="plan-features">
                <li><font-awesome-icon icon="check" /> Usuarios Ilimitados</li>
                <li><font-awesome-icon icon="check" /> Multi-divisa PRO</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="payment-methods">
          <label class="section-title">Método de Pago</label>
          <div class="method-options">
            <label class="method-btn" :class="{ selected: form.method === 'stripe' }">
              <input type="radio" v-model="form.method" value="stripe" />
              <font-awesome-icon :icon="['fab', 'stripe']" /> Tarjeta de Crédito
            </label>
            <label class="method-btn" :class="{ selected: form.method === 'paypal' }">
              <input type="radio" v-model="form.method" value="paypal" />
              <font-awesome-icon :icon="['fab', 'paypal']" /> PayPal
            </label>
          </div>
        </div>

        <button type="submit" class="btn-primary" :disabled="isLoading">
          <span v-if="!isLoading">Pagar y Activar Cuenta</span>
          <span v-else><font-awesome-icon icon="spinner" spin /> Procesando...</span>
        </button>
      </form>

      <div class="auth-footer">¿Ya tienes una cuenta? <a @click="goToLogin">Inicia Sesión</a></div>
    </div>
  </div>
</template>

<style scoped>
/* Contenedor de Planes */

.section-title {
  display: block;
  margin-bottom: 10px;
  font-weight: 600;
  color: #f0b90b;
}

.plan-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.plan-card {
  background: #1e2329;
  border: 2px solid #2b3139;
  padding: 15px;
  border-radius: 12px;
  cursor: pointer;
  transition: 0.3s;
}

.plan-card.active {
  border-color: #f0b90b;
  background: rgba(240, 185, 11, 0.05);
}

.plan-card h3 {
  font-size: 1rem;
  margin-bottom: 5px;
}

.plan-card p {
  font-size: 1.2rem;
  font-weight: bold;
  color: #f0b90b;
}

.plan-card p span {
  font-size: 0.8rem;
  color: #848e9c;
}

.plan-features {
  list-style: none;
  padding: 0;
  margin-top: 10px;
  font-size: 0.75rem;
  color: #848e9c;
}

/* Métodos de Pago */
.method-options {
  display: flex;
  gap: 10px;
}

.method-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #2b3139;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.3s;
  font-size: 0.9rem;
  border: 1px solid transparent;
}

.method-btn.selected {
  border-color: #f0b90b;
  color: #f0b90b;
  background: #1e2329;
}

.method-btn input {
  display: none;
}

/* Estilos de formulario base (manteniendo tu línea) */


.auth-card {
  background: #181a20;
  padding: 30px;
  border-radius: 16px;
  width: 100%;
  max-width: 550px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-section {
  margin-bottom: 15px;
}

.form-section label {
  display: block;
  margin-bottom: 5px;
  font-size: 0.85rem;
  color: #848e9c;
}

input {
  width: 100%;
  background: #2b3139;
  border: none;
  padding: 12px;
  border-radius: 8px;
  color: white;
}

.btn-primary {
  width: 100%;
  padding: 15px;
  background: #f0b90b;
  color: black;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 20px;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-footer {
  text-align: center;
  margin-top: 20px;
  color: #848e9c;
}

.auth-footer a {
  color: #f0b90b;
  cursor: pointer;
}
</style>
