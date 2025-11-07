<script setup>
import { computed, useSlots } from 'vue' // 🚨 CORRECCIÓN: Importar useSlots

const props = defineProps({
  modelValue: {
    // El paso actual (v-model)
    type: Number,
    default: 0,
  },
  title: String,
})

// Contar cuántos pasos (slots) se han proporcionado
const slots = useSlots()
const steps = computed(() => {
  return Object.keys(slots).filter((s) => s.startsWith('step-')).length
})
</script>

<template>
  <div class="form-wizard">
    <div class="wizard-header">
      <h1 class="wizard-title">{{ title }}</h1>
      <div class="step-indicator">
        <span
          v-for="i in steps"
          :key="i"
          :class="['step-dot', { active: modelValue === i - 1 }]"
        ></span>
      </div>
    </div>

    <div class="wizard-body">
      <slot :name="`step-${modelValue}`" />
    </div>

    <div class="wizard-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
/* Estilos del Wizard (Tema Oscuro/Binance) */
.form-wizard {
  background-color: var(--color-secondary);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}
.wizard-header {
  padding: 20px 25px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.wizard-title {
  font-size: 1.5rem;
  color: var(--color-primary);
}
.step-indicator {
  display: flex;
  gap: 8px;
}
.step-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: var(--color-border);
  transition: background-color 0.3s;
}
.step-dot.active {
  background-color: var(--color-primary);
}
.wizard-body {
  padding: 25px;
}
.wizard-footer {
  padding: 20px 25px;
  border-top: 1px solid var(--color-border);
  background-color: var(--color-background); /* Un poco más oscuro para el footer */
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}
</style>
