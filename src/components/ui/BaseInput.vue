<script setup>
import { computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({
  modelValue: [String, Number],
  label: String,
  type: {
    type: String,
    default: 'text',
  },
  placeholder: String,
  error: String, // Prop para recibir el error de validación
  required: {
    type: Boolean,
    default: false,
  },
  name: String, // Nombre del campo para el ID y errores
  icon: {
    // Icono opcional para el input
    type: String,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const inputId = computed(() => props.name || `input-${Math.random().toString(36).substring(2, 9)}`)

const handleInput = (event) => {
  // Al emitir el evento, el componente padre puede llamar a clearError()
  emit('update:modelValue', event.target.value)
}
</script>

<template>
  <div :class="['form-group', { 'has-error': error }]">
    <label v-if="label" :for="inputId">
      {{ label }}
      <span v-if="required" class="required-star">*</span>
    </label>

    <div class="input-wrapper">
      <FontAwesomeIcon v-if="icon" :icon="icon" class="input-icon" />
      <input
        :id="inputId"
        :type="type"
        :placeholder="placeholder"
        :value="modelValue"
        @input="handleInput"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${inputId}-error` : null"
        :required="required"
      />
    </div>

    <p v-if="error" :id="`${inputId}-error`" class="error-message">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.form-group {
  margin-bottom: 25px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.95rem;
  color: #ccc;
  font-weight: 500;
}

.required-star {
  color: var(--color-danger);
  margin-left: 5px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
  border-radius: 6px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.input-wrapper:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.input-icon {
  color: var(--color-primary);
  margin: 0 12px;
  font-size: 1rem;
  opacity: 0.7;
}

input {
  flex-grow: 1;
  padding: 12px 10px;
  border: none;
  background: transparent;
  color: var(--color-text-light);
  min-height: 44px; /* Altura mínima para accesibilidad */
}

input:focus {
  outline: none;
}

/* Estilo de Error */
.has-error .input-wrapper {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 1px var(--color-danger);
}

.error-message {
  margin-top: 4px;
  font-size: 0.85rem;
  color: var(--color-danger);
}
</style>
