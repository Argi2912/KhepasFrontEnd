<template>
  <div class="home">
    <h1>Usuarios</h1>
    <button @click="fetchData" :disabled="userStore.loading">
      {{ userStore.loading ? 'Cargando...' : 'Cargar Usuarios' }}
    </button>

    <div v-if="userStore.error" class="alert alert-danger">Error: {{ userStore.error }}</div>

    <ul v-if="userStore.users.length">
      <li v-for="user in userStore.users" :key="user.id">{{ user.name }}</li>
    </ul>
  </div>
</template>

<script setup>
import { useUserStore } from '../stores/userStore'
import Swal from 'sweetalert2'

const userStore = useUserStore()

const fetchData = () => {
  userStore.fetchUsers()
}

const showWelcomeAlert = () => {
  Swal.fire('¡Bienvenido!', 'Has iniciado sesión exitosamente.', 'success')
}
</script>
