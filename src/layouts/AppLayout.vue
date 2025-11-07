<script setup>
import Sidebar from '@/components/layout/Sidebar.vue'
import Navbar from '@/components/layout/Navbar.vue'
import { ref } from 'vue'

const isSidebarOpen = ref(true) // Estado inicial abierto
</script>

<template>
  <div class="app-layout">
    <Sidebar :is-open="isSidebarOpen" />

    <main :class="['main-content', { 'sidebar-closed': !isSidebarOpen }]">
      <Navbar @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />

      <div class="page-wrapper">
        <router-view v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--color-background);
}

.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  transition:
    margin-left 0.3s ease,
    padding-left 0.3s ease;

  /* Usa padding-left en lugar de margin-left para que la barra superior
     ocupe todo el ancho derecho, incluso con el sidebar cerrado. */
  padding-left: 280px; /* Ancho por defecto del sidebar abierto */
}

/* Estilo dinámico cuando el sidebar está cerrado */
.sidebar-closed {
  padding-left: 80px; /* Ancho del sidebar colapsado */
}

.page-wrapper {
  padding: 25px;
  flex-grow: 1;
}

/* --- RESPONSIVE --- */
@media (max-width: 992px) {
  .main-content {
    padding-left: 80px;
  }
}
</style>
