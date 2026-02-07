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
        <button @click="goToLogin" class="btn-primary">Ir al Dashboard</button>
      </div>

      <div v-else class="error-state">
        <h2>Aún no recibimos la confirmación</h2>
        <p>El pago puede tardar unos minutos. Si ya pagaste, espera un momento y recarga.</p>
        <button @click="checkStatus" class="btn-secondary">Reintentar ahora</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import notify from '@/services/notify'

const route = useRoute()
const router = useRouter()
const checking = ref(true)
const active = ref(false)

// Obtenemos el ID del tenant desde la URL o el storage (donde lo hayas guardado al registrar)
const tenantId = route.query.tenant_id

const checkStatus = async () => {
  checking.value = true
  try {
    // Necesitas crear este endpoint simple en Laravel
    const response = await axios.get(`/api/tenants/check-status/${tenantId}`)
    if (response.data.is_active) {
      active.value = true
      notify.success('¡Pago confirmado!')
    }
  } catch (error) {
    console.error('Error verificando status', error)
  } finally {
    checking.value = false
  }
}

const goToLogin = () => router.push('/login')

onMounted(() => {
  // Intentar verificar al llegar y reintentar cada 5 segundos si no está activo
  checkStatus()
  const interval = setInterval(() => {
    if (active.value) clearInterval(interval)
    else checkStatus()
  }, 5000)
})
</script>

<style scoped>
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
}
</style>
