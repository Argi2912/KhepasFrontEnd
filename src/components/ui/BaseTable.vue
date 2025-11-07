// src/components/ui/BaseTable.vue
<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

defineProps({
  headers: {
    type: Array, // [{ key: 'id', label: 'ID' }, ...]
    required: true,
  },
  data: {
    type: Array,
    // 🚨 CORRECCIÓN: Se elimina 'required: true' y se añade un default.
    default: () => [], // Array vacío por defecto para evitar 'undefined' en data.length
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div class="table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th v-for="header in headers" :key="header.key">{{ header.label }}</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="isLoading" class="loading-row">
          <td :colspan="headers.length + 1">
            <FontAwesomeIcon icon="fa-solid fa-spinner" spin /> Cargando datos...
          </td>
        </tr>

        <slot v-else>
          <tr v-if="data.length === 0">
            <td :colspan="headers.length + 1" class="no-data">No hay registros disponibles.</td>
          </tr>
        </slot>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* ... (Estilos se mantienen) ... */
.table-container {
  overflow-x: auto;
  margin-top: 20px;
  border-radius: 8px;
  background-color: var(--color-secondary); /* Fondo general de la tabla */
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 15px;
  text-align: left;
}

.data-table thead tr {
  border-bottom: 2px solid var(--color-border);
}

.data-table th {
  background-color: var(--color-secondary);
  color: var(--color-primary);
  font-size: 0.9rem;
  text-transform: uppercase;
  font-weight: 700;
}

.data-table tbody tr {
  border-bottom: 1px solid var(--color-border);
  transition: background-color 0.2s;
}

.data-table tbody tr:hover {
  background-color: var(--color-hover);
}

.data-table td {
  color: var(--color-text-light);
  font-size: 0.95rem;
}

.loading-row td,
.no-data {
  text-align: center !important;
  font-style: italic;
  opacity: 0.7;
  padding: 30px;
}
</style>
