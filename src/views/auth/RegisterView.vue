<template>
  <div class="auth-container">
    <RegisterForm />
  </div>
</template>

<script>
import RegisterForm from '@/components/auth/RegisterForm.vue'

export default {
  name: 'RegisterView',
  components: { RegisterForm },
}
</script>

<style scoped>
/* ¡No se necesitan estilos aquí! 
  Todo el estilo de centrado y fondo 
  es manejado por .auth-container en auth.css
*/
</style>
