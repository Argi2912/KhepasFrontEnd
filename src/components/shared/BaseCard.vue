<script setup>
defineProps({
  title: {
    type: String,
    default: null,
  },
  subtitle: {
    type: String,
    default: null,
  },
  shadow: {
    type: Boolean,
    default: true,
  },
})
</script>

<template>
  <div :class="['base-card', { 'no-shadow': !shadow }]">
    <header v-if="title" class="card-header">
      <h3 class="card-title">{{ title }}</h3>
      <p v-if="subtitle" class="card-subtitle">{{ subtitle }}</p>
    </header>

    <div class="card-content">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<style scoped>
.base-card {
  background-color: var(--color-secondary);
  padding: 25px;
  border-radius: 10px;
  border: 1px solid #333;
  transition: box-shadow 0.3s ease;
}

.base-card:hover {
  /* Efecto sutil al pasar el ratón */
  box-shadow: 0 0 15px rgba(240, 185, 11, 0.1);
}

.no-shadow {
  box-shadow: none;
}

.card-header {
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 15px;
  margin-bottom: 20px;
}

.card-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: 5px;
}

.card-subtitle {
  font-size: 0.9rem;
  color: #aaa;
}

.card-content {
  /* Estilos para el contenido inyectado */
}

.card-footer {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid var(--color-border);
}
</style>
