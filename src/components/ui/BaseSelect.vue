<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: [String, Number],
  label: String,
  options: {
    type: Array,
    required: true,
  },
  placeholder: String,
  error: String,
  required: {
    type: Boolean,
    default: false,
  },
  name: String,
  labelBy: {
    type: String,
    default: 'name',
  },
  trackBy: {
    type: String,
    default: 'id',
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const inputId = computed(() => props.name || `select-${Math.random().toString(36).substring(2, 9)}`)

const handleUpdate = (event) => {
  // Para select nativo, el valor siempre es el valor de la opción (string).
  emit('update:modelValue', event.target.value)
  emit('change', event.target.value) // Emitir evento change para validación
}

const displayOptions = computed(() => {
  return props.options.map((opt) => ({
    value: opt[props.trackBy],
    text: opt[props.labelBy],
  }))
})
</script>

<template>
  <div :class="['form-group', { 'has-error': error }]">
    <label v-if="label" :for="inputId">
      {{ label }}
      <span v-if="required" class="required-star">*</span>
    </label>

    <div class="input-wrapper select-wrapper">
      <select
        :id="inputId"
        :value="modelValue"
        @change="handleUpdate"
        :aria-invalid="!!error"
        :required="required"
        class="custom-select-native"
      >
        <option value="" disabled>{{ placeholder || 'Seleccione una opción' }}</option>
        <option v-for="option in displayOptions" :key="option.value" :value="option.value">
          {{ option.text }}
        </option>
      </select>
      <div class="select-arrow">
        <FontAwesomeIcon icon="fa-solid fa-chevron-down" />
      </div>
    </div>

    <p v-if="error" :id="`${inputId}-error`" class="error-message">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
/* Estilos necesarios para hacer el select nativo elegante */
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
.error-message {
  margin-top: 4px;
  font-size: 0.85rem;
  color: var(--color-danger);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  background-color: var(--color-background); /* Fondo Oscuro */
  border-radius: 6px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.input-wrapper:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.custom-select-native {
  appearance: none; /* Oculta la flecha nativa */
  background: transparent;
  border: none;
  padding: 12px 30px 12px 12px;
  width: 100%;
  color: var(--color-text-light); /* 🚨 Texto Visible */
  min-height: 44px;
  cursor: pointer;
}
/* Asegura que el color de la opción sea visible en Firefox */
.custom-select-native option {
  background-color: var(--color-secondary);
  color: var(--color-text-light);
}

.custom-select-native:focus {
  outline: none;
}

.select-arrow {
  position: absolute;
  right: 12px;
  color: var(--color-primary);
  font-size: 0.7rem;
  pointer-events: none;
}

/* Estilo de Error */
.has-error .input-wrapper {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 1px var(--color-danger);
}
</style>
