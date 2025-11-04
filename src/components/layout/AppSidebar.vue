<template>
  <aside class="app-sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-logo-section">
      <span class="logo-icon">K</span>
      <span class="logo-text">KHEPAS</span>
    </div>

    <nav class="nav-menu">
      <router-link class="nav-link" :to="{ name: 'Dashboard' }">
        <span class="icon">🏠</span>
        <span class="text">Inicio (Balance)</span>
      </router-link>
      <router-link class="nav-link" :to="{ name: 'Transactions' }">
        <span class="icon">🔄</span>
        <span class="text">Transacciones</span>
      </router-link>
      <router-link class="nav-link" :to="{ name: 'Users' }">
        <span class="icon">👥</span>
        <span class="text">Base de Datos</span>
      </router-link>
      <router-link class="nav-link" :to="{ name: 'Cashes' }">
        <span class="icon">💰</span>
        <span class="text">Caja y Plataformas</span>
      </router-link>
      <router-link class="nav-link" :to="{ name: 'CurrencyList' }">
        <span class="icon">🪙</span>
        <span class="text">Divisas</span>
      </router-link>
      <router-link class="nav-link" :to="{ name: 'ExchangeRates' }">
        <span class="icon">📈</span>
        <span class="text">Tasas de Cambio</span>
      </router-link>
      <router-link class="nav-link" :to="{ name: 'Stats' }">
        <span class="icon">📊</span>
        <span class="text">Reportes</span>
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  isCollapsed: Boolean,
})
</script>

<style scoped>
/* Estilos aplicados desde layout.css.
  Este <style scoped> se mantiene vacío por limpieza.
*/
</style>
