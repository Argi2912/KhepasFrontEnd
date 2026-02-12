<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

// Importamos los Layouts
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import EmptyLayout from '@/layouts/EmptyLayout.vue'

// NUEVO: Importamos el formulario de soporte
import SupportForm from './components/supportform.vue'

import '@/assets/css/global.css'

const route = useRoute()

const layoutComponent = computed(() => {
  const layout = route.meta.layout || 'AppLayout'
  if (layout === 'AuthLayout') return AuthLayout
  if (layout === 'empty') return EmptyLayout
  return AppLayout
})

const transitionKey = computed(() => {
  const layout = route.meta.layout || 'AppLayout'
  return layout === 'AppLayout' ? 'dashboard-static' : route.fullPath
})
</script>

<template>
  <router-view v-slot="{ Component }">
    <Transition name="page-slide" mode="out-in">
      <component :is="layoutComponent" :key="transitionKey">
        <component :is="Component" />
      </component>
    </Transition>
  </router-view>

  <SupportForm />
</template>



<style>
/* Animaciones globales */
.page-slide-enter-active,
.page-slide-leave-active {
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.25, 0.8, 0.5, 1);
}

.page-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>