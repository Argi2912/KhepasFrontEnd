// src/components/layout/AppSidebar.vue

<template>
  <aside class="bg-dark-secondary w-64 space-y-6 py-7 px-2 sticky top-0 h-screen shadow-2xl">
    <div class="text-2xl font-extrabold text-accent-green text-center">Dashboard</div>

    <nav>
      <router-link
        v-for="item in navItems"
        :key="item.name"
        :to="{ name: item.routeName }"
        class="block py-2.5 px-4 rounded transition duration-200 text-gray-400 hover:bg-gray-700 hover:text-gray-100"
        :class="{
          'bg-accent-green text-dark-secondary font-semibold hover:!bg-opacity-80':
            $route.name === item.routeName,
        }"
      >
        {{ item.name }}
      </router-link>
    </nav>
  </aside>
</template>

<script>
import { reactive } from 'vue'

export default {
  name: 'AppSidebar',
  setup() {
    const navItems = reactive([
      { name: 'Inicio (Balance)', routeName: 'Dashboard' },
      { name: 'Transacciones / Solicitudes', routeName: 'Transactions' },
      { name: 'Bases de Datos (Usuarios)', routeName: 'Users' },
      { name: 'Caja y Plataformas', routeName: 'Cashes' },
      { name: 'Tasas de Cambio', routeName: 'ExchangeRates' },
      { name: 'Estadísticas / Reportes', routeName: 'Stats' },
    ])
    return { navItems }
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
.text-dark-secondary {
  color: #2b3139;
} /* Usado para el texto en el acento */
</style>
