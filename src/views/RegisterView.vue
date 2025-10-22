<template>
  <div class="auth-page">
    <div class="register-card">
      <div class="form-header">
        <h2>Crea una Cuenta</h2>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="name">Nombre Completo</label>
          <input
            type="text"
            id="name"
            v-model="form.name"
            placeholder="Ingresa tu nombre completo"
          />
          <span v-if="errors.name" class="error">{{ errors.name }}</span>
        </div>

        <div class="form-group">
          <label for="email">Correo Electrónico</label>
          <input
            type="email"
            id="email"
            v-model="form.email"
            placeholder="Ingresa tu correo electrónico"
          />
          <span v-if="errors.email" class="error">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <input
            type="password"
            id="password"
            v-model="form.password"
            placeholder="Crea una contraseña segura"
          />
          <span v-if="errors.password" class="error">{{ errors.password }}</span>
        </div>

        <div class="form-group">
          <label for="repetirPassword">Repetir Contraseña</label>
          <input
            type="password"
            id="repetirPassword"
            v-model="form.repetirPassword"
            placeholder="Confirma tu contraseña"
          />
          <span v-if="errors.repetirPassword" class="error">{{ errors.repetirPassword }}</span>
        </div>

        <button type="submit" class="submit-button">Registrarse</button>

        <p class="login-link">
          ¿Ya tienes una cuenta?
          <RouterLink to="/Login">Iniciar Sesión</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>

<script>
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
// No instancies el store aquí afuera, hazlo en 'setup' o 'created'
// const authStore = useAuthStore() <--- Quitar esto

export default {
  // CAMBIO: Importar 'useAuthStore' para usarlo en 'methods'
  setup() {
    const authStore = useAuthStore()
    return { authStore }
  },
  data() {
    return {
      form: {
        // CAMBIO: 'name' en lugar de 'nombreCompleto' y 'usuario'
        name: '',
        email: '',
        password: '',
        repetirPassword: '',
      },
      errors: {},
    }
  },
  methods: {
    validateForm() {
      this.errors = {}
      // CAMBIO: Validar 'name' y quitar 'usuario'
      if (!this.form.name) this.errors.name = 'El nombre completo es obligatorio.'
      if (!this.form.email) {
        this.errors.email = 'El correo electrónico es obligatorio.'
      } else if (!/\S+@\S+\.\S+/.test(this.form.email)) {
        this.errors.email = 'El correo electrónico no es válido.'
      }
      if (!this.form.password) {
        this.errors.password = 'La contraseña es obligatoria.'
      } else if (this.form.password.length < 6) {
        // Añadida validación de longitud
        this.errors.password = 'La contraseña debe tener al menos 6 caracteres.'
      }
      if (this.form.password !== this.form.repetirPassword)
        this.errors.repetirPassword = 'Las contraseñas no coinciden.'

      return Object.keys(this.errors).length === 0
    },
    handleSubmit() {
      if (this.validateForm()) {
        // CAMBIO: Llamar al store desde 'this'
        this.authStore.handleRegister(this.form)
      }
    },
  },
}
</script>

<style scoped>
/* ===== Fondo general elegante (Mantenido) ===== */
.auth-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Mantiene el degradado azul oscuro original */
  background: linear-gradient(120deg, #1e3c72, #2a5298);
  font-family: 'Poppins', sans-serif;
  color: #fff;
  overflow: hidden;
  position: relative;
  border-radius: 50px;
}

/* ===== Tarjeta principal (Ahora es BLANCA) ===== */
.auth-card {
  display: flex;
  width: 900px;
  max-width: 95%;
  /* Fondo BLANCO para la tarjeta */
  background: #ffffff;
  /* Borde y sombra ajustados para contrastar con el fondo oscuro */
  border: 1px solid rgba(200, 200, 200, 0.5);
  border-radius: 15px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.auth-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
}

/* ===== Formulario (Sección dentro de la tarjeta blanca) ===== */
.auth-form-section {
  flex: 1.2;
  padding: 50px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  /* El texto debe ser oscuro sobre el fondo blanco */
  color: #333333;
}

.form-header {
  text-align: center;
  margin-bottom: 35px;
}

/* Logo (Usando el color celeste de acento) */
.form-header .form-logo {
  width: 90px;
  margin-bottom: 15px;
  /* Sombra con el color de acento */
  filter: drop-shadow(0 0 10px rgba(91, 158, 219, 0.5));
}

.form-header h2 {
  /* Título del formulario en color oscuro o de acento */
  color: #333333;
  font-size: 26px;
  font-weight: 600;
}

/* ===== Inputs ===== */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  /* Texto de etiqueta oscuro */
  color: #555555;
  font-weight: 500;
  margin-bottom: 8px;
  text-align: left; /* Alineado a la izquierda para mejor UX */
}

.form-group input {
  width: 100%;
  /* Borde sutil */
  border: 1px solid #d0d7e0;
  /* Fondo de input muy claro */
  background: #f9f9f9;
  /* Color de texto oscuro */
  color: #333333;
  border-radius: 30px;
  padding: 14px 18px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-group input:focus {
  /* Fondo más claro al enfocar */
  background: #ffffff;
  /* Borde de enfoque con el color de acento celeste */
  border-color: #5b9edb;
  box-shadow: 0 0 8px rgba(91, 158, 219, 0.3);
  outline: none;
}

/* ===== Errores ===== */
.error {
  color: #ff6b6b;
  font-size: 13px;
  margin-top: 5px;
  display: block;
  text-align: left;
}

/* ===== Botón (Celeste de la imagen) ===== */
.submit-button {
  width: 100%;
  /* Degradado de azul celeste */
  background: linear-gradient(135deg, #87ceeb, #5b9edb);
  border: none;
  border-radius: 30px;
  padding: 14px;
  font-weight: 600;
  font-size: 16px;
  color: #fff;
  cursor: pointer;
  /* Sombra con el color de acento */
  box-shadow: 0 4px 10px rgba(91, 158, 219, 0.5);
  transition: all 0.3s ease;
  margin-top: 30px;
}

.submit-button:hover {
  transform: translateY(-2px);
  /* Sombra y colores en hover */
  box-shadow: 0 6px 16px rgba(91, 158, 219, 0.7);
  background: linear-gradient(135deg, #5b9edb, #87ceeb);
}

/* ===== Enlace (Texto oscuro y link celeste) ===== */
.login-link {
  text-align: center;
  margin-top: 25px;
  /* Texto más oscuro */
  color: #555555;
  font-size: 14px;
}

.login-link a {
  /* Link en color celeste */
  color: #5b9edb;
  text-decoration: none;
  font-weight: 600;
}

.login-link a:hover {
  text-decoration: underline;
}

/* ===== Responsivo (Mantenido) ===== */
@media (max-width: 992px) {
  .auth-card {
    flex-direction: column;
  }

  .auth-logo-section {
    display: none;
  }

  .auth-form-section {
    padding: 40px 25px;
  }
}

/* Luces decorativas (Mantenidas) */
.auth-page::before,
.auth-page::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(130px);
  opacity: 0.25;
}

.register-card {
  position: relative;
  z-index: 2;
  /* Fondo BLANCO */
  background: #ffffff;
  border-radius: 20px;
  padding: 45px 40px;
  width: 420px;
  /* Borde sutil */
  border: 1px solid rgba(220, 220, 220, 0.5);
  /* Sombra para contrastar con fondo oscuro */
  box-shadow: 0 0 25px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  animation: fadeInUp 0.8s ease-out forwards;
  opacity: 0;
  transform: translateY(40px);
  /* Color de texto oscuro por defecto */
  color: #333333;
}

.register-card:hover {
  box-shadow: 0 0 35px rgba(0, 0, 0, 0.4);
  transform: translateY(-2px);
}

/* ===== ANIMACIÓN (Mantenida) ===== */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== ENCABEZADO (Ajustado a colores oscuros/celeste) ===== */
.form-header {
  text-align: center;
  margin-bottom: 30px;
}

.form-logo {
  width: 90px;
  margin-bottom: 12px;
  /* Acento celeste */
  filter: drop-shadow(0 0 8px rgba(91, 158, 219, 0.7));
}

.form-header h2 {
  /* Texto oscuro */
  color: #333333;
  font-size: 26px;
  font-weight: 600;
}

/* ===== CAMPOS (Ajustado a colores oscuros/celeste) ===== */
.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  font-weight: 500;
  /* Texto oscuro */
  color: #555555;
  margin-bottom: 6px;
  text-align: left;
}

.form-group input {
  width: 100%;
  /* Fondo de input muy claro */
  background: #f9f9f9;
  /* Borde sutil */
  border: 1px solid #d0d7e0;
  /* Texto oscuro */
  color: #333333;
  border-radius: 25px;
  padding: 12px 16px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-group input:focus {
  background: #ffffff;
  /* Acento celeste en focus */
  border-color: #5b9edb;
  box-shadow: 0 0 8px rgba(91, 158, 219, 0.3);
  outline: none;
}

/* ===== BOTÓN (Acento celeste) ===== */
.submit-button {
  width: 100%;
  /* Degradado de azul celeste */
  background: linear-gradient(135deg, #87ceeb, #5b9edb);
  border: none;
  border-radius: 25px;
  padding: 12px;
  font-weight: 600;
  font-size: 16px;
  color: #fff;
  cursor: pointer;
  /* Sombra de acento */
  box-shadow: 0 4px 10px rgba(91, 158, 219, 0.4);
  transition: all 0.3s ease;
  margin-top: 25px;
}

.submit-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(91, 158, 219, 0.6);
  background: linear-gradient(135deg, #5b9edb, #87ceeb);
}

/* ===== ENLACE (Ajustado a colores oscuros/celeste) ===== */
.login-link {
  margin-top: 25px;
  /* Texto oscuro */
  color: #555555;
  font-size: 14px;
  text-align: center;
}

.login-link a {
  /* Link celeste */
  color: #5b9edb;
  font-weight: 600;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>
