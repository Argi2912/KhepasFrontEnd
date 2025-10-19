<template>
  <nav class="app-header">
    <div class="nav-container">
      <!-- Lado Izquierdo: Botón Sidebar y Marca -->
      <div class="nav-left">
        <button class="sidebar-toggle-btn" type="button" @click="$emit('toggle-sidebar')">
          ☰
        </button>
        <a class="nav-brand" href="#">Khepas</a>
      </div>

      <!-- Lado Derecho: Iconos de Usuario y Menú Desplegable -->
      <div class="nav-icons">
        <button class="icon-btn" aria-label="Notificaciones">🔔</button>
        <button class="icon-btn" aria-label="Mensajes">✉️</button>

        <!-- Contenedor del Menú de Perfil -->
        <div class="profile-menu-container">
          <!-- Botón que abre/cierra el menú -->
          <button class="icon-btn" aria-label="Perfil de usuario" @click.stop="toggleDropdown">
            👤
          </button>

          <!-- El Menú Desplegable (Dropdown) -->
          <transition name="fade-down">
            <div v-if="dropdownOpen" class="profile-dropdown">
              <ul>
                <li>
                  <a href="#">
                    <!-- Debería ser <RouterLink to="/profile"> -->
                    <span>⚙️</span> Editar Perfil
                  </a>
                </li>
                <li>
                  <button @click="logout"><span>🚪</span> Cerrar Sesión</button>
                </li>
              </ul>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/authStore' // Asegúrate que la ruta es correcta

// --- Lógica del Menú Desplegable ---

// 1. Estado para controlar la visibilidad del menú
const dropdownOpen = ref(false)
const authStore = useAuthStore()

// 2. Función para abrir/cerrar el menú
const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

// 3. Función para cerrar sesión
const logout = () => {
  dropdownOpen.value = false // Cierra el menú
  authStore.handleLogout()
}

// 4. Lógica para cerrar el menú al hacer clic fuera
const closeDropdownOnClickOutside = () => {
  if (dropdownOpen.value) {
    dropdownOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', closeDropdownOnClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', closeDropdownOnClickOutside)
})

// --- Fin de la Lógica del Menú ---

defineEmits(['toggle-sidebar'])
</script>

<style scoped>
/* --- Estilos base (sin cambios) --- */
.app-header {
  background-color: #0f172a;
  color: #cdd6f4;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1040;
  min-height: 56px;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
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
  border: 1px solid #243241;
  color: #cdd6f4;
  padding: 0.25rem 0.6rem;
  font-size: 1.25rem;
  border-radius: 0.25rem;
  cursor: pointer;
  margin-right: 0.5rem;
  transition: all 0.2s ease;
}
.sidebar-toggle-btn:hover {
  color: #fff;
  border-color: #00bfff;
}

.nav-brand {
  color: #00bfff;
  font-size: 1.25rem;
  text-decoration: none;
  font-weight: 600;
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
  color: #00bfff;
  background-color: rgba(0, 180, 255, 0.1);
}

/* --- NUEVOS ESTILOS PARA EL MENÚ DESPLEGABLE --- */

.profile-menu-container {
  position: relative; /* Clave para posicionar el dropdown */
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 10px); /* Debajo del botón con 10px de espacio */
  right: 0;
  width: 200px;
  background-color: #0f172a; /* Mismo fondo */
  border: 1px solid rgba(0, 180, 255, 0.22);
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 150, 255, 0.15);
  overflow: hidden;
  z-index: 1050; /* Encima de todo */
}

.profile-dropdown ul {
  list-style: none;
  padding: 8px 0;
  margin: 0;
}

.profile-dropdown li a,
.profile-dropdown li button {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 15px;
  text-decoration: none;
  color: #cdd6f4;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  text-align: left;
}

.profile-dropdown li a:hover,
.profile-dropdown li button:hover {
  color: #00bfff;
  background-color: rgba(0, 180, 255, 0.1);
}

.profile-dropdown li span {
  margin-right: 10px;
}

/* --- Transición para el menú --- */
.fade-down-enter-active,
.fade-down-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.fade-down-enter-from,
.fade-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
