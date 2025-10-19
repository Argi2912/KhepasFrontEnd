<template>
  <div class="home">
    <h1>Usuarios</h1>
    <div class="actions">
      <button @click="showModal = true" class="btn-add">Agregar Usuario</button>
      <button @click="authStore.handleLogout()" class="btn-logout" :disabled="authStore.loading">
        <span
          v-if="authStore.loading"
          class="spinner-border spinner-border-sm"
          role="status"
          aria-hidden="true"
        ></span>
        {{ authStore.loading ? 'Saliendo...' : 'Cerrar Sesión' }}
      </button>
    </div>

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
              <button @click="editUser(user.id)" class="btn-action edit">Editar</button>
              <button @click="deleteUser(user.id)" class="btn-action delete">Eliminar</button>
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
import { useAuthStore } from '../stores/authStore' // 👈 Importar authStore
import Swal from 'sweetalert2'
import Modal from '../components/Modal.vue'

const showModal = ref(false)
const userStore = useUserStore()
const authStore = useAuthStore() // 👈 Inicializar authStore

const fetchData = () => {
  userStore.fetchUsers()
}

const confirmAction = () => {
  showModal.value = false
}

// Puedes definir editUser y deleteUser para evitar errores de consola
const editUser = (id) => {
  console.log(`Editando usuario con ID: ${id}`)
}

const deleteUser = (id) => {
  console.log(`Eliminando usuario con ID: ${id}`)
}

onMounted(() => {
  fetchData()
})

// showWelcomeAlert ya no es necesario aquí, la usa LoginView.vue
</script>

<style scoped>
/* Estilos básicos para los nuevos botones para que se vean bien */
.home {
  padding: 20px;
}

h1 {
  color: #00bfff;
  text-align: center;
  margin-bottom: 30px;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.btn-add,
.btn-logout,
.btn-action {
  padding: 10px 15px;
  border-radius: 5px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-add {
  background-color: #00aaff;
  color: white;
}

.btn-add:hover {
  background-color: #0088cc;
}

.btn-logout {
  background-color: #dc3545; /* Color rojo para salir */
  color: white;
}

.btn-logout:hover {
  background-color: #c82333;
}

.btn-action {
  margin-right: 5px;
  padding: 8px 12px;
}

.edit {
  background-color: #ffc107;
  color: #212529;
}
.delete {
  background-color: #dc3545;
  color: white;
}

.responsive {
  width: 100%;
}
</style>
