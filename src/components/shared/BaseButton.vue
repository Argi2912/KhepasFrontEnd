<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'primary' },
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
  outline: { type: Boolean, default: false },
  size: { type: String, default: 'md' }, // 'sm', 'md', 'lg'
})

const sizeClasses = computed(() => {
  const map = {
    sm: 'py-2 px-4 text-xs rounded-xl',
    md: 'py-3 px-6 text-sm rounded-xl',
    lg: 'py-4 px-8 text-base rounded-2xl',
  }
  return map[props.size] || map.md
})

const variantClasses = computed(() => {
  const map = {
    primary: props.outline
      ? 'bg-transparent text-primary border-primary hover:bg-primary/10'
      : 'bg-primary text-secondary border-primary shadow-[0_10px_25px_-5px_rgba(247,166,0,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(247,166,0,0.4)] hover:-translate-y-0.5',
    secondary: props.outline
      ? 'bg-transparent text-white/60 border-white/20 hover:bg-white/5 hover:text-white'
      : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white',
    success: props.outline
      ? 'bg-transparent text-success border-success hover:bg-success/10'
      : 'bg-success text-secondary border-success shadow-[0_10px_25px_-5px_rgba(46,204,113,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(46,204,113,0.4)] hover:-translate-y-0.5',
    danger: props.outline
      ? 'bg-transparent text-danger border-danger hover:bg-danger/10'
      : 'bg-danger text-white border-danger shadow-[0_10px_25px_-5px_rgba(231,76,60,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(231,76,60,0.4)] hover:-translate-y-0.5',
    info: props.outline
      ? 'bg-transparent text-info border-info hover:bg-info/10'
      : 'bg-info text-white border-info shadow-[0_10px_25px_-5px_rgba(52,152,219,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(52,152,219,0.4)] hover:-translate-y-0.5',
  }
  return map[props.variant] || map.primary
})
</script>

<template>
  <button 
    :type="type" 
    :disabled="disabled" 
    :class="[
      'cursor-pointer font-black uppercase tracking-widest text-center whitespace-nowrap transition-all duration-300 inline-flex items-center justify-center gap-2 border',
      'active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed disabled:transform-none',
      sizeClasses,
      variantClasses
    ]"
  >
    <slot />
  </button>
</template>
