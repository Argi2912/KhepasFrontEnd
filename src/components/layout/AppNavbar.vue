<template>
  <nav class="app-navbar">
    <button class="sidebar-toggle-btn" @click="emit('toggle-sidebar')">☰</button>

    <div class="user-menu">
      <button class="user-menu-trigger" @click="isUserMenuOpen = !isUserMenuOpen">
        <img src="https://via.placeholder.com/32" alt="Avatar" />
        <div class="user-info">
          <span class="name">{{ authStore.fullName }}</span>
          <span class="role">{{ authStore.primaryRole }}</span>
        </div>
      </button>

      <div v-if="isUserMenuOpen" class="user-menu-dropdown" @mouseleave="isUserMenuOpen = false">
        <router-link to="/profile">Editar Perfil</router-link>
        <button @click="logoutAndCloseMenu">Cerrar Sesión</button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, defineEmits } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const emit = defineEmits(['toggle-sidebar'])
const authStore = useAuthStore()

const isUserMenuOpen = ref(false)

const logoutAndCloseMenu = () => {
  isUserMenuOpen.value = false
  authStore.handleLogout()
}
</script>

<style scoped>
/* Estilos aplicados desde layout.css.
  Este <style scoped> se mantiene vacío por limpieza.
*/
</style>
