<script setup>
import { useAuthStore } from '@/stores/auth'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import notify from '@/services/notify'
import alert from '@/services/alert'

const authStore = useAuthStore()
const emit = defineEmits(['toggle-sidebar'])

// Usamos el nombre del rol principal para mostrar
const userRole = authStore.authUser?.roles[0]?.name || 'Usuario'

const confirmLogout = async () => {
  const confirmed = await alert.confirm(
    'Cerrar Sesión',
    '¿Estás seguro de que deseas cerrar tu sesión actual?',
  )

  if (confirmed) {
    // Llama a logout, que maneja la limpieza y redirección
    authStore.logout()
  }
}
</script>

<template>
  <header class="navbar">
    <button @click="emit('toggle-sidebar')" class="toggle-btn">
      <FontAwesomeIcon icon="fa-solid fa-bars" />
    </button>

    <span class="page-title">{{ $route.meta.label || 'Sistema Kephas' }}</span>

    <div class="user-profile">
      <div class="user-info">
        <span class="user-name">{{ authStore.authUser?.name || 'Cargando...' }}</span>
        <span class="user-role">{{ userRole.toUpperCase() }}</span>
      </div>

      <button @click="confirmLogout" class="logout-btn">
        <FontAwesomeIcon icon="fa-solid fa-right-from-bracket" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  height: 60px;
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 25px;
  position: sticky;
  top: 0;
  z-index: 999;
}

.toggle-btn {
  background: none;
  border: none;
  color: var(--color-text-light);
  font-size: 1.4rem;
  cursor: pointer;
  transition: color 0.2s;
  margin-right: 20px;
}

.toggle-btn:hover {
  color: var(--color-primary);
}

.page-title {
  flex-grow: 1;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--color-text-light);
  opacity: 0.9;
}

.user-profile {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: 15px;
}

.user-name {
  font-size: 0.95rem;
  font-weight: 600;
}

.user-role {
  font-size: 0.75rem;
  color: var(--color-primary);
  opacity: 0.8;
  margin-top: 2px;
}

.logout-btn {
  background-color: var(--color-secondary);
  border: 1px solid var(--color-border);
  color: var(--color-danger);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background-color: var(--color-danger);
  color: var(--color-text-light);
  border-color: var(--color-danger);
}
</style>
