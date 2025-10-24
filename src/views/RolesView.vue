<template>
  <div class="usuarios-container">
    <!-- 🔹 Encabezado: título + botón -->
    <div class="header-roles">
      <h2 class="title">Gestión de Roles</h2>
      <button class="btn-agregar" @click="abrirModal()">Agregar Rol</button>
    </div>

    <!-- 🟦 Tabla principal -->
    <div class="tabla-container">
      <table class="tabla-usuarios">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="role in rolesStore.roles" :key="role.id">
            <td>{{ role.id }}</td>
            <td>{{ role.name }}</td>
            <td>
              <button class="btn-accion editar" @click="abrirModal(role)">Editar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 🟩 Modal único (crear / editar rol + permisos) -->
    <div v-if="mostrarModal" class="overlay" @click.self="cerrarModal">
      <div class="modal-contenido neon-card">
        <div class="modal-header">
          <h3>{{ modoEdicion ? 'Editar Rol' : 'Crear Nuevo Rol' }}</h3>
          <button class="btn-cerrar" @click="cerrarModal">×</button>
        </div>

        <div class="modal-body">
          <!-- Nombre del rol -->
          <label class="form-label">Nombre del Rol:</label>
          <input
            v-model="rolActual.name"
            type="text"
            class="input-rol"
            placeholder="Ej: admin, user, analyst..."
          />

          <!-- Permisos -->
          <h5 class="mt-3">Permisos del Rol</h5>
          <div class="permisos-grid">
            <div
              v-for="permission in rolesStore.permissions"
              :key="permission.id"
              class="form-check"
            >
              <input
                class="form-check-input"
                type="checkbox"
                :id="permission.id"
                :value="permission.name"
                v-model="rolActual.permissions"
              />
              <label class="form-check-label" :for="permission.id">
                {{ permission.name }}
              </label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-guardar" @click="guardarRol">
            {{ modoEdicion ? 'Actualizar Rol' : 'Guardar Rol' }}
          </button>
          <button class="btn-cancelar" @click="cerrarModal">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRolesStore } from '../stores/rolesStore'

const rolesStore = useRolesStore()

onMounted(() => {
  rolesStore.fetchRoles()
  rolesStore.fetchPermissions()
})

const mostrarModal = ref(false)
const modoEdicion = ref(false)

const rolActual = ref({
  id: null,
  name: '',
  permissions: []
})

const abrirModal = (role = null) => {
  modoEdicion.value = !!role
  rolActual.value = role
    ? {
        id: role.id,
        name: role.name,
        permissions: role.permissions?.map(p => p.name) || []
      }
    : { id: null, name: '', permissions: [] }
  mostrarModal.value = true
}

const cerrarModal = () => {
  mostrarModal.value = false
  rolActual.value = { id: null, name: '', permissions: [] }
}

const guardarRol = async () => {
  try {
    if (!rolActual.value.name) {
      alert('⚠️ Debes ingresar un nombre para el rol.')
      return
    }

    if (modoEdicion.value) {
      await rolesStore.updateRole(rolActual.value.id, {
        name: rolActual.value.name,
        permissions: rolActual.value.permissions
      })

      const idx = rolesStore.roles.findIndex(r => r.id === rolActual.value.id)
      if (idx !== -1) {
        rolesStore.roles[idx].name = rolActual.value.name
        rolesStore.roles[idx].permissions = rolActual.value.permissions.map(p => ({ name: p }))
      }

      alert('✅ Rol actualizado correctamente')
    } else {
      const nuevoRol = await rolesStore.addRole({
        name: rolActual.value.name,
        permissions: rolActual.value.permissions
      })
      rolesStore.roles.push({
        ...nuevoRol,
        permissions: rolActual.value.permissions.map(p => ({ name: p }))
      })
      alert('✅ Rol creado correctamente')
    }

    cerrarModal()
  } catch (error) {
    console.error('❌ Error al guardar rol:', error)
    alert('Error al guardar el rol')
  }
}
</script>

<style scoped>
/* ======== CONTENEDOR GENERAL ======== */
.usuarios-container {
  padding: 30px;
  background: linear-gradient(180deg, #1b263b, #4c98e9);
  min-height: 100vh;
  color: #ffffff;
}

/* ======== CABECERA ======== */
.header-roles {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.title {
  color: #00bfff;
  text-shadow: 0 0 10px #0096ff;
  font-size: 1.8rem;
  margin: 0;
}

/* ======== TABLA ======== */
.tabla-container {
  overflow-x: auto;
}

.tabla-usuarios {
  width: 100%;
  border-collapse: collapse;
  background-color: #000814;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 150, 255, 0.3);
}

.tabla-usuarios th,
.tabla-usuarios td {
  padding: 12px;
  text-align: center;
  border-bottom: 1px solid #1e2a3a;
}

.tabla-usuarios th {
  background-color: #0096ff;
  color: #ffffff;
  text-shadow: 0 0 5px #00bfff;
}

.tabla-usuarios tr:hover {
  background-color: #001d3d;
}

/* ======== BOTONES ======== */
.btn-agregar {
  background: #0096ff;
  color: #ffffff;
  border: none;
  border-radius: 25px;
  padding: 10px 25px;
  cursor: pointer;
  box-shadow: 0 0 15px rgba(0, 150, 255, 0.6);
  transition: all 0.3s ease;
}
.btn-agregar:hover {
  background: #00bfff;
  box-shadow: 0 0 25px rgba(0, 150, 255, 1);
}

.btn-accion {
  border: 1px solid #0096ff;
  border-radius: 20px;
  padding: 8px 16px;
  cursor: pointer;
  color: #0096ff;
  font-weight: 500;
  background-color: transparent;
  transition: all 0.3s ease;
}
.btn-accion:hover {
  background-color: #0096ff;
  color: white;
}

/* ======== MODAL ======== */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(10, 17, 32, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
  padding: 30px;
}

.modal-contenido {
  background-color: #0d1b2a;
  border: 2px solid #0096ff;
  border-radius: 20px;
  padding: 30px 40px;
  width: 85%;
  max-width: 1100px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 0 40px rgba(0, 150, 255, 0.7);
  animation: aparecer 0.3s ease;
  color: #ffffff;
}

/* ======== HEADER MODAL ======== */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0, 150, 255, 0.3);
  margin-bottom: 15px;
}

/* ======== INPUTS ======== */
.input-rol {
  width: 100%;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid #0096ff;
  background: #001d3d;
  color: #ffffff;
}

/* ======== GRID DE PERMISOS ORDENADO ======== */
.permisos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px 25px;
  margin-top: 15px;
}

.form-check {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ======== FOOTER ======== */
.modal-footer {
  display: flex;
  justify-content: end;
  gap: 10px;
  margin-top: 25px;
}

.btn-guardar {
  background-color: #0096ff;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 10px 20px;
  cursor: pointer;
  box-shadow: 0 0 10px #0096ff;
}
.btn-guardar:hover {
  background-color: #00bfff;
  box-shadow: 0 0 20px #0096ff;
}

.btn-cancelar {
  background: transparent;
  color: #ccc;
  border-radius: 25px;
  padding: 10px 20px;
  border: 1px solid #0096ff;
}
.btn-cancelar:hover {
  background: #001d3d;
}

/* ======== ANIMACIÓN ======== */
@keyframes aparecer {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
