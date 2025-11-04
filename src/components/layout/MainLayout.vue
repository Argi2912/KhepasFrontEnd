<template>
  <div class="app-layout-wrapper" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
    <AppSidebar :is-collapsed="isSidebarCollapsed" />

    <div class="app-content-wrapper">
      <AppNavbar @toggle-sidebar="toggleSidebar" />

      <main class="app-main-content">
        <router-view />
      </main>

      <AppFooter />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppNavbar from './AppNavbar.vue'
import AppSidebar from './AppSidebar.vue'
import AppFooter from './AppFooter.vue'

// Estado para controlar el sidebar
const isSidebarCollapsed = ref(false)

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}
</script>

<style scoped>
/* No se necesitan estilos aquí. 
  Todo se maneja en el layout.css global
  para mantener este componente limpio.
*/
</style>
