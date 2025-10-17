<template>
  <div class="home">
    <h1>Usuarios</h1>
    <button @click="showModal = true">Agregar Usuario</button>

    <div class="container">
      <table class="responsive table table-striped">
        <thead>
          <tr>
            <th>Id</th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in userStore.users.data" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>
              <button @click="editUser(user.id)">Editar</button>
              <button @click="deleteUser(user.id)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Modal :isVisible="showModal" @close="showModal = false">
      <template #header>
        <h2>Agregar Usuario</h2>
      </template>
      <p>esto es una prueba</p>
      <template #footer>
        <button @click="confirmAction">Confirmar</button>
        <button @click="showModal = false">Cancelar</button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useUserStore } from '../stores/userStore'
import Swal from 'sweetalert2'
import Modal from '../components/Modal.vue'

const showModal = ref(false)
const userStore = useUserStore()

const fetchData = () => {
  userStore.fetchUsers()
  console.log(userStore.users)
}

const confirmAction = () => {
  showModal.value = false
}

onMounted(() => {
  fetchData()
})

const showWelcomeAlert = () => {
  Swal.fire('¡Bienvenido!', 'Has iniciado sesión exitosamente.', 'success')
}
</script>
