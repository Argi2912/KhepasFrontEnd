<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="close">
    <div class="modal-container">
      <div class="modal-header">
        <slot name="header">
          <h3>Modal Titulo</h3>
        </slot>
        <button class="modal-close" @click="close">x</button>
      </div>
      <div class="modal-body">
        <slot name="body">
          <p>Contenido del modal</p>
        </slot>
      </div>
      <div class="modal-footer">
        <slot name="footer">
          <button class="close">Cerrar</button>
        </slot>
      </div>
    </div>
  </div>
</template>
<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const close = () => {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-container {
  background-color: #fff;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}
</style>
