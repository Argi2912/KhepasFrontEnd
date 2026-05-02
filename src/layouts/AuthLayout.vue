<template>
  <div class="min-h-screen w-full bg-[#05070a] flex justify-center items-center relative overflow-hidden p-5 font-sans">
    <!-- Luces Ambientales Premium -->
    <div class="absolute -top-[10%] -right-[5%] w-[600px] h-[600px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none"></div>
    <div class="absolute -bottom-[10%] -left-[5%] w-[600px] h-[600px] bg-emerald-400/5 blur-[150px] rounded-full pointer-events-none"></div>
    
    <div class="relative z-10 w-full flex justify-center">
      <slot />
    </div>
  </div>
</template>

<script setup>
/* Layout para vistas de autenticación */
</script>

<style scoped>
/* Transiciones suaves para la entrada */
.auth-layout-fade-enter-active {
  transition: opacity 0.6s ease-out;
}
.auth-layout-fade-enter-from {
  opacity: 0;
}
</style>