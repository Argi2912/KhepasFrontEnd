// src/views/transactions/TransactionHomeView.vue

<script setup>
import { computed } from 'vue' // 🛑 Importar computed
import { useRoute } from 'vue-router' // 🛑 Importar useRoute

import BaseCard from '@/components/shared/BaseCard.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const route = useRoute()

// Determina si estamos en la ruta principal del módulo de transacciones
// Si route.name es 'transactions_home', mostramos los botones de selección.
const isHomeView = computed(() => route.name === 'transactions_home')
</script>

<template>
  <div class="transaction-home">
    <div v-if="isHomeView">
      <h1>Gestión de Solicitudes</h1>
      <p class="subtitle">Selecciona una acción: crear una nueva transacción o ver el historial.</p>

      <div class="selection-grid">
        <router-link :to="{ name: 'transaction_exchange_create' }" class="selection-card exchange">
          <FontAwesomeIcon icon="fa-solid fa-retweet" class="card-icon" />
          <h2>Crear Cambio de Divisas</h2>
          <p>Registro de operaciones de intercambio de una moneda a otra (Ej: USD a VES).</p>
        </router-link>

        <!-- <router-link :to="{ name: 'transaction_purchase_create' }" class="selection-card purchase">
          <FontAwesomeIcon icon="fa-solid fa-dollar-sign" class="card-icon" />
          <h2>Crear Compra de Dólares</h2>
          <p>Registro de operaciones donde se compra USD/USDT con moneda local (Ej: VES a USD).</p>
        </router-link> -->

        <router-link :to="{ name: 'transaction_exchange_list' }" class="selection-card list">
          <FontAwesomeIcon icon="fa-solid fa-list-ul" class="card-icon" />
          <h2>Ver Historial de Cambios</h2>
          <p>
            Revisar, filtrar y gestionar todas las solicitudes de cambio de divisas registradas.
          </p>
        </router-link>
      </div>
    </div>

    <router-view></router-view>
  </div>
</template>

<style scoped>
/* Estilos existentes */
h1 {
  font-size: 1.8rem;
  margin-bottom: 5px;
}
.subtitle {
  opacity: 0.7;
  margin-bottom: 40px;
}
.selection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.selection-card {
  background-color: var(--color-secondary);
  padding: 30px;
  border-radius: 10px;
  text-decoration: none;
  color: var(--color-text-light);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  border: 1px solid var(--color-border);
  position: relative;
  overflow: hidden;
}

.selection-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
  border-color: var(--color-primary);
}

.card-icon {
  font-size: 3rem;
  color: var(--color-primary);
  margin-bottom: 15px;
  opacity: 0.8;
}

.selection-card h2 {
  font-size: 1.5rem;
  margin-bottom: 10px;
}
.selection-card p {
  font-size: 0.9rem;
  opacity: 0.7;
}

/* Colores visuales */
.exchange {
  border-left: 5px solid #3498db;
}
.purchase {
  border-left: 5px solid var(--color-success);
}
/* 🚨 NUEVO ESTILO PARA EL LISTADO */
.list {
  border-left: 5px solid #f39c12; /* Color anaranjado/amarillo para Listas/Historial */
}
</style>
