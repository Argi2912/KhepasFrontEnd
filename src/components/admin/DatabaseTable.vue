<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useDatabaseStore } from '@/stores/databaseStore';
import { storeToRefs } from 'pinia';

const props = defineProps({
  dataType: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  columns: {
    type: Array,
    required: true,
  },
});

const store = useDatabaseStore();
// Nota: 'response' ahora es la data PLANA (sin la envoltura 'data' y 'meta')
const { data: response, isLoading, error } = storeToRefs(store);

const searchTerm = ref('');
const currentPage = ref(1);
const perPage = ref(15);

function loadData() {
  const params = {
    page: currentPage.value,
    per_page: perPage.value,
  };
  if (searchTerm.value) {
    params.search = searchTerm.value;
  }
  store.fetchData(props.dataType, params);
}

onMounted(loadData);
onUnmounted(() => {
  store.clearData();
});

watch(currentPage, loadData);

function handleSearch() {
  currentPage.value = 1;
  loadData();
}

function changePage(page) {
  // Nota: Accedemos a la paginación a través de 'response.meta' (gracias a API Resources)
  if (response.value && response.value.meta && page > 0 && page <= response.value.meta.last_page) {
    currentPage.value = page;
  }
}
</script>

<template>
  <div class="database-view">
    <h2>{{ title }}</h2>

    <div class="filters">
      <input
        v-model="searchTerm"
        type="text"
        placeholder="Buscar..."
        @keyup.enter="handleSearch"
        class="search-input"
      />
      <button @click="handleSearch" class="btn-primary">Buscar</button>
    </div>

    <div v-if="isLoading" class="loading">Cargando datos...</div>

    <div v-if="error" class="error-message">
      <p>Error de carga: {{ error }}</p>
    </div>

    <div v-if="response && response.data">
      <table class="data-table">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="response.data.length === 0">
            <td :colspan="columns.length">No se encontraron resultados.</td>
          </tr>
          <tr v-for="item in response.data" :key="item.id">
            <td v-for="col in columns" :key="col.key">
              {{ item[col.key] }}
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="response.meta" class="pagination">
        <button
          @click="changePage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="btn-secondary"
        >
          Anterior
        </button>
        <span class="page-info">
          Página {{ response.meta.current_page }} de {{ response.meta.last_page }} (Total: {{ response.meta.total }})
        </span>
        <button
          @click="changePage(currentPage + 1)"
          :disabled="currentPage === response.meta.last_page"
          class="btn-secondary"
        >
          Siguiente
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>


/* === Título === */
.database-view h2 {
  color: #00bfff;
  font-weight: 600;
  font-size: 2rem;
  margin-bottom: 25px;
  text-shadow: 0 0 15px rgba(0, 180, 255, 0.6);
  text-align: center;
  letter-spacing: 1px;
}

/* === Filtros y barra de búsqueda === */
.filters {
  width: 100%;
  max-width: 1200px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-bottom: 25px;
}

.search-input {
  flex: 1;
  max-width: 300px;
  padding: 10px 16px;
  border: 1px solid #00bfff;
  border-radius: 12px;
  background: rgba(0, 30, 60, 0.7);
  color: #ffffff;
  outline: none;
  transition: all 0.3s ease;
}

.search-input:focus {
  box-shadow: 0 0 10px rgba(0, 180, 255, 0.8);
  border-color: #00bfff;
}

/* === Botón de búsqueda === */
.btn-primary {
  background: #00bfff;
  color: #001d3d;
  font-weight: 600;
  padding: 10px 20px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  box-shadow: 0 0 15px rgba(0, 150, 255, 0.4);
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: #0096ff;
  color: #fff;
  box-shadow: 0 0 25px rgba(0, 180, 255, 1);
}

/* === Tabla de datos === */
.data-table {
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  max-width: 1200px;
  border-collapse: collapse;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(0, 13, 40, 0.75);
  box-shadow: 0 0 25px rgba(0, 150, 255, 0.2);
  backdrop-filter: blur(6px);
}

.data-table thead {
  background: linear-gradient(135deg, #0096ff, #00bfff);
}

.data-table thead th {
  color: #fff;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 14px;
}

.data-table tbody tr {
  background: rgba(10, 25, 50, 0.6);
  transition: all 0.3s ease;
}

.data-table tbody tr:nth-child(even) {
  background: rgba(0, 30, 60, 0.6);
}

.data-table tbody tr:hover {
  background: rgba(0, 150, 255, 0.15);
  transform: scale(1.003);
}

.data-table td {
  text-align: center;
  padding: 14px;
  color: #e0e0e0;
  border-bottom: 1px solid rgba(0, 150, 255, 0.1);
}

/* === Paginación === */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 30px;
  gap: 15px;
  color: #00bfff;
}

.btn-secondary {
  background: transparent;
  border: 1px solid #00bfff;
  color: #00bfff;
  border-radius: 25px;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #00bfff;
  color: #001d3d;
  box-shadow: 0 0 15px rgba(0, 180, 255, 0.8);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: transparent;
}

/* === Información de página === */
.page-info {
  font-size: 0.95rem;
  color: #a8d8ff;
}

/* === Estados === */
.loading {
  text-align: center;
  font-size: 1.2rem;
  color: #00bfff;
  margin-top: 40px;
}

.error-message {
  background-color: rgba(255, 77, 77, 0.15);
  color: #ff4d4d;
  padding: 15px;
  border-radius: 10px;
  border: 1px solid rgba(255, 77, 77, 0.3);
  margin-bottom: 25px;
  width: 100%;
  max-width: 900px;
  text-align: center;
  box-shadow: 0 0 10px rgba(255, 77, 77, 0.3);
}

</style>