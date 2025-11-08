// src/components/shared/BaseModal.vue

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: 'Ventana Modal',
  },
})

const emit = defineEmits(['close'])
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="modal-mask">
      <div class="modal-wrapper" @click.self="emit('close')">
        <div class="modal-container">
          <div class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button class="modal-close-btn" @click="emit('close')">
              <FontAwesomeIcon icon="fa-solid fa-xmark" />
            </button>
          </div>

          <div class="modal-body">
            <slot />
          </div>

          <div class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Estilos del Modal Base (Binance Theme) */
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7); /* Oscurecer el fondo */
  display: flex;
  transition: opacity 0.3s ease;
}

.modal-wrapper {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.modal-container {
  width: 100%;
  max-width: 650px; /* Ancho adaptable */
  background-color: var(--color-secondary);
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.9);
  transition: all 0.3s ease;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  color: var(--color-primary);
  font-size: 1.4rem;
  font-weight: 600;
}

.modal-close-btn {
  background: none;
  border: none;
  color: #ccc;
  font-size: 1.2rem;
  cursor: pointer;
  transition: color 0.2s;
}

.modal-close-btn:hover {
  color: var(--color-danger);
}

.modal-body {
  padding: 20px;
  max-height: 70vh; /* Limita la altura del cuerpo para permitir scroll */
  overflow-y: auto;
}

.modal-footer {
  padding: 10px 20px 20px;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
}

/* Transiciones de Vue */
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-container {
  transform: translateY(-20px);
}
.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: all 0.3s ease-in-out;
}
</style>
