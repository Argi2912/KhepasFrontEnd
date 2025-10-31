<template>
  <div class="autocomplete-wrapper">
    <label class="form-label">{{ label }}</label> 
    
    <input 
      type="text" 
      v-model="searchText" 
      @input="debouncedSearch" 
      @focus="showResults = true"
      @blur="hideResultsTemporarily"
      :placeholder="'Escribe para buscar un ' + label.toLowerCase() + ' existente...'"
      class="input-field"
    />

    <ul v-if="showResults && searchResults.length" class="results-list">
      <li 
        v-for="item in searchResults" 
        :key="item.id" 
        @mousedown.prevent="selectItem(item)"
      >
        {{ item.name }} 
      </li>
    </ul>

    <button 
      v-if="showAddNewButton"
      @click="$emit('add-new', searchText)"
      class="btn-agregar-rapido"
    >
      + Agregar "{{ searchText }}"
    </button>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import axios from 'axios';
import { debounce } from 'lodash';

// === PROPS y EMITS ===
const props = defineProps({
  label: { type: String, required: true }, // Ej: "Cliente"
  apiEndpoint: { type: String, required: true }, // Ej: "/api/clients/search"
  modelValue: [Number, String, null] // El ID que se enviará al formulario principal
});

const emit = defineEmits(['update:modelValue', 'add-new']);

// === ESTADO REACTIVO ===
const searchText = ref(''); 
const searchResults = ref([]);
const showResults = ref(false); 
const selectedItem = ref(null); 

// === LÓGICA COMPUTADA ===
const showAddNewButton = computed(() => {
  // Muestra el botón si: no hay selección, no hay resultados, y se ha escrito algo.
  return !selectedItem.value && !searchResults.value.length && searchText.value.length > 2 && !showResults.value;
});

// === FUNCIONES DE BÚSQUEDA Y SELECCIÓN ===
const searchDatabase = async () => {
  if (searchText.value.length < 3) {
    searchResults.value = [];
    return;
  }
  showResults.value = true;
  try {
    // Hace la petición GET al backend para buscar
    const response = await axios.get(props.apiEndpoint, {
      params: { q: searchText.value },
    });
    searchResults.value = response.data;
  } catch (error) {
    console.error(`Error al buscar ${props.label}:`, error);
    searchResults.value = [];
  }
};

// Usa debounce para esperar 300ms antes de buscar
const debouncedSearch = debounce(searchDatabase, 300);

const selectItem = (item) => {
  selectedItem.value = item;
  searchText.value = item.name;
  showResults.value = false;
  emit('update:modelValue', item.id); // Envía el ID al formulario padre
};

const hideResultsTemporarily = () => {
    setTimeout(() => {
        showResults.value = false;
    }, 150); 
};

// === WATCHERS (Sincronización) ===
watch(searchText, (newText) => {
  // Si el usuario edita el texto, reseteamos la selección
  if (selectedItem.value && newText !== selectedItem.value.name) {
    selectedItem.value = null;
    emit('update:modelValue', null);
  } else if (!newText) {
    selectedItem.value = null;
    emit('update:modelValue', null);
  }
});
</script>

<style scoped>
/* Copia los estilos de tu Wizard para .form-label y .input-field */
.autocomplete-wrapper { position: relative; }
.form-label { display: block; margin-bottom: 5px; font-weight: 500; color: #cdd6f4; }
.input-field {
  width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid #243241;
  background: #0f1724; color: #fff; transition: all .18s ease;
}
.input-field:focus { outline: none; border-color: #00bfff; box-shadow: 0 0 8px rgba(0,170,255,0.15); }

.results-list {
  position: absolute; z-index: 20; width: 100%; max-height: 200px; overflow-y: auto;
  border: 1px solid #0096ff; border-top: none; background: #000814; list-style: none;
  padding: 0; margin: 0; box-shadow: 0 4px 10px rgba(0, 150, 255, 0.5); border-radius: 0 0 5px 5px;
}
.results-list li { padding: 10px; cursor: pointer; color: #fff; }
.results-list li:hover { background-color: #00305f; color: #00bfff; }
.btn-agregar-rapido {
    margin-top: 8px; background: #4caf50; color: white; border: none; padding: 8px 15px;
    border-radius: 20px; cursor: pointer; box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
    transition: all 0.3s ease; font-weight: 600;
}
</style>