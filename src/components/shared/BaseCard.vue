<script setup>
defineProps({
  title: { type: String, default: null },
  subtitle: { type: String, default: null },
  variant: { type: String, default: 'default' }, // 'default' or 'glass'
})
</script>

<template>
  <div 
    class="premium-card p-6 md:p-8 animate-premium-in shadow-2xl"
    :class="[variant === 'glass' ? 'glass border-white/5' : 'bg-card border-white/5']"
  >
    <header v-if="title" class="flex flex-col gap-1 mb-6 border-b border-white/5 pb-6">
      <div class="flex items-center justify-between">
        <h3 class="text-xl md:text-2xl font-black tracking-tight text-white">
          <span class="text-gradient-primary">{{ title }}</span>
        </h3>
        <slot name="header-actions" />
      </div>
      <p v-if="subtitle" class="text-xs md:text-sm text-white/30 font-medium uppercase tracking-widest leading-relaxed">
        {{ subtitle }}
      </p>
    </header>

    <div class="relative z-10">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="mt-8 pt-6 border-t border-white/5">
      <slot name="footer" />
    </footer>
  </div>
</template>
