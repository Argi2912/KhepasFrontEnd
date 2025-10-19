<template>
  <div class="home">
    <h1>Usuarios</h1>
    <button @click="showModal = true">Agregar</button>
    

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

<style>
/* ===== Fondo que cubre toda la ventana ===== */
.home {
  min-height: 100vh;              /* Ocupa toda la altura visible */
  width: 60vw;                   /* Ocupa todo el ancho visible */
  background-size: cover;
  background-position: center;
  color: #fff;
  font-family: 'Poppins', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;    /* Empieza desde arriba, pero puedes poner center si quieres centrar todo */
  padding: 60px 40px;
  box-sizing: border-box;
  overflow-x: hidden;
}

/* ===== Título ===== */
.home h1 {
  color: #00b4ff;
  font-weight: 600;
  font-size: 2rem;
  margin-bottom: 25px;
  text-shadow: 0 0 10px rgba(0, 180, 255, 0.5);
}

/* ===== Botón principal (Agregar Usuario) ===== */
.home > button {
  margin-left: 550px;
  background: linear-gradient(135deg, #00b4ff, #0077ff);
  border: none;
  color: #fff;
  padding: 12px 26px;
  border-radius: 25px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 180, 255, 0.3);
  cursor: pointer;
  margin-bottom: 15px;
  
}

.home > button:hover {
  background: linear-gradient(135deg, #0092e0, #0066cc);
  box-shadow: 0 6px 15px rgba(0, 180, 255, 0.6);
  transform: translateY(-2px);
}

/* ===== Contenedor de la tabla ===== */
.container {
  background: rgba(20, 20, 30, 0.9);
  border: 1px solid rgba(0, 180, 255, 0.3);
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 0 25px rgba(0, 180, 255, 0.15);
  width: 90%;
  max-width: 1100px;
  overflow-x: auto;
}

/* ===== Tabla ===== */
.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 14px 16px;
  text-align: center;
}

.table thead {
  background: linear-gradient(135deg, #00b4ff, #0077ff);
}

.table thead th {
  color: #fff;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 14px;
  letter-spacing: 0.5px;
}

.table tbody tr {
  background: #11131a;
  transition: all 0.25s ease;
}

.table tbody tr:nth-child(even) {
  background: #161923;
}

.table tbody tr:hover {
  background: rgba(0, 180, 255, 0.15);
  transform: scale(1.01);
}

/* ===== Botones dentro de la tabla ===== */
.table button {
  background: transparent;
  border: 1px solid #00b4ff;
  color: #00b4ff;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  margin: 0 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.table button:hover {
  background: #00b4ff;
  color: #000;
  box-shadow: 0 0 10px rgba(0, 180, 255, 0.5);
}

/* ===== Modal ===== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  background: #0f0f17;
  border: 1px solid rgba(0, 180, 255, 0.3);
  border-radius: 12px;
  box-shadow: 0 0 30px rgba(0, 180, 255, 0.3);
  width: 500px;
  max-width: 90%;
  padding: 25px;
  color: #fff;
  animation: fadeInUp 0.4s ease;
}

.modal-content h2 {
  color: #00b4ff;
  text-align: center;
  margin-bottom: 15px;
}

/* ===== Botones del modal ===== */
.modal-content button {
  background: linear-gradient(135deg, #00b4ff, #0077ff);
  border: none;
  color: #fff;
  padding: 10px 20px;
  border-radius: 20px;
  font-weight: 600;
  margin: 10px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.modal-content button:hover {
  background: linear-gradient(135deg, #0092e0, #0066cc);
  transform: translateY(-2px);
}

/* ===== Animación modal ===== */
@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(40px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .table th,
  .table td {
    padding: 10px 8px;
    font-size: 13px;
  }

  .modal-content {
    width: 90%;
  }
}

</style>
