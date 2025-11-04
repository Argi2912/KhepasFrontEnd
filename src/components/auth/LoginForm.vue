// src/components/auth/LoginForm.vue

<template>
  <form @submit.prevent="handleSubmit" class="login-card">
    <div class="logo-section">
      <img src="@/assets/7.png" alt="Logo TUCONPAY" class="logo-style" />
      <h2 class="title">Iniciar Sesión</h2>
    </div>

    <div class="form-body">
      <CustomInput
        id="email"
        label="Correo Electrónico"
        type="email"
        v-model="credentials.email"
        placeholder="admin@demo.com"
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
    </div>

    <div class="action-section">
      <button type="submit" :disabled="authStore.loading" class="btn-binance">
        <span
          v-if="authStore.loading"
          class="spinner-border"
          role="status"
          aria-hidden="true"
        ></span>
        {{ authStore.loading ? 'Conectando...' : 'Acceder' }}
      </button>
    </div>

    <p class="register-link">
      ¿No tienes cuenta?
      <b><a href="https://wa.me/+584122608533" target="_blank">Contactate con nosotros</a></b>
      <!-- <router-link :to="{ name: 'Register' }">Regístrate aquí</router-link> -->
    </p>
  </form>
</template>

<script setup>
// Usamos <script setup> como en tu archivo original.
import { reactive } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import CustomInput from '@/components/common/CustomInput.vue'

const authStore = useAuthStore()
const credentials = reactive({
  email: 'admin@demo.com',
  password: 'password',
})

const handleSubmit = async () => {
  try {
    await authStore.handleLogin(credentials)
  } catch (error) {
    // El interceptor de Axios (apiClient.js) ya maneja la notificación
  }
}
</script>

<style scoped>
/* ==========================================================
   ESTILOS FINALES (PROFESIONAL, RESPONSIVO, SIN TAILWIND)
   ========================================================== */

/* Tarjeta (Card) */
.login-card {
  width: 90%; /* Responsivo: 90% en móviles */
  max-width: 420px; /* Ancho profesional en escritorios */

  background-color: #2b3139; /* Gris Oscuro */
  border-radius: 16px; /* Bordes suaves (2xl) */

  /* Espaciado profesional (alargado) */
  padding: 2.5rem 3rem;

  /* Sombra flotante (sin borde) */
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
  transition: transform 0.3s ease;
}

.login-card:hover {
  transform: translateY(-5px); /* Efecto de elevación */
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8);
}

/* 1. Sección del Logo */
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem; /* Espacio antes de los inputs */
}
.logo-style {
  width: 90px; /* Logo grande */
  height: 90px;
  margin-bottom: 1rem;
}
.title {
  font-size: 2rem; /* 3xl */
  font-weight: 600; /* semibold */
  color: #f0b90b; /* Acento Amarillo */
  text-align: center;
  letter-spacing: 0.05em; /* tracking-wide */
}

/* 2. Cuerpo del Formulario */
.form-body {
  /* El espaciado (mb-5) se maneja en CustomInput.vue */
  width: 100%;
}

/* 3. Botón de Acción */
.action-section {
  margin-top: 1.5rem; /* Espacio entre el último input y el botón */
}
.btn-binance {
  width: 100%;
  padding: 0.75rem 1rem; /* py-3 */
  font-size: 1.125rem; /* text-lg */
  font-weight: 700; /* font-bold */

  background-color: #f0b90b; /* Acento Amarillo */
  color: #1c2127; /* Texto oscuro */

  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.25s ease;
}
.btn-binance:hover:not(:disabled) {
  background-color: #f5c43d; /* Tono más claro */
}
.btn-binance:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 4. Enlace de Registro */
.register-link {
  text-align: center;
  font-size: 0.875rem; /* text-sm */
  color: #a0aec0; /* text-gray-400 */
  margin-top: 2rem; /* Espacio final */
}
.register-link a {
  color: #f0b90b; /* Acento Amarillo */
  font-weight: 500; /* medium */
  text-decoration: none;
  transition: color 0.2s ease;
}
.register-link a:hover {
  color: #ffffff; /* Blanco en hover */
}

/* Media Query para pantallas pequeñas */
@media (max-width: 480px) {
  .login-card {
    padding: 2rem 1.5rem; /* Menos padding en móviles */
  }
  .title {
    font-size: 1.8rem;
  }
}
</style>
