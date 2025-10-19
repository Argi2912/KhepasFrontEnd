<template>
  <footer class="app-footer">
    <div class="container-fluid">© {{ new Date().getFullYear() }} Khepas</div>
  </footer>
</template>

<script setup>
// No se necesita script
</script>

<style scoped>
.app-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1020; /* <-- Importante: z-index más bajo que el sidebar (1030) */

  background-color: #0f172a;
  border-top: 1px solid rgba(0, 180, 255, 0.22);
  box-shadow: 0 -2px 15px rgba(0, 150, 255, 0.1);
  color: #cdd6f4;
  font-size: 0.875rem;

  min-height: 50px;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}
</style>
