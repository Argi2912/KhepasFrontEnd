<template>
    <div class="empty-layout">
        <slot />
    </div>
</template>

<style scoped>
.empty-layout {
    width: 100%;
    min-height: 100vh;
    /* Fondo base para evitar parpadeos negros durante la transición */
    background-color: var(--color-background, #0b0e11);
}
</style>