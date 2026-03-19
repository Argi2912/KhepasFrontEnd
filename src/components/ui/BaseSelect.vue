<script setup>
import { computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({
  modelValue: [String, Number, null],
  label: String,
  options: { type: Array, required: true },
  placeholder: String,
  error: String,
  required: { type: Boolean, default: false },
  name: String,
  labelBy: { type: String, default: 'name' },
  trackBy: { type: String, default: 'id' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'change'])

const inputId = computed(() => props.name || `select-${Math.random().toString(36).substring(2, 9)}`)

const handleUpdate = (event) => {
  const value = event.target.value
  const finalValue = value === "" ? null : value
  emit('update:modelValue', finalValue)
  emit('change', finalValue)
}

const displayOptions = computed(() => {
  return props.options.map((opt) => ({
    value: opt[props.trackBy],
    text: opt[props.labelBy],
  }))
})
</script>

<template>
  <div class="space-y-2 group w-full">
    <label v-if="label" :for="inputId" 
           class="inline-block text-[0.7rem] font-black uppercase tracking-[0.15em] text-white/40 group-focus-within:text-primary transition-colors">
      {{ label }}
      <span v-if="required" class="text-danger ml-0.5">*</span>
    </label>

    <div 
      class="relative flex items-center bg-white/[0.03] border border-white/5 rounded-xl transition-all duration-300 focus-within:border-primary/50 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_20px_rgba(247,166,0,0.05)] overflow-hidden"
      :class="[
        error ? '!border-danger !shadow-[0_0_20px_rgba(231,76,60,0.1)]' : '',
        disabled ? 'opacity-50 grayscale pointer-events-none' : ''
      ]"
    >
      <select 
        :id="inputId" 
        :value="modelValue" 
        :disabled="disabled"
        @change="handleUpdate" 
        :aria-invalid="!!error" 
        :required="required"
        class="appearance-none bg-transparent py-3.5 pl-4 pr-10 w-full text-sm text-white cursor-pointer outline-none font-medium z-10"
      >
        <option value="" class="bg-secondary text-white">{{ placeholder || (required ? 'Seleccione una opción' : '--- Ninguno ---') }}</option>
        <option v-for="option in displayOptions" :key="option.value" :value="option.value" class="bg-secondary text-white">
          {{ option.text }}
        </option>
      </select>
      
      <div class="absolute right-4 text-primary text-[0.7rem] pointer-events-none z-0">
        <FontAwesomeIcon icon="fa-solid fa-chevron-down" />
      </div>

       <!-- Barra de progreso / Acento inferior -->
       <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-primary transition-all duration-500 group-focus-within:w-[80%] opacity-50"></div>
    </div>

    <Transition name="fade">
      <p v-if="error" :id="`${inputId}-error`" class="text-[0.65rem] font-bold text-danger uppercase tracking-wider ml-1">
        {{ error }}
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
