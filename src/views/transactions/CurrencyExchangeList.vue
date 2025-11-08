// src/views/transactions/CurrencyExchangeListView.vue

<template>
  <div>
    <h1>Listado de Cambios de Divisas</h1>
    <p>Aquí se mostrarán todas las transacciones de cambio de divisas.</p>

    <div class="header-actions">
      <router-link :to="{ name: 'transaction_exchange_create' }" class="btn btn-primary">
        + Nuevo Cambio
      </router-link>
    </div>
  </div>
</template>

<script setup>
// Aquí se implementaría la lógica de carga de datos, paginación y filtros.
// Se llamaría a `api.get('/currency-exchanges', { params: filtros })`
</script>

<style scoped>
.header-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}
</style>
