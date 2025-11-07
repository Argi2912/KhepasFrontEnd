<script setup>
import { reactive, watch } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const emit = defineEmits(['update:filters', 'search'])

// Estado local de los filtros
const localFilters = reactive({
  search: '',
  start_date: '',
  end_date: '',
})

// Usamos watch para capturar los cambios y emitirlos al padre
// Esto permite que la vista padre llame a fetchClients() con los nuevos params.
watch(
  localFilters,
  (newFilters) => {
    // Nota: Aquí se implementaría un debounce (retraso) si las peticiones fueran muy pesadas
    emit('update:filters', newFilters)
  },
  { deep: true },
)

const resetFilters = () => {
  localFilters.search = ''
  localFilters.start_date = ''
  localFilters.end_date = ''
}
</script>

<template>
  <div class="filter-bar">
    <div class="filter-inputs">
      <div class="input-group search-input">
        <input v-model="localFilters.search" type="text" placeholder="Buscar (Nombre, Email, ID)" />
        <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" class="search-icon" />
      </div>

      <div class="input-group date-input">
        <label>Desde:</label>
        <input v-model="localFilters.start_date" type="date" />
      </div>

      <div class="input-group date-input">
        <label>Hasta:</label>
        <input v-model="localFilters.end_date" type="date" />
      </div>
    </div>

    <button @click="resetFilters" class="reset-btn" title="Limpiar Filtros">
      <FontAwesomeIcon icon="fa-solid fa-rotate-left" />
    </button>
  </div>
</template>

<style scoped>
.filter-bar {
  background-color: var(--color-secondary);
  padding: 15px 20px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.filter-inputs {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  flex-grow: 1;
}

.input-group {
  display: flex;
  align-items: center;
  position: relative;
}

.input-group label {
  margin-right: 5px;
  font-size: 0.9rem;
  color: var(--color-primary);
  white-space: nowrap;
}

.filter-bar input[type='text'],
.filter-bar input[type='date'] {
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
  color: var(--color-text-light);
  border-radius: 4px;
  min-width: 150px;
}

.search-input input {
  padding-right: 35px; /* Espacio para el icono */
}

.search-icon {
  position: absolute;
  right: 10px;
  color: var(--color-primary);
  opacity: 0.7;
  pointer-events: none;
}

.reset-btn {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-text-light);
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.reset-btn:hover {
  background-color: var(--color-hover);
  color: var(--color-primary);
}

/* Ajustes responsivos */
@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-inputs {
    flex-direction: column;
    gap: 10px;
    margin-bottom: 15px;
  }
  .reset-btn {
    width: 100%;
  }
}
</style>
