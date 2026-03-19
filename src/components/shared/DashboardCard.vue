<script setup>
import { computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({
  title: String,
  value: [String, Number],
  currencyCode: { type: String, default: 'USD' },
  subtitle: String,
  icon: [String, Array],
  variant: { type: String, default: 'primary' }, // 'primary', 'success', 'danger', 'info'
})

const formatValue = computed(() => {
  let rawValue = props.value
  let currency = props.currencyCode
  if (typeof rawValue === 'string') return rawValue
  const currencyCode = currency === 'USDT' ? 'USD' : currency
  if (rawValue === null || rawValue === undefined) rawValue = 0

  try {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rawValue)
  } catch (e) {
    return `${currency} ${Number(rawValue).toFixed(2)}`
  }
})

const variantClasses = {
  primary: 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_20px_rgba(247,166,0,0.1)]',
  success: 'bg-success/10 text-success border-success/20 shadow-[0_0_20px_rgba(46,204,113,0.1)]',
  danger: 'bg-danger/10 text-danger border-danger/20 shadow-[0_0_20px_rgba(231,76,60,0.1)]',
  info: 'bg-info/10 text-info border-info/20 shadow-[0_0_20px_rgba(52,152,219,0.1)]',
}
</script>

<template>
  <div class="premium-card p-6 flex items-center gap-5 transition-all duration-500 hover:scale-[1.02]">
    <!-- Icon Container -->
    <div :class="['w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0', variantClasses[variant] || variantClasses.primary]">
      <FontAwesomeIcon :icon="icon" class="text-xl" />
    </div>

    <!-- Content -->
    <div class="flex flex-col min-w-0">
      <p class="text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/30 mb-1 truncate">{{ title }}</p>
      <h3 class="text-2xl font-black text-white tracking-tighter leading-none mb-1 truncate">
        {{ formatValue.split(',')[0] }}<span class="text-[0.6em] opacity-30">,{{ formatValue.split(',')[1] || '00' }}</span>
      </h3>
      <p v-if="subtitle" class="text-[0.65rem] font-bold text-white/20 uppercase tracking-widest mt-1 truncate">
        {{ subtitle }}
      </p>
    </div>
    
    <!-- Decorative Gradient Glow -->
    <div class="absolute -right-4 -top-4 w-16 h-16 bg-white/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
  </div>
</template>
