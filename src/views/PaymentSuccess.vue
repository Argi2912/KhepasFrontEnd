<template>
  <div class="success-container">
    <div class="success-card">

      <div v-if="checking" class="loading-state">
        <div class="spinner"></div>
        <h2>Procesando tu suscripción...</h2>
        <p>Estamos confirmando el pago con la plataforma. No cierres esta ventana.</p>
      </div>

      <div v-else-if="active" class="active-state">
        <div class="icon-check">✔</div>
        <h2>¡Cuenta Activada!</h2>
        <p>Tu plataforma ya está lista para operar.</p>
        <button @click="goToLogin" class="btn-primary">Iniciar Sesión</button>
      </div>

      <div v-else class="error-state">
        <h2 style="color: #ef4444;">No pudimos confirmar el pago</h2>
        <p style="color: #9ca3af; margin: 10px 0;">{{ errorMessage || 'Hubo un error al procesar la respuesta de PayPal.'
        }}</p>
        <button @click="goToLogin" class="btn-secondary">Volver al Inicio</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/services/api' // Usamos tu instancia configurada
import notify from '@/services/notify'

const route = useRoute()
const router = useRouter()

const checking = ref(true)
const active = ref(false)
const errorMessage = ref('')

// Obtenemos los datos que nos devolvió PayPal
const tenantId = route.query.tenant_id
const token = route.query.token // ID de la orden de PayPal

// Lógica Principal: Capturar el pago
const processCapture = async () => {
  // 1. Validar datos
  if (!tenantId || !token) {
    // Si faltan datos, intentamos ver si ya estaba activa (por si recargó la página)
    checkIfAlreadyActive()
    return
  }

  try {
    // 2. Llamar al Backend para COBRAR y ACTIVAR
    await api.post('subscription/capture-registration', {
      token: token,
      tenant_id: tenantId
    })

    // 3. Éxito total
    active.value = true
    notify.success('¡Pago completado correctamente!')
    checking.value = false

  } catch (error) {
    console.error('Error capturando pago:', error)
    // Si falla la captura, verificamos si es que YA estaba pagado
    checkIfAlreadyActive(error.response?.data?.error)
  }
}

// Lógica de Respaldo: Solo verificar estatus
const checkIfAlreadyActive = async (originalError = '') => {
  try {
    if (!tenantId) throw new Error('Enlace inválido')

    // Consultamos el endpoint público de status
    const response = await api.get(`tenants/check-status/${tenantId}`)

    if (response.data.is_active) {
      active.value = true
      checking.value = false
    } else {
      // Si no está activo y falló la captura, mostramos error
      errorMessage.value = originalError || 'El pago no se completó o fue cancelado.'
      checking.value = false
    }
  } catch (e) {
    errorMessage.value = 'No se pudo verificar el estado de la cuenta.'
    checking.value = false
  }
}

const goToLogin = () => router.push({ name: 'login' })

onMounted(() => {
  // Al cargar, intentamos capturar el pago inmediatamente
  processCapture()
})
</script>

<style scoped>
/* TUS ESTILOS ORIGINALES */
.success-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #0b0e11;
  color: white;
}

.success-card {
  background: #181a20;
  padding: 40px;
  border-radius: 16px;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-left-color: #f0b90b;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.icon-check {
  font-size: 50px;
  color: #0ecb81;
  margin-bottom: 20px;
}

.btn-primary {
  background: #f0b90b;
  color: black;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 20px;
  width: 100%;
  transition: transform 0.2s;
}

.btn-primary:hover {
  background: #d4a409;
}

.btn-secondary {
  background: transparent;
  border: 1px solid #2b3139;
  color: #848e9c;
  padding: 10px 20px;
  border-radius: 8px;
  margin-top: 20px;
  cursor: pointer;
}

.btn-secondary:hover {
  color: white;
  border-color: white;
}
</style>