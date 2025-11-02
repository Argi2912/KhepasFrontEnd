<template>
  <div class="p-4">
    <h1 class="text-3xl font-bold mb-6 text-accent-green">Dashboard Principal</h1>

    <p class="text-gray-300 mb-4">
      Bienvenido {{ authStore.fullName }}. Acceso como {{ authStore.primaryRole }}.
    </p>

    <div class="bg-dark-secondary p-6 rounded-lg shadow-xl">
      <h2 class="text-xl font-semibold text-gray-200">Métricas de Balance</h2>
      <p class="mt-4 text-gray-400">
        [PENDIENTE: Integración con la API para mostrar Caja Total, CXC, CXP y Balance Neto]
      </p>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '@/stores/authStore'

export default {
  name: 'DashboardView',
  setup() {
    const authStore = useAuthStore()
    return { authStore }
  },
}
</script>

<style scoped>
.bg-dark-secondary {
  background-color: #2b3139;
}
.text-accent-green {
  color: #0ecb81;
}
</style>
