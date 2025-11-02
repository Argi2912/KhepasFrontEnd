<template>
  <div class="flex min-h-screen bg-dark-primary text-gray-100">
    <AppSidebar />

    <div class="flex flex-col flex-1">
      <AppNavbar />

      <main class="flex-1 p-6 overflow-y-auto">
        <slot></slot>
      </main>

      <AppFooter />
    </div>
  </div>
</template>

<script>
import AppNavbar from './AppNavbar.vue'
import AppSidebar from './AppSidebar.vue'
import AppFooter from './AppFooter.vue'

export default {
  name: 'MainLayout',
  components: {
    AppNavbar,
    AppSidebar,
    AppFooter,
  },
}
</script>

<style scoped>
.bg-dark-primary {
  background-color: #1c2127;
}
</style>
