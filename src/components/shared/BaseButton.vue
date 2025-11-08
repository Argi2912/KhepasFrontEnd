// src/components/shared/BaseButton.vue
<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Define el estilo del botón (primary, secondary, success, danger, warning, etc.)
  variant: {
    type: String,
    default: 'primary',
  },
  // Define el tipo de botón (submit, button, reset)
  type: {
    type: String,
    default: 'button',
  },
  // Desactiva el botón
  disabled: {
    type: Boolean,
    default: false,
  },
  // Aplica el estilo de borde de contorno (outline)
  outline: {
    type: Boolean,
    default: false,
  },
})

const buttonClass = computed(() => {
  const classes = [`btn-${props.variant}`]
  if (props.outline) {
    classes.push(`btn-outline-${props.variant}`)
  }
  return classes.join(' ')
})
</script>

<template>
  <button :type="type" :disabled="disabled" :class="['base-button', buttonClass]">
    <slot />
  </button>
</template>

<style scoped>
/* --- ESTILO BASE --- */
.base-button {
  padding: 10px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    opacity 0.2s,
    transform 0.1s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px; /* Espacio entre icono y texto */
}

.base-button:hover:not(:disabled) {
  opacity: 0.9;
}

.base-button:active:not(:disabled) {
  transform: scale(0.98);
}

.base-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* --- VARIANTES DE COLOR (Binance/Dark Theme) --- */

/* Primary (Azul Principal) */
.btn-primary {
  background-color: var(--color-primary); /* Ej: #f0b90b o un color de acento */
  color: var(--color-background); /* Texto oscuro sobre primary */
  border: 1px solid var(--color-primary);
}
.btn-outline-primary {
  background-color: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}
.btn-outline-primary:hover:not(:disabled) {
  background-color: var(--color-primary);
  color: var(--color-background);
}

/* Secondary (Gris Oscuro, fondo de tarjetas) */
.btn-secondary {
  background-color: var(--color-secondary);
  color: var(--color-text-light);
  border: 1px solid var(--color-border);
}
.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-hover);
}
.btn-outline-secondary {
  background-color: transparent;
  color: var(--color-text-light);
  border: 1px solid var(--color-secondary);
}
.btn-outline-secondary:hover:not(:disabled) {
  background-color: var(--color-secondary);
}

/* Success (Verde) */
.btn-success {
  background-color: var(--color-success, #2ecc71);
  color: var(--color-background);
  border: 1px solid var(--color-success, #2ecc71);
}

/* Danger (Rojo) */
.btn-danger {
  background-color: var(--color-danger, #e74c3c);
  color: var(--color-background);
  border: 1px solid var(--color-danger, #e74c3c);
}

/* Warning (Amarillo/Naranja) */
.btn-warning {
  background-color: var(--color-warning, #f39c12);
  color: var(--color-background);
  border: 1px solid var(--color-warning, #f39c12);
}
</style>
