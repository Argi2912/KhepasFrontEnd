<template>
   
  <div class="row justify-content-center">
    <div class="col-md-6">
      <div class="card shadow-lg">
        <div class="card-header bg-primary text-white text-center">
         
          <h4>Iniciar Sesión</h4>
        </div>
        <div class="card-body">
          <img height="40" width="40" src="../assets/7.png" alt="">


          <div v-if="authStore.authError" class="alert alert-danger" role="alert">
            {{ authStore.authError }}
          </div>

          <form @submit.prevent="submitLogin">
            <div class="mb-3">
              <label for="email" class="form-label">Correo Electrónico</label>
              <input type="email" class="form-control" :class="{ 'is-invalid': inputError.email }" id="email"
                v-model="credentials.email" required />
              <div class="invalid-feedback" v-if="inputError.email">{{ inputError.email }}</div>
            </div>

            <div class="mb-3">
              <label for="password" class="form-label">Contraseña</label>
              <input type="password" class="form-control" :class="{ 'is-invalid': inputError.password }" id="password"
                v-model="credentials.password" required />
              <div class="invalid-feedback" v-if="inputError.password">
                {{ inputError.password }}
              </div>
            </div>

            <div class="d-grid gap-2">
              <button type="submit" class="btn btn-primary btn-lg" :disabled="authStore.loading">
                <span v-if="authStore.loading" class="spinner-border spinner-border-sm" role="status"
                  aria-hidden="true"></span>
                {{ authStore.loading ? 'Conectando...' : 'Entrar' }}
              </button>
            </div>
          </form>
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
    $notyf.error(authStore.authError || 'Bienvenido!')
  }
}
</script>

<style>

/* ===== Fondo general (Manteniendo el color muy oscuro) ===== */
body {
  width: 90%;
  margin: 0 auto;
  padding: 2rem;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #1b263b, #4c98e9);
  font-family: 'Poppins', sans-serif;
  overflow: hidden;
}

/* ===== Tarjeta (Fondo más claro que el body, pero oscuro) ===== */
.card {
  margin-left: 35px;
  /* El fondo del modal en la imagen es un tono oscuro pero más claro que el fondo general */
  background: #1e2a3a;
  /* Un azul oscuro que contrasta */
  /* El borde en la imagen parece ser un azul más claro */
  border: 1px solid rgba(15, 76, 117, 0.5);
  /* Usando el nuevo azul como acento */
  border-radius: 40px;
  transition: all 0.3s ease;
  width: 90%;
  max-width: 600px;
  min-height: 75vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  z-index: 10;
  box-shadow: none;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: none;
}

/* ===== Encabezado (Generalmente un área destacada, usaremos un color más claro) ===== */
.card-header {
  /* Gradient más claro para imitar el brillo/color de la cabecera en la imagen */
  background: linear-gradient(135deg, #189ab4, #73a9ad);
  border-bottom: none;
  border-radius: 40px 40px 0 0;
  padding: 25px;
  text-align: center;
  box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.1);
}

.card-header h4 {
  font-weight: 600;
  font-size: 2vw;
  color: #fff;
  /* Color de texto blanco */
  margin: -0px;
  /* Sombra de texto usando el azul de acento */
  text-shadow: 0 0 10px rgba(15, 76, 117, 0.5);
}

.card-body img {
  display: block;
  justify-content: center;
  margin-top: -100px;
  margin-bottom: -10px;
  margin-left: auto; 
  margin-right: auto;
  width: 10vh;
  height: 10vh;

} 

/* ===== Cuerpo (Fondo blanco/muy claro para el área de contenido principal, como en la imagen) ===== */
.card-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  /* El fondo blanco o muy claro de la tarjeta en la imagen */
  background-color: #ffffff;
  border-radius: 0 0 40px 40px;
  padding: 40px 60px;
  flex-grow: 1;
  justify-content: center;
}

/* ===== Formularios (Texto e inputs dentro del cuerpo blanco) ===== */
.form-label {
  margin-bottom: 10;
  /* Texto más oscuro para contrastar con el fondo blanco */
  color: #333333;
  font-weight: 500;
  text-align: left;
  width: 100%;
}

.form-control {
  /* Borde sutil */
  border: 1px solid #cccccc;
  /* Fondo blanco/casi blanco para el input */
  background: #f9f9f9;
  /* Color de texto oscuro */
  color: #333333;
  border-radius: 30px;
  padding: 14px 18px;
  font-size: 14px;
  transition: all 0.3s ease;
  width: 100%;
  margin-bottom: 20px;
}

.form-control:focus {
  /* El fondo puede ser un poco más oscuro al enfocar */
  background: #ffffff;
  /* Borde de enfoque con el color de acento */
  border-color: #0f4c75;
  /* Sombra de enfoque con el color de acento */
  box-shadow: 0 0 8px rgba(15, 76, 117, 0.3);
}

/* ===== Botón (Usando el azul brillante de la imagen) ===== */
.btn-primary {
  position: relative;
  display: inline-block;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
  overflow: hidden;
  /* Gradient con el color azul brillante de la imagen */
  background: linear-gradient(135deg, #3792cb, #0f4c75);
  border: none;
  border-radius: 30px;
  padding: 14px 28px;
  font-weight: 600;
  font-size: 16px;
  color: #fff;
  transition: all 0.25s ease;
  /* Sombra con el color de acento */
  box-shadow: 0 4px 15px rgba(15, 76, 117, 0.5);
}

.btn-primary::before {
  content: "";
  position: absolute;
  top: 0;
  left: -75%;
  width: 50%;
  height: 100%;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.45) 50%, rgba(255, 255, 255, 0.15) 100%);
  transform: skewX(-25deg);
  transition: all 0.5s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  /* Aumentar la sombra en hover */
  box-shadow: 0 6px 20px rgba(15, 76, 117, 0.7);
  /* Cambiar ligeramente el color en hover */
  background: linear-gradient(135deg, #0f4c75, #3792cb);
}

.btn-primary:hover::before {
  left: 130%;
  transition: all 0.8s ease;
}

.btn-primary:active {
  /* Color más oscuro en estado activo */
  background: linear-gradient(135deg, #003366, #0f4c75);
  transform: translateY(1px);
}

/* ===== Alertas (Usando el color de acento) ===== */
.alert {
  border-radius: 10px;
  text-align: center;
  font-size: 14px;
  /* Fondo muy claro con toque de azul */
  background: rgba(15, 76, 117, 0.1);
  /* Color de texto usando el azul de acento */
  color: #0f4c75;
  /* Borde usando el azul de acento */
  border: 1px solid #0f4c75;
}

/* ===== Animaciones decorativas (Ajustando el color de las formas flotantes) ===== */
body::before,
body::after {
  content: "";
  position: absolute;
  opacity: 0.4;
  animation: float 10s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}

/* Círculo flotante */
body::before {
  width: 30px;
  height: 30px;
  /* Color de acento */
  background: #3792cb;
  border-radius: 50%;
  top: 20%;
  left: 30%;
}

/* Triángulo flotante */
body::after {
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  /* Color de acento */
  border-bottom: 20px solid #0f4c75;
  top: 70%;
  left: 15%;
}

@keyframes float {
  0% {
    transform: translateY(0) rotate(0deg);
  }

  50% {
    transform: translateY(-10px) rotate(15deg);
  }

  100% {
    transform: translateY(0) rotate(0deg);
  }
}

/* ===== Responsivo (Sin cambios de color) ===== */
@media (max-width: 768px) {
  .card {
    width: 95%;
    min-height: 85vh;
  }

  .card-body {
    padding: 30px 20px;
  }
}
</style>
