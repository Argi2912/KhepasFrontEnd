<template>
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card shadow-lg">
          <div class="card-header bg-primary text-white text-center">
            <h4>Iniciar Sesión</h4>
          </div>
          <div class="card-body">
            <div v-if="authStore.authError" class="alert alert-danger" role="alert">
              {{ authStore.authError }}
            </div>

            <form @submit.prevent="submitLogin">
              <div class="mb-3">
                <label for="email" class="form-label">Correo Electrónico</label>
                <input
                  type="email"
                  class="form-control"
                  :class="{ 'is-invalid': inputError.email }"
                  id="email"
                  v-model="credentials.email"
                  required
                />
                <div class="invalid-feedback" v-if="inputError.email">{{ inputError.email }}</div>
              </div>

              <div class="mb-3">
                <label for="password" class="form-label">Contraseña</label>
                <input
                  type="password"
                  class="form-control"
                  :class="{ 'is-invalid': inputError.password }"
                  id="password"
                  v-model="credentials.password"
                  required
                />
                <div class="invalid-feedback" v-if="inputError.password">
                  {{ inputError.password }}
                </div>
              </div>

              <div class="d-grid gap-2">
                <button type="submit" class="btn btn-primary btn-lg" :disabled="authStore.loading">
                  <span
                    v-if="authStore.loading"
                    class="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  {{ authStore.loading ? 'Conectando...' : 'Entrar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, inject } from 'vue'
import { useAuthStore } from '../stores/authStore'
import Swal from 'sweetalert2' // Importamos SweetAlert2
import { Notyf } from 'notyf'

// Inyectamos Notyf (definido en main.js)
const $notyf = new Notyf()

const authStore = useAuthStore()

// Datos del formulario
const credentials = reactive({
  email: '',
  password: '',
})

// Objeto para manejar la validación simple del lado del cliente
const inputError = reactive({
  email: null,
  password: null,
})

/**
 * Lógica principal para el envío del formulario de login.
 */
const submitLogin = async () => {
  // Limpiar errores previos del store y del formulario
  authStore.authError = null
  inputError.email = null
  inputError.password = null

  // 1. Validación simple del lado del cliente
  if (!credentials.email || !credentials.password) {
    if (!credentials.email) inputError.email = 'El correo es obligatorio.'
    if (!credentials.password) inputError.password = 'La contraseña es obligatoria.'
    return
  }

  // 2. Llamar a la acción del store (maneja Axios, Token, Redirección)
  const success = await authStore.handleLogin(credentials)

  // 3. Manejo de retroalimentación
  if (success) {
    // Si la acción fue exitosa (redirigió al dashboard):

    // Notificación elegante con SweetAlert2
    Swal.fire({
      icon: 'success',
      title: '¡Bienvenido!',
      text: `Sesión iniciada como: ${authStore.user.email}`,
      showConfirmButton: false,
      timer: 2000,
    })

    // Opcional: Notificación con Notyf
    $notyf.success(`Hola, ${authStore.user.name || 'usuario'}!`)
  } else {
    // Si hubo un error (authStore.authError ya estará lleno):

    // Notificación de error con Notyf
    $notyf.error(authStore.authError || 'Ocurrió un error inesperado al iniciar sesión.')
  }
}
</script>

<style scoped>
/* Estilos si fueran necesarios */
.card-header {
  border-bottom: none;
}
.shadow-lg {
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.175) !important;
}
</style>
