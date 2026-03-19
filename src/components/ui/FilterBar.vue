<script setup>
import { reactive, watch } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({
  placeholder: { type: String, default: 'Buscar...' }
})

const emit = defineEmits(['update:filters', 'search'])

const localFilters = reactive({
  search: '',
  start_date: '',
  end_date: '',
})

watch(
  localFilters,
  (newFilters) => {
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
  <div class="glass p-2 rounded-2xl flex flex-col lg:flex-row items-center gap-2 mb-8 shadow-xl animate-premium-in">
    <!-- Búsqueda Principal -->
    <div class="relative group grow w-full lg:w-auto">
      <div class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors">
        <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" class="text-sm" />
      </div>
      <input 
        v-model="localFilters.search" 
        type="text" 
        :placeholder="placeholder" 
        class="w-full bg-white/5 border border-white/5 py-3 pl-12 pr-4 rounded-xl text-sm text-white placeholder:text-white/10 outline-none transition-all focus:bg-white/10 focus:border-primary/20"
      />
    </div>

    <!-- Filtros de Fecha -->
    <div class="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto shrink-0">
      <div class="flex items-center gap-3 bg-white/5 border border-white/5 px-4 py-2 rounded-xl group focus-within:border-primary/20 transition-all w-full sm:w-auto">
        <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/20 group-focus-within:text-primary transition-colors">Desde</span>
        <input v-model="localFilters.start_date" type="date" class="bg-transparent text-white text-xs outline-none cursor-pointer [color-scheme:dark]" />
      </div>

      <div class="flex items-center gap-3 bg-white/5 border border-white/5 px-4 py-2 rounded-xl group focus-within:border-primary/20 transition-all w-full sm:w-auto">
        <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/20 group-focus-within:text-primary transition-colors">Hasta</span>
        <input v-model="localFilters.end_date" type="date" class="bg-transparent text-white text-xs outline-none cursor-pointer [color-scheme:dark]" />
      </div>
    </div>

    <!-- Acción de Reset -->
    <button 
      @click="resetFilters" 
      class="h-11 w-11 shrink-0 flex items-center justify-center bg-white/5 border border-white/5 rounded-xl text-white/40 hover:text-primary hover:bg-primary/10 hover:border-primary/20 transition-all group"
      title="Limpiar Filtros"
    >
      <FontAwesomeIcon icon="fa-solid fa-rotate-left" class="group-hover:-rotate-90 transition-transform duration-500" />
    </button>
  </div>
</template>

<style scoped>
/* Estilos específicos para inputs de fecha en navegadores webkit */
input[type="date"]::-webkit-calendar-picker-indicator {
  opacity: 0.3;
  filter: invert(1);
  cursor: pointer;
  transition: opacity 0.3s;
}
input[type="date"]::-webkit-calendar-picker-indicator:hover {
  opacity: 0.8;
}
</style>
