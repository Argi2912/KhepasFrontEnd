<script setup>
import Sidebar from '@/components/layout/Sidebar.vue'
import Navbar from '@/components/layout/Navbar.vue'
import { ref, onMounted, onUnmounted } from 'vue'

const isSidebarOpen = ref(true)
const isMobile = ref(false)

const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 768

  // En móvil iniciamos cerrado, en PC abierto
  if (isMobile.value) {
    isSidebarOpen.value = false
  } else {
    isSidebarOpen.value = true
  }
}

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})
</script>

<template>
  <div class="app-layout">
    <Sidebar :is-open="isSidebarOpen" @toggle-sidebar="toggleSidebar" />

    <main :class="['main-content', { 'sidebar-closed': !isSidebarOpen, 'is-mobile': isMobile }]">
      <Navbar @toggle-sidebar="toggleSidebar" />

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
  transition: padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding-left: 280px;
  /* PC Abierto */
  width: 100%;
  box-sizing: border-box;
}

.sidebar-closed {
  padding-left: 80px;
  /* PC Cerrado */
}

/* 2. CAMBIO: En móvil el contenido nunca tiene margen izquierdo */
.main-content.is-mobile {
  padding-left: 0 !important;
}

.page-wrapper {
  padding: 25px;
  flex-grow: 1;
  overflow-x: hidden;
}

@media (max-width: 768px) {
  .page-wrapper {
    padding: 15px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>