<template>
  <div class="authenticated-layout">
    <header class="navbar">
      <nav>
        <router-link to="/dashboard">Dashboard</router-link>
        <router-link to="/users">Usuarios</router-link>
        <button @click="logout">Cerrar Sesión</button>
      </nav>
    </header>
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const logout = () => {
  authStore.handleLogout()
  router.push('/login')
}
</script>

<style scoped>
.authenticated-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* Ocupar toda la altura de la ventana */
}
.navbar {
  background-color: #2c3e50;
  padding: 1rem;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.navbar nav a {
  color: white;
  margin-right: 15px;
  text-decoration: none;
}
.navbar nav a:hover {
  text-decoration: underline;
}
.content {
  flex-grow: 1; /* El contenido ocupará el espacio restante */
  padding: 20px;
}
</style>
