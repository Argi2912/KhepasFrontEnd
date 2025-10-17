<template>
 
      <!-- Sección derecha: formulario -->
      <div class="auth-form-section">
        <div class="form-header">
          <img src="/src/assets/7.png" alt="Kephas Logo" class="form-logo" />
          <h2>Crea una Cuenta</h2>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="usuario">Usuario</label>
            <input
              type="text"
              id="usuario"
              v-model="form.usuario"
              placeholder="Ingresa tu nombre de usuario"
            />
            <span v-if="errors.usuario" class="error">{{ errors.usuario }}</span>
          </div>

          <div class="form-group">
            <label for="nombreCompleto">Nombre Completo</label>
            <input
              type="text"
              id="nombreCompleto"
              v-model="form.nombreCompleto"
              placeholder="Ingresa tu nombre completo"
            />
            <span v-if="errors.nombreCompleto" class="error">{{
              errors.nombreCompleto
            }}</span>
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
            <span v-if="errors.password" class="error">{{
              errors.password
            }}</span>
          </div>

          <div class="form-group">
            <label for="repetirPassword">Repetir Contraseña</label>
            <input
              type="password"
              id="repetirPassword"
              v-model="form.repetirPassword"
              placeholder="Confirma tu contraseña"
            />
            <span v-if="errors.repetirPassword" class="error">{{
              errors.repetirPassword
            }}</span>
          </div>

          <button type="submit" class="submit-button">Registrarse</button>

          <p class="login-link">
            ¿Ya tienes una cuenta?
            <RouterLink to ="/Login">Iniciar Sesión</RouterLink>
          </p>
        </form>
      </div>
 
</template>

<script>
import { RouterLink } from 'vue-router';


export default {
  data() {
    return {
      form: {
        usuario: '',
        nombreCompleto: '',
        email: '',
        password: '',
        repetirPassword: '',
      },
      errors: {},
    };
  },
  methods: {
    validateForm() {
      this.errors = {};
      if (!this.form.usuario) this.errors.usuario = 'El nombre de usuario es obligatorio.';
      if (!this.form.nombreCompleto) this.errors.nombreCompleto = 'El nombre completo es obligatorio.';
      if (!this.form.email) {
        this.errors.email = 'El correo electrónico es obligatorio.';
      } else if (!/\S+@\S+\.\S+/.test(this.form.email)) {
        this.errors.email = 'El correo electrónico no es válido.';
      }
      if (!this.form.password) this.errors.password = 'La contraseña es obligatoria.';
      if (this.form.password !== this.form.repetirPassword)
        this.errors.repetirPassword = 'Las contraseñas no coinciden.';
      return Object.keys(this.errors).length === 0;
    },
    handleSubmit() {
      if (this.validateForm()) {
        const userData = { ...this.form };
        alert('¡Registro exitoso!');
        console.log('Datos del formulario a enviar:', userData);
        this.form = { usuario: '', nombreCompleto: '', email: '', password: '', repetirPassword: '' };
      }
    },
  },
};
</script>

<style scoped>
body {
  background: linear-gradient(135deg, #0a0f1f, #0f172a);
  font-family: 'Poppins', sans-serif;
  color: #fff;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== Fondo general elegante ===== */
.auth-page {
  
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0f1f, #0f172a);
  font-family: 'Poppins', sans-serif;
  color: #fff;
  overflow: hidden;
  position: relative;
}

/* ===== Tarjeta principal ===== */
.auth-card {
  display: flex;
  width: 900px;
  max-width: 95%;
  background: #0f172a;
  border: 1px solid rgba(0, 170, 255, 0.3);
  border-radius: 15px;
  box-shadow: 0 0 30px rgba(0, 170, 255, 0.15);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.auth-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 0 40px rgba(0, 170, 255, 0.25);
}
/* ===== Formulario ===== */
.auth-form-section {
  flex: 1.2;
  padding: 50px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.form-header {
  text-align: center;
  margin-bottom: 35px;
}

.form-header .form-logo {
  width: 90px;
  margin-bottom: 15px;
  filter: drop-shadow(0 0 10px rgba(0, 170, 255, 0.5));
}

.form-header h2 {
  color: #00bfff;
  font-size: 26px;
  font-weight: 600;
}

/* ===== Inputs ===== */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: #cdd6f4;
  font-weight: 500;
  margin-bottom: 8px;
}

.form-group input {
  width: 100%;
  border: 1px solid #1e2a3a;
  background: #101a2a;
  color: #fff;
  border-radius: 30px;
  padding: 14px 18px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-group input:focus {
  background: #162337;
  border-color: #00aaff;
  box-shadow: 0 0 8px rgba(0, 170, 255, 0.3);
  outline: none;
}

/* ===== Errores ===== */
.error {
  color: #ff6b6b;
  font-size: 13px;
  margin-top: 5px;
  display: block;
}

/* ===== Botón ===== */
.submit-button {
  width: 100%;
  background: linear-gradient(135deg, #007bff, #00bfff);
  border: none;
  border-radius: 30px;
  padding: 14px;
  font-weight: 600;
  font-size: 16px;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 170, 255, 0.4);
  transition: all 0.3s ease;
  margin-top: 30px;
}

.submit-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 170, 255, 0.6);
  background: linear-gradient(135deg, #00aaff, #007bff);
}

/* ===== Enlace ===== */
.login-link {
  text-align: center;
  margin-top: 25px;
  color: #cdd6f4;
  font-size: 14px;
}

.login-link a {
  color: #00bfff;
  text-decoration: none;
  font-weight: 600;
}

.login-link a:hover {
  text-decoration: underline;
}

/* ===== Responsivo ===== */
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
</style>
