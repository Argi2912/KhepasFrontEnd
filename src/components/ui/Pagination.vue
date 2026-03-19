<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({
  pagination: { type: Object, required: true },
})

const emit = defineEmits(['change-page'])

const changePage = (page) => {
  if (page >= 1 && page <= props.pagination.last_page) {
    emit('change-page', page)
  }
}
</script>

<template>
  <div v-if="pagination.last_page > 1" class="flex flex-col sm:flex-row justify-between items-center mt-5 py-4 border-t border-white/10 gap-4">
    <span class="text-sm opacity-80 text-white/70">
      Mostrando **{{ pagination.from }}** a **{{ pagination.to }}** de **{{ pagination.total }}** resultados
    </span>

    <div class="flex gap-3 items-center">
      <button
        @click="changePage(pagination.current_page - 1)"
        :disabled="pagination.current_page === 1"
        class="bg-secondary text-white border border-white/10 py-2 px-3 rounded-lg cursor-pointer text-sm font-semibold transition-all hover:bg-primary hover:text-secondary hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#333]"
      >
        <FontAwesomeIcon icon="fa-solid fa-chevron-left" /> Anterior
      </button>

      <span class="font-medium text-sm text-white/80">Pág **{{ pagination.current_page }}** de **{{ pagination.last_page }}**</span>

      <button
        @click="changePage(pagination.current_page + 1)"
        :disabled="pagination.current_page === pagination.last_page"
        class="bg-secondary text-white border border-white/10 py-2 px-3 rounded-lg cursor-pointer text-sm font-semibold transition-all hover:bg-primary hover:text-secondary hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#333]"
      >
        Siguiente <FontAwesomeIcon icon="fa-solid fa-chevron-right" />
      </button>
    </div>
  </div>
</template>
