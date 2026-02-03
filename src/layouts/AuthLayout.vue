<template>
  <div class="auth-layout">
    <div class="ambient-light gold-light"></div>
    <div class="ambient-light blue-light"></div>

    <div class="auth-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  width: 100%;
  background-color: #05070a; /* Fondo oscuro profundo */
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden; /* Evita que las luces generen scroll */
  padding: 20px;
}

.ambient-light {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  filter: blur(140px);
  opacity: 0.12;
  pointer-events: none;
  z-index: 0;
}

.gold-light {
  top: -150px;
  right: -150px;
  background: #f0b90b;
}

.blue-light {
  bottom: -150px;
  left: -150px;
  background: #0062ff;
}

.auth-content {
  position: relative;
  z-index: 10;
  width: 100%;
  display: flex;
  justify-content: center;
}
</style>