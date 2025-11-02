<template>
  <div class="min-h-screen flex items-center justify-center bg-dark-primary text-gray-100 py-10">
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
.bg-dark-primary {
  background-color: #1c2127;
}
</style>
