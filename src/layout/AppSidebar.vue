<template>
  <div class="sidebar" :class="{ open: modelValue }">
    <nav class="sidebar-nav">
      <ul>
        <li>
          <router-link to="/" class="sidebar-link">
            <i class="icon">🏠</i>
            <span>Home</span>
          </router-link>
        </li>
        <li>
          <router-link to="/users" class="sidebar-link">
            <i class="icon">👥</i>
            <span>Usuarios</span>
          </router-link>
        </li>
        <li>
          <router-link to="/form" class="sidebar-link">
            <i class="icon">📝</i>
            <span>Solicitudes</span>
          </router-link>
        </li>
        <li>
          <router-link to="/Roles" class="sidebar-link">
            <i class="icon">📝</i>
            <span>Roles y Permisos</span>
          </router-link>
        </li>
          <li>
          <router-link to="/Request" class="sidebar-link">
            <i class="icon">📨</i>
            <span>Tipo de Solicitud</span>
          </router-link>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: 280px;
  z-index: 1030;
  transform: translateX(-100%);
  transition: transform 0.3s ease-in-out;

  /* --- NUEVO TEMA (del wizard-card) --- */
  background-color: #0f172a;
  border-right: 1px solid rgba(0, 180, 255, 0.22);
  box-shadow: 0 0 20px rgba(0, 150, 255, 0.12);
}

.sidebar.open {
  transform: translateX(0);
}

.sidebar-nav {
  padding-top: 70px; /* 56px (header) + 14px (margen) */
}

.sidebar-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-link {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  text-decoration: none;

  /* Texto tenue (como el label del form) */
  color: #cdd6f4;
  transition: all 0.2s ease;

  /* Borde para el estado activo (inicialmente transparente) */
  border-left: 3px solid transparent;
}

.sidebar-link .icon {
  font-style: normal;
  font-size: 1.1rem;
  margin-right: 15px;
  min-width: 20px;
  text-align: center;
}

/* Hover: Texto más blanco y fondo sutil */
.sidebar-link:hover {
  color: #fff;
  /* Fondo de hover (azul cian transparente) */
  background-color: rgba(0, 180, 255, 0.1);
}

/* Estado Activo: Usa el color de acento */
.sidebar-link.router-link-exact-active {
  color: #00bfff;
  font-weight: bold;
  background-color: rgba(0, 180, 255, 0.1);

  /* Borde lateral resaltado */
  border-left: 3px solid #00bfff;

  /* Compensar el padding para que el texto se alinee */
  padding-left: 17px;
}
</style>
