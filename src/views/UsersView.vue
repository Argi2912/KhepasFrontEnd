<template>
   <div class="home">
    <h1>Usuarios</h1>
    <div class="actions">
      <div>
        <button @click="showModal = true" class="btn-action">Agregar Usuario</button>

        <div v-if="showModal" class="modal-backdrop" @click="cerrarSiFondo($event)">
          <div class="modal-contenido">

            <button class="modal-cerrar" @click="showModal = false">&times;</button>

            <h2>Registro de Nuevo Usuario</h2>

            <form @submit.prevent="registrarUsuario">
              <label for="nombre">Nombre:</label>
              <input type="text" id="nombre" v-model="nuevoUsuario.nombre" required>

              <label for="email">Email:</label>
              <input type="email" id="email" v-model="nuevoUsuario.email" required>

              <label for="Contraseña">contraseña:</label>
              <input type="password" id="contraseña" v-model="nuevoUsuario.contraseña" required>

              <label for="repetircontraseña">Repetir contraseña:</label>
              <input type="password" id="repetircontraseña" v-model="nuevoUsuario.repetircontraseña" required>

              <p v-if="!passwordsMatch" class="error-msg">
            ¡Las contraseñas no coinciden!
          </p>

          <button type="submit" class="btn-submit" :disabled="!passwordsMatch">
            Guardar Usuario
          </button>
            </form>
          </div>
        </div>
      </div>
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
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '../stores/userStore'
import { useAuthStore } from '../stores/authStore' // 👈 Importar authStore
import Swal from 'sweetalert2'
import Modal from '../components/Modal.vue'

const showModal = ref(false)
const userStore = useUserStore()
const authStore = useAuthStore() // 👈 Inicializar authStore
// 2. Estado para el formulario
const nuevoUsuario = ref({
  nombre: '',
  email: '',
  contraseña: '',
  repetircontraseña: '',
});
// 3. Propiedad computada para verificar si las contraseñas coinciden
const passwordsMatch = computed(() => {
  // Solo verifica si ambas contraseñas tienen contenido
  if (nuevoUsuario.value.contrasena && nuevoUsuario.value.repetirContrasena) {
    return nuevoUsuario.value.contrasena === nuevoUsuario.value.repetirContrasena;
  }
  // Permite enviar si están vacías, la validación 'required' del HTML se encarga de eso.
  // Sin embargo, si quieres que el botón esté deshabilitado hasta que haya algo:
  return nuevoUsuario.value.contrasena === nuevoUsuario.value.repetirContrasena; 
});


// 4. Función para registrar (Simulada)
const registrarUsuario = () => {
  if (!passwordsMatch.value) {
    alert("Error: Las contraseñas deben coincidir.");
    return;
  }

  // Aquí iría tu lógica real de API para enviar los datos al servidor.
  console.log('Datos de usuario listos para enviar:', {
    nombre: nuevoUsuario.value.nombre,
    email: nuevoUsuario.value.email,
    // ¡IMPORTANTE! NUNCA uses la contraseña del usuario en el console.log en producción.
    // Enviarías solo 'contrasena' (que debe ser encriptada) y no 'repetirContrasena'.
    contrasena: nuevoUsuario.value.contrasena, 
  });
  
  alert(`Usuario ${nuevoUsuario.value.nombre} registrado (simulado).`);

  // Resetear el formulario y cerrar el modal
  Object.keys(nuevoUsuario.value).forEach(key => nuevoUsuario.value[key] = '');
  showModal.value = false;
};

// 5. Función para cerrar el modal si se hace clic en el fondo oscuro
const cerrarSiFondo = (event) => {
  // Cierra solo si el clic fue en el fondo (.modal-backdrop)
  if (event.target.classList.contains('modal-backdrop')) {
    showModal.value = false;
  }
};
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

<style>
/* === Mensajes de error === */
.error-msg {
  color: #cc0000;
  font-size: 0.9em;
  margin-top: 5px;
  margin-bottom: 0;
  font-weight: bold;
}

/* === Fondo (Backdrop) === */
.modal-backdrop {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* === Contenido del Modal === */
.modal-contenido {
  background: rgb(8, 114, 156);
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 450px;
  position: relative;
  animation: fadeIn 0.3s ease-out;
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
  color: #ccc;
  transition: color 0.2s ease;
}
.modal-cerrar:hover {
  color: #fff;
}

/* === Formulario === */
.modal-contenido form label {
  display: block;
  margin-top: 15px;
  margin-bottom: 5px;
  font-weight: bold;
}
.modal-contenido form input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

/* === Botones === */
.btn-action,
.btn-submit {
  display: inline-block;
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 20px;
  transition: background-color 0.2s;
}

.btn-action:hover,
.btn-submit:hover {
  background-color: #0056b3;
}

/* === Ajustes de posición (flexible y centrado) === */
.btn-action {
  align-self: flex-end;
}

.btn-submit {
  align-self: center;
}

/* === Animación === */
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

/* === Fondo principal === */
.home {

  min-height: 100vh;
  width: 100%;
  background-size: cover;
  background-position: center;
  color: #fff;
  font-family: 'Poppins', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 60px 5%;
  box-sizing: border-box;
  overflow-x: hidden;
}

/* === Título === */
.home h1 {
  color: #00b4ff;
  font-weight: 600;
  font-size: 2rem;
  margin-bottom: 25px;
  text-shadow: 0 0 10px rgba(0, 180, 255, 0.5);
  text-align: center;
}

/* === Botón principal (Agregar Usuario) === */
.home > button {
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
  align-self: center; /* centrado adaptable */
}

.home > button:hover {
  background: linear-gradient(135deg, #0092e0, #0066cc);
  box-shadow: 0 6px 15px rgba(0, 180, 255, 0.6);
  transform: translateY(-2px);
}

/* === Contenedor de tabla === */


/* === Tabla === */
.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 12px 90px;
  text-align: center;
  font-size: 14px;
}

.table thead {
  background: linear-gradient(135deg, #00b4ff, #0077ff);
}

.table thead th {
  color: #fff;
  font-weight: 600;
  text-transform: uppercase;
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

/* === Botones dentro de tabla === */
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

/* === Modal (oscuro) === */
.modal-overlay {
  position: fixed;
  inset: 0;
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
  width: 90%;
  max-width: 500px;
  padding: 25px;
  color: #fff;
  animation: fadeInUp 0.4s ease;
}


.modal-content h2 {
  color: #00b4ff;
  text-align: center;
  margin-bottom: 15px;
}

/* === Botones del modal === */
.modal-content button {
  background: linear-gradient(135deg, #00b4ff, #0077ff);
  border: none;
  color: #fff;
  padding: 10px 20px;
  border-radius: 20px;
  font-weight: 600;
  margin: 10px auto;
  display: block;
  transition: all 0.3s ease;
  cursor: pointer;
}

.modal-content button:hover {
  background: linear-gradient(135deg, #0092e0, #0066cc);
  transform: translateY(-2px);
}

/* === Animación modal === */
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

/* === Responsivo === */
@media (max-width: 992px) {
  .home h1 {
    font-size: 1.8rem;
  }
  .container {
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .home {
    padding: 40px 5%;
  }

  .home h1 {
    font-size: 1.5rem;
    text-align: center;
  }

  .home > button {
    width: 80%;
    max-width: 300px;
  }

  .table th,
  .table td {
    padding: 10px 6px;
    font-size: 12px;
  }

  .modal-content {
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }
}

@media (max-width: 480px) {
  .modal-contenido {
    padding: 20px;
  }

  .home h1 {
    font-size: 1.3rem;
  }

  .table th,
  .table td {
    padding: 8px 4px;
    font-size: 11px;
  }

  .home > button {
    font-size: 14px;
    padding: 10px 20px;
  }
}


</style>
