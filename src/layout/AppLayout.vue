<template>
  <div class="app-layout" :class="{ 'sidebar-is-open': sidebarOpen }">
    <AppHeader @toggle-sidebar="toggleSidebar" />
    <AppSidebar v-model="sidebarOpen" />
    <main class="app-main container-fluid">
      <router-view />
    </main>
    <AppFooter />
  </div>

  <div v-if="sidebarOpen" class="backdrop d-lg-none" @click="sidebarOpen = false" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import AppFooter from './AppFooter.vue'

// Estado por defecto: abierto
const sidebarOpen = ref(true)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

onMounted(() => {
  // Empezar cerrado por defecto en pantallas pequeñas
  if (window.matchMedia('(max-width: 991.98px)').matches) {
    sidebarOpen.value = false
  }
})
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
}
.app-main {
  padding-top: 56px;
  padding-bottom: 50px;
}

.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1025;
}
</style>
