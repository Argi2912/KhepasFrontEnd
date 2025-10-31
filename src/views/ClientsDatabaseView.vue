<script setup>
import { ref, onMounted, watch } from 'vue';
import { useDatabaseStore } from '@/stores/databaseStore';
import { storeToRefs } from 'pinia';

// 1. Usar el Store
const databaseStore = useDatabaseStore();
const { data: clientsResponse, isLoading, error } = storeToRefs(databaseStore);

// 2. Estado local para filtros y paginación
const searchTerm = ref('');
const currentPage = ref(1);
const perPage = ref(15); // Cuántos items por página

// 3. Función para cargar datos
function loadClients() {
  const params = {
    page: currentPage.value,
    per_page: perPage.value,
    search: searchTerm.value,
    // Aquí puedes añadir más filtros si quieres, ej: status: 'active'
  };
  
  // Llamamos a la acción del store
  databaseStore.fetchData('clients', params);
}

// 4. Cargar datos al montar el componente
onMounted(() => {
  loadClients();
});

// 5. Observadores (Watchers) para recargar datos si cambia la página o la búsqueda
watch(currentPage, (newPage) => {
  loadClients();
});

// (Opcional) Recargar al buscar. 
// Es mejor usar un @click en un botón de buscar para no hacer llamadas en cada tecla.
function handleSearch() {
  currentPage.value = 1; // Resetea a la página 1 al buscar
  loadClients();
}

// (Opcional) Función para cambiar de página
function changePage(page) {
  if (page > 0 && page <= clientsResponse.value.last_page) {
    currentPage.value = page;
  }
}
</script>

<template>
  <div class="database-view">
    <h1>Base de Datos de Clientes</h1>

    <div class="filters">
      <input 
        v-model="searchTerm" 
        type="text" 
        placeholder="Buscar por nombre, email..."
        @keyup.enter="handleSearch"
      />
      <button @click="handleSearch">Buscar</button>
    </div>

    <div v-if="isLoading" class="loading">Cargando...</div>

    <div v-if="error" class="error-message">Error: {{ error }}</div>

    <div v-if="clientsResponse && clientsResponse.data">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Email</th>
            <th>Compañía</th>
            <th>Estatus</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="clientsResponse.data.length === 0">
            <td colspan="6">No se encontraron clientes.</td>
          </tr>
          <tr v-for="client in clientsResponse.data" :key="client.id">
            <td>{{ client.id }}</td>
            <td>{{ client.first_name }}</td>
            <td>{{ client.last_name }}</td>
            <td>{{ client.email }}</td>
            <td>{{ client.company_name }}</td>
            <td>{{ client.status }}</td>
          </tr>
        </tbody>
      </table>

      <div class="pagination">
        <button 
          @click="changePage(currentPage - 1)" 
          :disabled="currentPage === 1"
        >
          Anterior
        </button>
        <span>
          Página {{ clientsResponse.current_page }} de {{ clientsResponse.last_page }}
        </span>
        <button 
          @click="changePage(currentPage + 1)" 
          :disabled="currentPage === clientsResponse.last_page"
        >
          Siguiente
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Añade algunos estilos básicos para que se vea decente */
.database-view {
  padding: 2rem;
}
.filters {
  margin-bottom: 1rem;
}
.filters input {
  margin-right: 0.5rem;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th, .data-table td {
  border: 1px solid #ddd;
  padding: 8px;
}
.data-table th {
  background-color: #f4f4f4;
}
.pagination {
  margin-top: 1rem;
}
.pagination button {
  margin: 0 0.5rem;
}
.loading, .error-message {
  margin: 1rem 0;
}
.error-message {
  color: red;
}
</style>