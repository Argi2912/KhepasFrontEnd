<template>
  <header
    class="bg-dark-secondary shadow-lg p-4 flex justify-between items-center z-10 sticky top-0"
  >
    <div class="text-xl font-bold text-accent-yellow">TUCONPAY</div>

    <div class="flex items-center space-x-4">
      <span class="text-gray-400 text-sm">Rol: {{ authStore.primaryRole }}</span>
      <span class="text-gray-200 font-medium">Bienvenido, {{ authStore.fullName }}</span>
      <button
        @click="authStore.handleLogout()"
        class="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
      >
        Salir
      </button>
    </div>
  </header>
</template>

<script>
import { useAuthStore } from '@/stores/authStore'

export default {
  name: 'AppNavbar',
  setup() {
    const authStore = useAuthStore()
    return {
      authStore,
    }
  },
}
</script>

<style scoped>
.bg-dark-secondary {
  background-color: #2b3139;
}
.text-accent-yellow {
  color: #f0b90b;
}
</style>
