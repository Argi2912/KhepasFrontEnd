// src/App.vue

<template>
  <router-view />
</template>

<style>
/* ==========================================================
   ESTILOS GLOBALES - PALETA BINANCE
   ========================================================== */

/* Fondo primario (Negro Profundo) */
body {
  margin: 0;
  background-color: #1c2127; /* bg-dark-primary */
  color: #eaecef; /* Texto principal */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  min-height: 100vh;
}

/* Variables de Colores para consistencia en componentes */
.bg-dark-primary {
  background-color: #1c2127;
}
.bg-dark-secondary {
  background-color: #2b3139;
}
.text-accent-green {
  color: #0ecb81;
} /* Éxito / Ganancia */
.bg-accent-green {
  background-color: #0ecb81;
}
.text-accent-yellow {
  color: #f0b90b;
} /* Advertencia / Acento */

/* Estilo general para asegurar que el input se vea bien en el modo oscuro */
input:focus {
  box-shadow: 0 0 0 2px #0ecb81;
}

button {
  cursor: pointer;
}
</style>
