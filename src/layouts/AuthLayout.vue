<template>
  <div class="auth-wrapper">
    <slot />
  </div>
</template>

<style scoped>
/* Estilos para centrar el formulario de login en la pantalla */
.auth-wrapper {
  /* Fija el fondo al color secundario para destacar el área de login */
  background-color: var(--color-background);

  min-height: 100vh; /* Asegura que ocupe toda la altura de la ventana */
  display: flex;
  justify-content: center; /* Centrado horizontal */
  align-items: center; /* Centrado vertical */
  padding: 20px;
}
</style>
