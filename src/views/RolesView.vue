<template>
  <div class="permissions-container">
    <h2>Administración de Roles y Permisos</h2>
    
    <div class="table-wrapper">
      <table class="permissions-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Permisos de Acceso</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            
            <td>
              <select v-model="user.role" @change="updateRole(user)">
                <option v-for="role in availableRoles" :key="role" :value="role">
                  {{ role }}
                </option>
              </select>
            </td>
            
            <td>
              <div class="permissions-list">
                <label v-for="perm in availablePermissions" :key="perm" class="permission-checkbox">
                  <input 
                    type="checkbox" 
                    :checked="user.permissions.includes(perm)"
                    @change="togglePermission(user, perm)"
                  >
                  {{ perm }}
                </label>
              </div>
            </td>

            <td>
              <button @click="saveChanges(user)" class="btn-save">
                Guardar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useUserStore } from '../stores/userStore'
import { useAuthStore } from '../stores/authStore' // 👈 Importar authStore
import Swal from 'sweetalert2'
import Modal from '../components/Modal.vue'

// --- 1. Datos Fijos (Roles y Permisos Disponibles) ---
const availableRoles = ['Administrador', 'Editor', 'Lector', 'Invitado'];
const availablePermissions = ['Crear', 'Leer', 'Actualizar', 'Eliminar'];

// --- 2. Datos de Usuario (Simulación de Datos de una API) ---
const users = ref([
  { id: 1, name: 'Ana Rodríguez', email: 'ana@example.com', role: 'Administrador', permissions: ['Crear', 'Leer', 'Actualizar', 'Eliminar'] },
  { id: 2, name: 'Luis Gómez', email: 'luis@example.com', role: 'Editor', permissions: ['Crear', 'Leer', 'Actualizar'] },
  { id: 3, name: 'Marta Pérez', email: 'marta@example.com', role: 'Lector', permissions: ['Leer'] },
]);

// --- 3. Lógica de Modificación de Permisos y Roles ---

// Actualiza la lista de permisos cuando se cambia el rol (opcional, pero útil)
const updateRole = (user) => {
  // Lógica para asignar permisos por defecto al cambiar el rol
  if (user.role === 'Administrador') {
    user.permissions = [...availablePermissions]; // Todos
  } else if (user.role === 'Editor') {
    user.permissions = ['Crear', 'Leer', 'Actualizar'];
  } else if (user.role === 'Lector' || user.role === 'Invitado') {
    user.permissions = ['Leer'];
  }
};

// Añade o quita un permiso de la lista del usuario
const togglePermission = (user, permission) => {
  const index = user.permissions.indexOf(permission);
  if (index > -1) {
    // Si el permiso existe, lo quita
    user.permissions.splice(index, 1);
  } else {
    // Si el permiso NO existe, lo añade
    user.permissions.push(permission);
  }
};

// Simula el guardado de los cambios en el servidor
const saveChanges = (user) => {
  // Aquí se haría una llamada a la API (Ej: fetch/axios)
  // con los datos actualizados de 'user.role' y 'user.permissions'.
  console.log(`Guardando cambios para ${user.name}:`, {
    role: user.role,
    permissions: user.permissions
  });
  alert(`Permisos y rol de ${user.name} actualizados!`);
  
  // Lógica para manejar la respuesta del servidor (éxito/error)
};
</script>

---
<style>
/* VARIABLES (Opcional, pero muy recomendado en CSS moderno) */
:root {
 --color-fondo-principal: #162447; /* Azul marino profundo */
 --color-barra-superior: #0f1623; /* Azul muy oscuro/casi negro */
 --color-texto-principal: #ffffff; /* Blanco */
 --color-encabezado-tabla: #007bff; /* Azul brillante (similar al botón "Agregar Usuario") */
 --color-accion-editar: #28a745; /* Verde estándar para 'Editar' (sugerido ya que no se ve bien) */
 --color-accion-eliminar: #dc3545; /* Rojo estándar para 'Eliminar' (sugerido) */
 --base-font-size: 16px; /* Definición de un tamaño base para usar REM */
}

body {
 background-color: var(--color-fondo-principal);
 color: var(--color-texto-principal);
 font-family: 'Arial', sans-serif;
 overflow-y: auto;
 font-size: var(--base-font-size); /* Aplica el tamaño base */
}

.permissions-container {
 padding: 2.5rem 1.25rem; /* Usando rem */
 max-width: 1200px;
 margin: 0 auto;
 box-sizing: border-box;
}

h2 {
 color: var(--color-texto-principal);
 text-align: center;
 margin-bottom: 1.875rem; /* Usando rem */
 font-size: 2em;
}

/* --- Estilos de la Tabla (Desktop y Tablet) --- */
.table-wrapper {
 overflow-x: auto;
 border-radius: 8px;
 box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.permissions-table {
 width: 100%;
 border-collapse: collapse;
 min-width: 750px; 
 background-color: #0f1623;
}

.permissions-table thead tr {
 background-color: var(--color-encabezado-tabla);
 color: var(--color-texto-principal);
}

.permissions-table th, .permissions-table td {
 padding: 0.9375rem; /* 15px */
 text-align: left;
 border-bottom: 1px solid #283747;
 color: var(--color-texto-principal);
 font-size: 0.95em;
}

/* Estilo para los botones de la tabla */
.btn-save {
 background-color: var(--color-encabezado-tabla);
 color: var(--color-texto-principal);
 border: none;
 padding: 0.5rem 0.75rem; /* 8px 12px */
 border-radius: 4px;
 cursor: pointer;
 transition: background-color 0.2s;
}

.btn-save:hover {
 background-color: #0069d9;
}

/* Estilo para los inputs y selects dentro de la tabla */
.permissions-table select,
.permissions-table input[type="checkbox"] {
 background-color: #283747;
 color: var(--color-texto-principal);
 border: 1px solid #444;
 padding: 5px;
 border-radius: 4px;
}
.permissions-table select {
 padding: 8px;
 max-width: 100%;
}
.permissions-table option {
 background-color: #283747;
}

/* Estilo para la lista de permisos (checkboxes) */
.permissions-list {
 display: flex;
 flex-wrap: wrap;
 gap: 0.5rem; /* 8px */
}

.permission-checkbox {
 display: flex;
 align-items: center;
 font-size: 0.8125rem; /* 13px */
 cursor: pointer;
}

/* ======================================================= */
/* === RESPONSIVO PARA TABLETS Y PANTALLAS INTERMEDIAS === */
/* ======================================================= */
@media (max-width: 900px) {
    /* Reduce el tamaño de fuente general para pantallas más pequeñas */
    .permissions-table th, .permissions-table td {
        font-size: 0.9em;
        padding: 0.75rem 0.625rem; /* Reduce un poco el padding */
    }
    
    /* Asegura que los permisos no se vean muy apretados */
    .permissions-list {
        gap: 0.3rem; /* 5px */
    }
}


/* ======================================================= */
/* ====== RESPONSIVO PARA MÓVILES (Max-width: 600px) ====== */
/* ======================================================= */
@media (max-width: 600px) {
    
    .permissions-container {
        padding: 1.25rem 0.625rem; /* 20px 10px */
    }
    
    /* Reducir el padding de las celdas para comprimir la tabla */
    .permissions-table th, .permissions-table td {
        padding: 0.625rem 0.5rem; /* 10px 8px */
        font-size: 0.75rem; /* Texto de la tabla muy compacto */
    }
    
    /* El botón de guardar ocupa todo el ancho de la celda */
    .btn-save {
        width: 100%;
        padding: 0.625rem 0;
    }
    
    /* Ajusta el espaciado de los permisos */
    .permissions-list {
        flex-direction: column; /* Apila los permisos verticalmente (más fácil de tocar) */
        gap: 0.25rem; /* 4px */
    }
    
    .permissions-table select {
        padding: 0.3125rem; /* 5px */
    }
}
</style>