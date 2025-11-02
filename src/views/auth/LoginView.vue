<template>
  <div class="min-h-screen flex items-center justify-center bg-dark-primary text-gray-100">
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
.bg-dark-primary {
  background-color: #1c2127;
}
</style>
