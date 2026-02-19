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
  plan: 'free', // 'free', 'basic', 'pro'
})

const isLoading = ref(false)
const acceptedTerms = ref(false)
const showTermsModal = ref(false)

const handleRegister = async () => {
  if (!acceptedTerms.value) {
    notify.error('Debes aceptar la Política de Privacidad para continuar.')
    return
  }

  isLoading.value = true
  try {
    const response = await authStore.register(form)

    // Si el backend devuelve una URL (PayPal)
    const paypalUrl = response?.data?.url || response?.url

    if (paypalUrl) {
      notify.success('Redirigiendo a PayPal para completar el pago...')
      setTimeout(() => {
        window.location.href = paypalUrl
      }, 1000)
    } else {
      notify.success('¡Cuenta creada! Tienes 7 días de prueba gratis.')
      setTimeout(() => {
        router.push({ name: 'login' })
      }, 1500)
    }
  } catch (error) {
    const msg = error.response?.data?.error || 'Error al procesar el registro'
    notify.error(msg)
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
        <h2>{{ form.plan === 'free' ? 'Prueba Gratis por 7 Días' : 'Crea tu Cuenta' }}</h2>
        <p>Configura tu plataforma y escala tu negocio</p>
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
            <input
              v-model="form.admin_email"
              type="email"
              placeholder="admin@correo.com"
              required
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-section">
            <label><font-awesome-icon icon="lock" /> Contraseña</label>
            <input v-model="form.password" type="password" placeholder="••••••••" required />
          </div>
          <div class="form-section">
            <label><font-awesome-icon icon="lock" /> Confirmar</label>
            <input
              v-model="form.password_confirmation"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <div class="plans-container">
          <label class="section-title">Selecciona tu Plan</label>
          <div class="plan-cards">
            <div
              class="plan-card"
              :class="{ active: form.plan === 'free' }"
              @click="form.plan = 'free'"
            >
              <div class="plan-info">
                <h3>Gratis</h3>
                <p>$0<span>/7 días</span></p>
              </div>
            </div>

            <div
              class="plan-card"
              :class="{ active: form.plan === 'basic' }"
              @click="form.plan = 'basic'"
            >
              <div class="plan-info">
                <h3>Básico</h3>
                <p>$10<span>/mes</span></p>
              </div>
            </div>

            <div
              class="plan-card"
              :class="{ active: form.plan === 'pro' }"
              @click="form.plan = 'pro'"
            >
              <div class="plan-info">
                <h3>Pro</h3>
                <p>$29.99<span>/mes</span></p>
              </div>
            </div>
          </div>
        </div>

        <div class="terms-container">
          <label class="terms-label">
            <input type="checkbox" v-model="acceptedTerms" />
            <span>
              He leído y acepto la
              <a href="#" @click.prevent="showTermsModal = true">Política de Privacidad</a>
            </span>
          </label>
        </div>

        <button type="submit" class="btn-primary" :disabled="isLoading || !acceptedTerms">
          <span v-if="!isLoading">
            {{ form.plan === 'free' ? 'Comenzar Prueba Gratis' : 'Pagar con PayPal' }}
          </span>
          <span v-else><font-awesome-icon icon="spinner" spin /> Procesando...</span>
        </button>

        <p class="legal-disclaimer">
          {{
            form.plan === 'free'
              ? 'No requiere tarjeta. La cuenta expirará tras 7 días.'
              : 'Serás redirigido a la pasarela segura de PayPal.'
          }}
        </p>
      </form>

      <div class="auth-footer">¿Ya tienes cuenta? <a @click="goToLogin">Inicia Sesión</a></div>
    </div>

    <div v-if="showTermsModal" class="modal-overlay" @click.self="showTermsModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Política de Privacidad</h3>
          <button class="close-btn" @click="showTermsModal = false">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <p>
            Tus datos se utilizarán exclusivamente para gestionar tu acceso al sistema y la
            facturación del plan seleccionado...
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0b0e11;
  padding: 20px;
}

.auth-card {
  background: #181a20;
  padding: 30px;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
}

.auth-header {
  text-align: center;
  margin-bottom: 20px;
}
.auth-header h2 {
  color: #f0b90b;
}
.auth-header p {
  color: #848e9c;
  font-size: 0.9rem;
}

/* REGLA CRÍTICA: Evita que el input:100% afecte al checkbox */
input:not([type='checkbox']) {
  width: 100%;
  background: #2b3139;
  border: 1px solid transparent;
  padding: 12px;
  border-radius: 8px;
  color: white;
  transition: 0.3s;
}

input:not([type='checkbox']):focus {
  border-color: #f0b90b;
  outline: none;
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

/* Planes */
.section-title {
  color: #f0b90b;
  font-weight: bold;
  margin-bottom: 10px;
  display: block;
}
.plan-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}
.plan-card {
  background: #1e2329;
  border: 2px solid #2b3139;
  padding: 15px;
  border-radius: 12px;
  cursor: pointer;
  text-align: center;
  transition: 0.3s;
}
.plan-card.active {
  border-color: #f0b90b;
  background: rgba(240, 185, 11, 0.05);
}
.plan-card h3 {
  font-size: 0.85rem;
  color: #fff;
}
.plan-card p {
  font-size: 1rem;
  color: #f0b90b;
  font-weight: bold;
}
.plan-card p span {
  font-size: 0.65rem;
  color: #848e9c;
}

/* CHECKBOX CORREGIDO */
.terms-container {
  margin: 15px 0;
  display: flex;
  justify-content: flex-start;
}

.terms-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.85rem;
  color: #848e9c;
  cursor: pointer;
  line-height: 1.2;
}

.terms-label input[type='checkbox'] {
  width: 18px;
  height: 18px;
  margin: 0;
  flex-shrink: 0;
  accent-color: #f0b90b;
  cursor: pointer;
}

.btn-primary {
  width: 100%;
  padding: 15px;
  background: #f0b90b;
  color: #000;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
}
.btn-primary:disabled {
  opacity: 0.5;
  background: #474d57;
}

.legal-disclaimer {
  font-size: 0.7rem;
  color: #848e9c;
  text-align: center;
  margin-top: 10px;
}
.auth-footer {
  text-align: center;
  margin-top: 20px;
  color: #848e9c;
}
.auth-footer a {
  color: #f0b90b;
  cursor: pointer;
  text-decoration: underline;
}

/* Modal sencillo */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: #181a20;
  padding: 20px;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  border: 1px solid #2b3139;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #2b3139;
  padding-bottom: 10px;
}
.close-btn {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
}

@media (max-width: 600px) {
  .plan-cards {
    grid-template-columns: 1fr;
  }
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
