<script setup>
import Sidebar from '@/components/layout/Sidebar.vue'
import Navbar from '@/components/layout/Navbar.vue'
import { ref, onMounted, watch } from 'vue'

const isSidebarOpen = ref(localStorage.getItem('sidebar_open') !== 'false')

watch(isSidebarOpen, (val) => {
  localStorage.setItem('sidebar_open', val.toString())
})
</script>

<template>
  <div class="app-layout">
    <Sidebar :is-open="isSidebarOpen" />

    <main :class="['main-content', { 'sidebar-closed': !isSidebarOpen }]">
      <Navbar @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />

      <div class="page-wrapper">
        <slot />
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
  transition: padding-left 0.3s ease;
  padding-left: 280px;
}

.sidebar-closed {
  padding-left: 0;
}

.page-wrapper {
  padding: 25px;
  flex-grow: 1;
}

/* --- RESPONSIVE --- */
@media (max-width: 992px) {
  .main-content {
    padding-left: 0;
  }
}
</style>