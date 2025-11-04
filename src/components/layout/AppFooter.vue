<template>
  <footer class="app-footer">
    &copy; {{ currentYear }} TUCONPAY MVP. Desarrollado con Vue 3 y Laravel.
  </footer>
</template>

<script setup>
import { computed } from 'vue'
const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
/* Estilos aplicados desde layout.css.
  Este <style scoped> se mantiene vacío por limpieza.
*/
</style>
