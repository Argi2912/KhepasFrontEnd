<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({
  show: { type: Boolean, required: true },
  title: { type: String, default: 'Ventana Modal' },
})

const emit = defineEmits(['close'])
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 z-[9998] bg-black/70 flex transition-opacity duration-300">
      <div class="grow flex justify-center items-center p-5" @click.self="emit('close')">
        <div class="w-full max-w-[650px] bg-secondary rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.9)] transition-all duration-300 overflow-hidden">
          <div class="flex justify-between items-center px-5 py-4 border-b border-white/10">
            <h3 class="text-primary text-xl font-semibold">{{ title }}</h3>
            <button class="bg-transparent border-none text-white/50 text-lg cursor-pointer transition-colors hover:text-danger" @click="emit('close')">
              <FontAwesomeIcon icon="fa-solid fa-xmark" />
            </button>
          </div>

          <div class="p-5 max-h-[70vh] overflow-y-auto">
            <slot />
          </div>

          <div class="px-5 pb-5 pt-2.5 border-t border-white/10 flex justify-end">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active, .modal-leave-active { transition: opacity 0.3s ease; }
</style>
