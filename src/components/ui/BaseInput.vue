<script setup>
import { computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({
  modelValue: [String, Number],
  label: String,
  type: { type: String, default: 'text' },
  placeholder: String,
  error: String,
  required: { type: Boolean, default: false },
  name: String,
  icon: { type: String, default: null },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const inputId = computed(() => props.name || `input-${Math.random().toString(36).substring(2, 9)}`)

const handleInput = (event) => {
  emit('update:modelValue', event.target.value)
}
</script>

<template>
  <div class="space-y-2 group w-full">
    <label v-if="label" :for="inputId" 
           class="inline-block text-[0.7rem] font-black uppercase tracking-[0.15em] text-white/40 group-focus-within:text-primary transition-colors">
      {{ label }}
      <span v-if="required" class="text-danger ml-0.5">*</span>
    </label>

    <div 
      class="relative flex items-center bg-white/[0.03] border border-white/5 rounded-xl transition-all duration-300 focus-within:border-primary/50 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_20px_rgba(247,166,0,0.05)]"
      :class="[
        error ? '!border-danger !shadow-[0_0_20px_rgba(231,76,60,0.1)]' : '',
        disabled ? 'opacity-50 grayscale pointer-events-none' : ''
      ]"
    >
      <div v-if="icon" class="pl-4 flex items-center justify-center text-white/20 group-focus-within:text-primary transition-colors">
        <FontAwesomeIcon :icon="icon" class="text-sm" />
      </div>

      <input
        :id="inputId"
        :type="type"
        :placeholder="placeholder"
        :value="modelValue"
        :disabled="disabled"
        @input="handleInput"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${inputId}-error` : null"
        :required="required"
        class="w-full bg-transparent py-3.5 px-4 text-sm text-white placeholder:text-white/10 outline-none font-medium"
      />

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
