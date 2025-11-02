<template>
  <footer class="bg-dark-secondary p-3 text-center text-gray-500 text-xs mt-auto">
    &copy; {{ currentYear }} TUCONPAY MVP. Desarrollado con Vue 3 y Laravel.
  </footer>
</template>

<script>
export default {
  name: 'AppFooter',
  setup() {
    const currentYear = new Date().getFullYear()
    return { currentYear }
  },
}
</script>

<style scoped>
.bg-dark-secondary {
  background-color: #2b3139;
}
</style>
