<template>
  <div class="usuarios-container">
    <h2 class="title">Gestión de Usuarios</h2>

    <!-- Botón para agregar usuario -->
    <button class="btn-agregar" @click="abrirModal()">Agregar Usuario</button>

    <!-- Tabla de usuarios -->
    <div class="tabla-container">
      <table class="tabla-usuarios">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in usuarios" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.role }}</td>
            <td>
              <button class="btn-accion editar" @click="abrirModal(user)">Editar</button>
              <button class="btn-accion permisos" @click="abrirPermisos(user)">Permisos / Roles</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL principal -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-card">
        <h3>{{ usuarioSeleccionado ? 'Editar Usuario' : 'Agregar Usuario' }}</h3>

        <label>Nombre</label>
        <input v-model="form.nombre" placeholder="Nombre del usuario" />

        <label>Correo</label>
        <input v-model="form.email" placeholder="Correo electrónico" />

        <label>Rol</label>
        <select v-model="form.role">
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="analyst">Analyst</option>
        </select>

        <div class="modal-buttons">
          <button class="btn-guardar" @click="guardarUsuario">Guardar</button>
          <button class="btn-cancelar" @click="cerrarModal">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- SUBMODAL de permisos -->
    <div v-if="showPermisos" class="modal-overlay">
      <div class="modal-card">
        <h3>Gestión de Permisos y Roles</h3>

        <h4>Permisos:</h4>
        <div class="checkbox-group">
          <label><input type="checkbox" v-model="permisos.ver" /> Ver</label>
          <label><input type="checkbox" v-model="permisos.crear" /> Crear</label>
          <label><input type="checkbox" v-model="permisos.editar" /> Editar</label>
          <label><input type="checkbox" v-model="permisos.eliminar" /> Eliminar</label>
        </div>

        <h4>Asignar Rol:</h4>
        <select v-model="rolSeleccionado">
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="analyst">Analyst</option>
        </select>

        <div class="modal-buttons">
          <button class="btn-guardar" @click="guardarPermisos">Guardar</button>
          <button class="btn-cancelar" @click="cerrarPermisos">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref } from 'vue'

// Datos simulados
const usuarios = ref([
  { id: 1, name: 'Juan Pérez', email: 'juan@example.com', role: 'admin' },
  { id: 2, name: 'María Gómez', email: 'maria@example.com', role: 'user' }
])

// Modales
const showModal = ref(false)
const showPermisos = ref(false)
const usuarioSeleccionado = ref(null)

// Formularios
const form = ref({ nombre: '', email: '', role: 'user' })
const permisos = ref({ ver: false, crear: false, editar: false, eliminar: false })
const rolSeleccionado = ref('user')

// Métodos
function abrirModal(user = null) {
  usuarioSeleccionado.value = user
  if (user) {
    form.value = { nombre: user.name, email: user.email, role: user.role }
  } else {
    form.value = { nombre: '', email: '', role: 'user' }
  }
  showModal.value = true
}

function cerrarModal() {
  showModal.value = false
}

function guardarUsuario() {
  if (usuarioSeleccionado.value) {
    usuarioSeleccionado.value.name = form.value.nombre
    usuarioSeleccionado.value.email = form.value.email
    usuarioSeleccionado.value.role = form.value.role
  } else {
    usuarios.value.push({
      id: usuarios.value.length + 1,
      name: form.value.nombre,
      email: form.value.email,
      role: form.value.role
    })
  }
  cerrarModal()
}

function abrirPermisos(user) {
  usuarioSeleccionado.value = user
  showPermisos.value = true
}

function cerrarPermisos() {
  showPermisos.value = false
}

function guardarPermisos() {
  alert(`Permisos actualizados para ${usuarioSeleccionado.value.name}`)
  cerrarPermisos()
}

</script>

<style scoped>
/* ======= Estilo LED Azul ======= */
.neon-card {
  border: 1px solid #00aaff;
  box-shadow: 0 0 20px rgba(0, 170, 255, 0.7), inset 0 0 15px rgba(0, 170, 255, 0.4);
  border-radius: 20px;
  transition: all 0.3s ease;
  background-color: #0a1120;
  color: #e0e0e0;
}
.neon-card:hover {
  box-shadow: 0 0 40px rgba(0, 170, 255, 0.9), inset 0 0 25px rgba(0, 170, 255, 0.5);
}

.table-dark {
  background-color: #101a2a;
  color: #e0e0e0;
  border-radius: 10px;
}

/* ======= Buscador ======= */
.search-box {
  display: flex;
  justify-content: center;
}
.search-input {
  width: 60%;
  border-radius: 30px;
  border: 1px solid #00aaff;
  background-color: #0f172a;
  color: #fff;
  padding: 12px 18px;
  box-shadow: 0 0 10px rgba(0, 170, 255, 0.4);
  transition: all 0.3s ease;
}
.search-input:focus {
  box-shadow: 0 0 20px rgba(0, 170, 255, 0.8);
  border-color: #00cfff;
  outline: none;
}

/* ======= Paginación LED ======= */
.pagination-led {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
}
.page-info {
  color: #00aaff;
  font-weight: 600;
}
.btn-outline-info {
  border-radius: 20px;
  border: 1px solid #00aaff;
  color: #00aaff;
  transition: all 0.3s;
}
.btn-outline-info:hover {
  background-color: #00aaff;
  color: #fff;
  box-shadow: 0 0 15px #00aaff;
}
.form-check-input:checked {
  background-color: #00aaff;
  border-color: #00aaff;
  box-shadow: 0 0 10px #00aaff;
}
</style>
