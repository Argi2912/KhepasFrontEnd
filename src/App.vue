<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppLayout from '@/layouts/AppLayout.vue'

//import '@/assets/global.css' // Descomenta si lo usas

const route = useRoute()

const layoutComponent = computed(() => {
  const layout = route.meta.layout || 'AppLayout'
  if (layout === 'AuthLayout') return AuthLayout
  return AppLayout
})
</script>

<template>
  <component :is="layoutComponent">
    <router-view />
  </component>
</template>