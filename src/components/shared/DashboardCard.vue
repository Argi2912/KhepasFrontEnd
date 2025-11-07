<script setup>
import { computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({
  title: String,
  value: [String, Number],
  currencyCode: {
    type: String,
    default: 'USD',
  },
  subtitle: String,
  icon: String,
  colorClass: String,
})

/**
 * 🚨 Función de formato segura: Reemplaza USDT por USD para el formatter.
 */
const formatValue = computed(() => {
  let rawValue = props.value
  let currency = props.currencyCode

  // Si el valor ya viene como string (formateado en el padre), solo se devuelve
  if (typeof rawValue === 'string') return rawValue

  // FIX: Usar USD para el formato cuando la divisa es USDT.
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
    // Fallback si el código es inválido (aunque el FIX debería evitarlo)
    console.error('Error formatting currency:', currency, e)
    return `${currency} ${rawValue}`
  }
})
</script>

<template>
  <div :class="['dashboard-card', colorClass]">
    <div class="kpi-icon-wrapper">
      <FontAwesomeIcon :icon="icon" class="kpi-icon" />
    </div>
    <div class="kpi-content">
      <p class="kpi-title">{{ title }}</p>
      <h3 class="kpi-value">{{ formatValue }}</h3>
      <p v-if="subtitle" class="kpi-subtitle">{{ subtitle }}</p>
    </div>
  </div>
</template>

<style scoped>
/* Estilos necesarios para la card */
.dashboard-card {
  background-color: var(--color-secondary);
  padding: 20px;
  border-radius: 8px;
  border-left: 5px solid;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
}

.dashboard-card:hover {
  transform: translateY(-2px);
}

.kpi-icon-wrapper {
  background-color: var(--color-background-soft);
  padding: 10px;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.kpi-icon {
  font-size: 1.5rem;
  color: var(--color-primary);
}

.kpi-title {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-bottom: 2px;
}

.kpi-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-light);
}

.kpi-subtitle {
  font-size: 0.75rem;
  opacity: 0.6;
}

/* Colores Dinámicos (Ejemplos, el borde es manejado por colorClass) */
.balance-neto {
  border-color: #f7a600; /* Primary */
}
.por-cobrar {
  border-color: #2ecc71; /* Success */
}
.por-pagar {
  border-color: #e74c3c; /* Danger */
}
.cash-card {
  border-color: #3498db;
}
</style>
