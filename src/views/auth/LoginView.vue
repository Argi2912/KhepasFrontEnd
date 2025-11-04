<template>
  <div class="login-container">
    <LoginForm />
  </div>
</template>

<script>
import LoginForm from '@/components/auth/LoginForm.vue'

export default {
  name: 'LoginView',
  components: { LoginForm },
}
</script>

<style scoped>
/* ESTILOS DE CENTRADO Y FONDO */
.login-container {
  display: flex;
  align-items: center; /* Centrado vertical */
  justify-content: center; /* Centrado horizontal */
  min-height: 100vh; /* Altura completa de la ventana */
  width: 100%;
  background-color: #1c2127; /* Fondo Negro Profundo */
}
</style>
