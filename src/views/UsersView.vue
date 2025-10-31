<template>
  <div class="home">
    <h1>Usuarios</h1>

    <div class="actions">
      <button @click="abrirModalNuevo" class="btn-action">Agregar Usuario</button>

      <!-- Modal principal -->
      <div v-if="showModal" class="modal-backdrop" @click="cerrarSiFondo($event)">
        <div class="modal-contenido">
          <button class="modal-cerrar" @click="cerrarModal">&times;</button>

          <h2>{{ editMode ? 'Editar Usuario' : 'Registro de Nuevo Usuario' }}</h2>

          <form @submit.prevent="registrarUsuario">
            <label for="name">Nombre:</label>
            <input type="text" id="name" v-model="nuevoUsuario.name" required />

            <label for="email">Email:</label>
            <input type="email" id="email" v-model="nuevoUsuario.email" required />

            <label for="password">Contraseña:</label>
            <input type="password" id="password" v-model="nuevoUsuario.password" required />

            <label for="repeatPassword">Repetir contraseña:</label>
            <input
              type="password"
              id="repeatPassword"
              v-model="nuevoUsuario.repeatPassword"
              required
            />

            <p v-if="!passwordsMatch" class="error-msg">¡Las contraseñas no coinciden!</p>

            <button type="submit" class="btn-submit" :disabled="!passwordsMatch">
              {{ editMode ? 'Actualizar Usuario' : 'Guardar Usuario' }}
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- Tabla de usuarios -->
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/userStore'
import Swal from 'sweetalert2'

const userStore = useUserStore()
const showModal = ref(false)
const editMode = ref(false)
const usuarioEditandoId = ref(null)

const nuevoUsuario = ref({
  name: '',
  email: '',
  password: '',
  repeatPassword: '',
})

const passwordsMatch = computed(() => {
  return nuevoUsuario.value.password === nuevoUsuario.value.repeatPassword
})

const abrirModalNuevo = () => {
  editMode.value = false
  usuarioEditandoId.value = null
  nuevoUsuario.value = { name: '', email: '', password: '', repeatPassword: '' }
  showModal.value = true
}

const cerrarModal = () => {
  showModal.value = false
  editMode.value = false
}

const cerrarSiFondo = (event) => {
  if (event.target.classList.contains('modal-backdrop')) {
    cerrarModal()
  }
}

const registrarUsuario = async () => {
  if (!passwordsMatch.value) {
    Swal.fire('Error', 'Las contraseñas no coinciden.', 'error')
    return
  }

  try {
    if (editMode.value) {
      await userStore.updateUser(usuarioEditandoId.value, nuevoUsuario.value)
      Swal.fire('Actualizado', 'Usuario actualizado correctamente.', 'success')
    } else {
      await userStore.addUser(nuevoUsuario.value)
      Swal.fire('Guardado', 'Usuario agregado correctamente.', 'success')
    }

    cerrarModal()
    userStore.fetchUsers()
  } catch (error) {
    Swal.fire('Error', 'Ocurrió un problema al guardar el usuario.', 'error')
  }
}

const editUser = (id) => {
  const user = userStore.users.data.find((u) => u.id === id)
  if (user) {
    nuevoUsuario.value = {
      name: user.name,
      email: user.email,
      password: '',
      repeatPassword: '',
    }
    usuarioEditandoId.value = id
    editMode.value = true
    showModal.value = true
  }
}

const deleteUser = async (id) => {
  const confirm = await Swal.fire({
    title: '¿Eliminar usuario?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
  })

  if (confirm.isConfirmed) {
    try {
      await userStore.deleteUser(id)
      Swal.fire('Eliminado', 'El usuario fue eliminado correctamente', 'success')
      userStore.fetchUsers()
    } catch (error) {
      Swal.fire('Error', 'No se pudo eliminar el usuario', 'error')
    }
  }
}

onMounted(() => {
  userStore.fetchUsers()
})
</script>

<style scoped>
/* === Fondo principal === */
.actions {
    /* Ocupa todo el ancho */
    width: 90%; 
    margin-left: auto;
    margin-right: auto;
    padding-top: 20px; /* Espacio superior para separar del título si es necesario */
}

/* Aplicamos Flexbox al contenedor interno para empujar el contenido a la derecha */
.actions > div {
    display: flex; /* Habilitar Flexbox */
    justify-content: flex-end; /* Alinea los elementos (el botón) al final del contenedor (derecha) */
    width: 100%; /* Asegura que el contenedor interno use el 100% del espacio de .actions */
}

/* === Título === */
.home h1 {
  color: #00bfff;
  font-weight: 600;
  font-size: 2rem;
  margin-bottom: 25px;
  text-shadow: 0 0 15px rgba(0, 180, 255, 0.6);
  text-align: center;
  letter-spacing: 1px;
}

/* === Tabla === */
.table {
  
  margin-left: auto;
  margin-right: auto;
  width: 90%;
  justify-content: center;
  justify-self: auto;
  justify-items: auto;
  border-collapse: collapse;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(0, 13, 40, 0.7);
  box-shadow: 0 0 25px rgba(0, 150, 255, 0.2);
  backdrop-filter: blur(6px);
  
}

.table thead {
  background: linear-gradient(135deg, #0096ff, #00bfff);
}

.table thead th {
  color: #fff;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 14px;
}

.table tbody tr {
  background: rgba(10, 25, 50, 0.6);
  transition: all 0.3s ease;
}

.table tbody tr:nth-child(even) {
  background: rgba(0, 30, 60, 0.6);
}

.table tbody tr:hover {
  background: rgba(0, 150, 255, 0.15);
  transform: scale(1.005);
}

.table td {
  text-align: center;
  padding: 14px;
  color: #e0e0e0;
  border-bottom: 1px solid rgba(0, 150, 255, 0.1);
}

/* === Botones dentro de la tabla === */
.table button {
  background: transparent;
  border: 1px solid #00bfff;
  color: #00bfff;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  margin: 0 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.table button:hover {
  background: #00bfff;
  color: #001d3d;
  box-shadow: 0 0 15px rgba(0, 180, 255, 0.8);
}

/* === Botones globales === */
.btn-action,
.btn-submit {
  
  
  background-color: #0096ff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  margin-top: 20px;
  font-weight: 500;
  letter-spacing: 0.5px;
  box-shadow: 0 0 15px rgba(0, 150, 255, 0.5);
  transition: all 0.3s ease;
}

.btn-action:hover,
.btn-submit:hover {
  background-color: #00bfff;
  box-shadow: 0 0 25px rgba(0, 150, 255, 1);
}

/* === Modal (Backdrop) === */
.modal-backdrop {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  background: rgba(5, 10, 25, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

/* === Contenido del Modal === */
.modal-contenido {
  margin-left: auto;
  margin-right: auto;
  background: #0d1b2a;
  border: 2px solid #0096ff;
  border-radius: 20px;
  padding: 35px 40px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 0 30px rgba(0, 150, 255, 0.5);
  animation: fadeIn 0.3s ease-out;
  color: #fff;
}

/* === Botón de cerrar === */
.modal-cerrar {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 24px;
  font-weight: bold;
  background: none;
  border: none;
  cursor: pointer;
  color: #00bfff;
  transition: all 0.2s ease;
}
.modal-cerrar:hover {
  color: #fff;
  text-shadow: 0 0 10px #00bfff;
}

/* === Formulario === */
.modal-contenido form label {
  display: block;
  margin-top: 15px;
  margin-bottom: 6px;
  font-weight: 500;
  color: #00bfff;
  text-shadow: 0 0 5px rgba(0, 150, 255, 0.4);
}
.modal-contenido form input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #0096ff;
  border-radius: 12px;
  background: #001d3d;
  color: #ffffff;
  box-sizing: border-box;
  outline: none;
  transition: all 0.3s ease;
}

.modal-contenido form input:focus {
  box-shadow: 0 0 10px rgba(0, 150, 255, 0.8);
  border-color: #00bfff;
}

/* === Mensajes de error === */
.error-msg {
  color: #ff4d4d;
  font-size: 0.9em;
  margin-top: 5px;
  margin-bottom: 0;
  font-weight: bold;
  text-shadow: 0 0 8px rgba(255, 77, 77, 0.4);
}

/* === Animación === */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
