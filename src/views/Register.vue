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
  plan: 'basic',
  method: 'stripe',
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
    console.log('Respuesta completa del backend:', response)

    const url = response.data?.url || response.url

    if (url) {
      notify.success('Redirigiendo a la pasarela de pago...')
      setTimeout(() => {
        window.location.href = url
      }, 1000)
    } else {
      notify.error('No se recibió la URL de pago.')
    }
  } catch (error) {
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
              :class="{ active: form.plan === 'basic' }"
              @click="form.plan = 'basic'"
            >
              <div class="plan-info">
                <h3>Básico</h3>
                <p>$10.00<span>/mes</span></p>
              </div>
              <ul class="plan-features">
                <li><font-awesome-icon icon="check" /> 1 Usuario</li>
                <li><font-awesome-icon icon="check" /> Gestión de Caja</li>
              </ul>
            </div>
            <div
              class="plan-card"
              :class="{ active: form.plan === 'pro' }"
              @click="form.plan = 'pro'"
            >
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
          <span v-if="!isLoading">Pagar y Activar Cuenta</span>
          <span v-else><font-awesome-icon icon="spinner" spin /> Procesando...</span>
        </button>

        <p class="legal-disclaimer">
          Al registrarte, confirmas que entiendes que Tu Conpay es solo una herramienta de registro.
        </p>
      </form>

      <div class="auth-footer">¿Ya tienes una cuenta? <a @click="goToLogin">Inicia Sesión</a></div>
    </div>

    <div v-if="showTermsModal" class="modal-overlay" @click.self="showTermsModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Política de Privacidad - Tu Conpay</h3>
          <button class="close-btn" @click="showTermsModal = false">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <p class="last-update">Última actualización: 12 de febrero de 2026</p>
          <p>
            En <strong>Productos Digitales SyO LLC</strong> (en adelante, "la Empresa"), valoramos
            la privacidad de nuestros usuarios. Esta Política de Privacidad describe cómo tratamos
            la información en la aplicación <strong>Tu Conpay</strong>.
          </p>
          <p>
            Al utilizar nuestros servicios, usted acepta las prácticas descritas en este documento.
          </p>

          <h4>1. Recolección de Información</h4>
          <p>Para el funcionamiento de la App, recolectamos dos tipos de datos:</p>
          <ul>
            <li>
              <strong>Datos de Cuenta:</strong> Información básica para la creación del perfil
              (nombre, correo electrónico y datos de autenticación).
            </li>
            <li>
              <strong>Datos de Transacciones:</strong> Información que el Usuario introduce
              manualmente sobre sus operaciones de corretaje o P2P (montos, divisas, nombres de
              contrapartes, fechas).
            </li>
          </ul>

          <h4>2. Uso de la Información (Compromiso de No Explotación)</h4>
          <p>
            Nuestra filosofía es de mínimo acceso. La información que usted registra en la App se
            utiliza exclusivamente para:
          </p>
          <ul>
            <li>
              Proporcionar las funciones de registro y organización solicitadas por el Usuario.
            </li>
            <li>Generar reportes y estadísticas que solo el Usuario puede visualizar.</li>
            <li>Brindar soporte técnico cuando el Usuario lo solicite expresamente.</li>
          </ul>
          <p>
            <strong>Garantía de Privacidad:</strong> Productos Digitales SyO LLC NO vende, NO
            alquila, NO intercambia ni utiliza los datos de sus transacciones para fines
            publicitarios, de marketing o de análisis de mercado por terceros. Los datos de sus
            operaciones comerciales pertenecen exclusivamente a usted.
          </p>

          <h4>3. Confidencialidad y Terceros</h4>
          <p>
            No compartimos información personal o financiera con ninguna entidad, empresa o
            individuo, excepto en los siguientes casos limitados:
          </p>
          <ul>
            <li>
              <strong>Cumplimiento Legal:</strong> Si es requerido por una orden judicial o
              autoridad competente bajo las leyes aplicables en los Estados Unidos.
            </li>
            <li>
              <strong>Proveedores de Infraestructura:</strong> Compartimos datos estrictamente
              técnicos con proveedores de servicios de nube (como AWS o Google Cloud) necesarios
              para el alojamiento de la App, quienes operan bajo estrictos acuerdos de
              confidencialidad.
            </li>
          </ul>

          <h4>4. Seguridad de los Datos</h4>
          <p>
            Implementamos medidas de seguridad de nivel industrial para proteger su información:
          </p>
          <ul>
            <li>
              <strong>Cifrado:</strong> Los datos sensibles son cifrados tanto en tránsito (SSL/TLS)
              como en reposo.
            </li>
            <li>
              <strong>Acceso Restringido:</strong> Solo personal autorizado de soporte técnico tiene
              acceso limitado a los sistemas, y únicamente bajo petición del Usuario.
            </li>
          </ul>

          <h4>5. Control del Usuario sobre sus Datos</h4>
          <p>Usted es el dueño de su información. En cualquier momento puede:</p>
          <ul>
            <li>
              <strong>Acceder y Exportar:</strong> Obtener un registro de sus datos almacenados.
            </li>
            <li>
              <strong>Rectificar:</strong> Corregir cualquier error en su información de perfil.
            </li>
            <li>
              <strong>Eliminar:</strong> Solicitar la eliminación definitiva de su cuenta y todos
              los registros asociados. Una vez eliminada, la información no podrá ser recuperada.
            </li>
          </ul>

          <h4>6. Cambios en esta Política</h4>
          <p>
            Cualquier cambio significativo en la forma en que manejamos la privacidad será
            notificado a través de la App o vía correo electrónico. El uso continuado de la App tras
            dichas modificaciones constituye la aceptación de la nueva política.
          </p>

          <h4>7. Contacto</h4>
          <p>
            Si tiene dudas sobre esta política o el manejo de sus datos por parte de Productos
            Digitales SyO LLC, puede contactarnos en:
          </p>
          <ul>
            <li>WhatsApp de Soporte: ---</li>
            <li>Email: admin@tuconpay.com</li>
          </ul>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" @click="showTermsModal = false">Cerrar</button>
        </div>
      </div>
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

/* Estilos de formulario base */
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
  opacity: 0.5;
  cursor: not-allowed;
  background: #7a7a7a;
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

/* --- Nuevos Estilos para Términos y Disclaimer --- */

.terms-container {
  margin-top: 20px;
  margin-bottom: 5px;
}

.terms-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  color: #eaeaea;
  cursor: pointer;
}

.terms-label input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #f0b90b;
}

.terms-label a {
  color: #f0b90b;
  text-decoration: underline;
}

.legal-disclaimer {
  margin-top: 15px;
  font-size: 0.75rem;
  color: #848e9c;
  text-align: center;
  line-height: 1.4;
  border-top: 1px solid #2b3139;
  padding-top: 10px;
}

/* --- Estilos del Modal --- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: #181a20;
  width: 100%;
  max-width: 600px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  max-height: 90vh; /* Para permitir scroll si es muy alto */
  border: 1px solid #2b3139;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.modal-header {
  padding: 15px 20px;
  border-bottom: 1px solid #2b3139;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #f0b90b;
  font-size: 1.1rem;
}

.close-btn {
  background: none;
  border: none;
  color: #848e9c;
  cursor: pointer;
  font-size: 1.2rem;
}

.close-btn:hover {
  color: white;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  color: #d1d5db;
  font-size: 0.9rem;
  line-height: 1.6;
}

.modal-body h4 {
  color: #f0b90b;
  margin-top: 20px;
  margin-bottom: 10px;
}

.modal-body ul {
  padding-left: 20px;
  margin-bottom: 15px;
}

.modal-body li {
  margin-bottom: 5px;
}

.last-update {
  font-style: italic;
  color: #848e9c;
  margin-bottom: 15px;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #2b3139;
  display: flex;
  justify-content: flex-end;
}

.modal-footer .btn-primary {
  width: auto;
  margin-top: 0;
  padding: 10px 25px;
}
</style>
