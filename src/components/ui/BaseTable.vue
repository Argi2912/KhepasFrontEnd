<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

defineProps({
  headers: {
    type: Array,
    required: true,
  },
  data: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div class="overflow-x-auto mt-2 -mx-4 md:mx-0">
    <table class="w-full border-separate border-spacing-y-2">
      <thead>
        <tr>
          <th v-for="header in headers" :key="header.key" 
              class="text-left px-6 py-4 text-[0.7rem] uppercase font-black tracking-[0.2em] text-white/30">
            {{ header.label }}
          </th>
          <th class="text-left px-6 py-4 text-[0.7rem] uppercase font-black tracking-[0.2em] text-white/30 text-right">
            Acciones
          </th>
        </tr>
      </thead>
      <tbody class="relative">
        <tr v-if="isLoading">
          <td :colspan="headers.length + 1" class="py-20 text-center">
            <div class="flex flex-col items-center gap-4">
               <div class="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
               <span class="text-[0.65rem] font-bold uppercase tracking-widest text-primary/40">Sincronizando datos...</span>
            </div>
          </td>
        </tr>

        <tr v-else-if="data.length === 0">
          <td :colspan="headers.length + 1" class="py-20 text-center text-white/10 font-black uppercase tracking-[0.3em] text-xs">
            No se encontraron registros
          </td>
        </tr>

        <slot v-else />
      </tbody>
    </table>
  </div>
</template>

<style scoped>
:deep(tbody tr) {
  background: rgba(255, 255, 255, 0.02);
  transition: var(--transition-premium);
  position: relative;
}

:deep(tbody tr:hover) {
  background: rgba(255, 255, 255, 0.05);
  transform: scale(1.005);
  box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
  z-index: 10;
}

:deep(tbody td) {
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255,255,255,0.03);
  border-bottom: 1px solid rgba(255,255,255,0.03);
  font-size: 0.875rem;
  color: #eaeeef;
}

:deep(tbody td:first-child) {
  border-left: 1px solid rgba(255,255,255,0.03);
  border-top-left-radius: 1rem;
  border-bottom-left-radius: 1rem;
}

:deep(tbody td:last-child) {
  border-right: 1px solid rgba(255,255,255,0.03);
  border-top-right-radius: 1rem;
  border-bottom-right-radius: 1rem;
  text-align: right;
}
</style>
