<template>
  <nav class="app-header">
    <div class="nav-container">
      <div class="nav-left">
        <button class="sidebar-toggle-btn" type="button" @click="$emit('toggle-sidebar')">
          ☰
        </button>
        <a class="nav-brand" href="#">Khepas</a>
      </div>

      <div class="nav-icons">
        <button class="icon-btn" aria-label="Notificaciones">🔔</button>
        <button class="icon-btn" aria-label="Mensajes">✉️</button>
        <button class="icon-btn" aria-label="Perfil de usuario">👤</button>
        <button class="icon-btn" aria-label="Cerrar Sesion" @click="handleLogout()">🚪</button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '../stores/authStore'
defineEmits(['toggle-sidebar'])
const authStore = useAuthStore()
const handleLogout = () => {
  authStore.handleLogout()
}
</script>

<style scoped>
.app-header {
  /* Fondo principal del wizard-card */
  background-color: #0f172a;
  color: #cdd6f4; /* Texto tenue del wizard */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1040;
  min-height: 56px;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;

  /* Borde y sombra del wizard-card */
  border-bottom: 1px solid rgba(0, 180, 255, 0.22);
  box-shadow: 0 2px 15px rgba(0, 150, 255, 0.1);
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.nav-left {
  display: flex;
  align-items: center;
}

.sidebar-toggle-btn {
  background-color: transparent;
  /* Borde sutil, como el de los inputs */
  border: 1px solid #243241;
  color: #cdd6f4;
  padding: 0.25rem 0.6rem;
  font-size: 1.25rem;
  line-height: 1;
  border-radius: 0.25rem;
  cursor: pointer;
  margin-right: 0.5rem;
  transition: all 0.2s ease;
}
.sidebar-toggle-btn:hover {
  color: #fff;
  /* Color de acento al hacer hover */
  border-color: #00bfff;
}

.nav-brand {
  /* Color de acento (como el .form-header h2) */
  color: #00bfff;
  font-size: 1.25rem;
  text-decoration: none;
  white-space: nowrap;
  font-weight: 600;
  /* Efecto de 'drop-shadow' del logo */
  filter: drop-shadow(0 0 8px rgba(0, 200, 255, 0.6));
}

.nav-icons {
  display: flex;
  align-items: center;
}

.icon-btn {
  background-color: transparent;
  border: none;
  color: #cdd6f4;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  margin-left: 0.5rem;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  color: #00bfff; /* Color de acento */
  /* Fondo de hover sutil */
  background-color: rgba(0, 180, 255, 0.1);
}
</style>
