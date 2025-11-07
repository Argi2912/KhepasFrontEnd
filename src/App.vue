<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
// Importamos los Layouts
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppLayout from '@/layouts/AppLayout.vue'

// Importamos el archivo global.css'

const route = useRoute()

// Mapeamos el layout que viene en el meta de la ruta a los componentes
const layoutComponent = computed(() => {
  const layout = route.meta.layout || 'AppLayout' // Default: AppLayout
  if (layout === 'AuthLayout') return AuthLayout
  return AppLayout
})
</script>

<template>
  <component :is="layoutComponent">
    <router-view />
  </component>
</template>
