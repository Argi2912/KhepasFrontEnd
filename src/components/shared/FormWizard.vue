<script setup>
import { computed, useSlots } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  title: String,
})

const slots = useSlots()
const steps = computed(() => {
  return Object.keys(slots).filter((s) => s.startsWith('step-')).length
})
</script>

<template>
  <div class="bg-secondary rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
    <div class="py-5 px-6 border-b border-white/10 flex justify-between items-center">
      <h1 class="text-2xl text-primary font-semibold">{{ title }}</h1>
      <div class="flex gap-2">
        <span
          v-for="i in steps"
          :key="i"
          :class="['w-3 h-3 rounded-full transition-colors duration-300', modelValue === i - 1 ? 'bg-primary' : 'bg-white/10']"
        ></span>
      </div>
    </div>

    <div class="p-6">
      <slot :name="`step-${modelValue}`" />
    </div>

    <div class="py-5 px-6 border-t border-white/10 bg-background rounded-b-lg">
      <slot name="footer" />
    </div>
  </div>
</template>
