<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({
  // Espera el objeto de paginación de Laravel (ej: {current_page: 1, last_page: 5, total: 50, ...})
  pagination: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['change-page'])

/**
 * Emite un evento para cambiar a la página solicitada.
 */
const changePage = (page) => {
  if (page >= 1 && page <= props.pagination.last_page) {
    emit('change-page', page)
  }
}
</script>

<template>
  <div class="pagination-container" v-if="pagination.last_page > 1">
    <span class="pagination-info">
      Mostrando **{{ pagination.from }}** a **{{ pagination.to }}** de **{{ pagination.total }}**
      resultados
    </span>

    <div class="pagination-controls">
      <button
        @click="changePage(pagination.current_page - 1)"
        :disabled="pagination.current_page === 1"
        class="pagination-btn"
      >
        <FontAwesomeIcon icon="fa-solid fa-chevron-left" /> Anterior
      </button>

      <span class="page-numbers"
        >Página **{{ pagination.current_page }}** de **{{ pagination.last_page }}**</span
      >

      <button
        @click="changePage(pagination.current_page + 1)"
        :disabled="pagination.current_page === pagination.last_page"
        class="pagination-btn"
      >
        Siguiente <FontAwesomeIcon icon="fa-solid fa-chevron-right" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 15px 0;
  border-top: 1px solid var(--color-border);
}

.pagination-info {
  font-size: 0.9rem;
  opacity: 0.8;
}

.pagination-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.pagination-btn {
  background-color: var(--color-secondary);
  color: var(--color-text-light);
  border: 1px solid var(--color-border);
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: var(--color-primary);
  color: var(--color-secondary);
  border-color: var(--color-primary);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #333;
}

.page-numbers {
  font-weight: 500;
  font-size: 0.9rem;
}

/* RESPONSIVE */
@media (max-width: 600px) {
  .pagination-container {
    flex-direction: column;
    gap: 15px;
    align-items: center;
  }
}
</style>
