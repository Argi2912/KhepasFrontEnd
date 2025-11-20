<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const route = useRoute()
// Si estamos en la raíz de transacciones, mostrar menú. Si no, mostrar el hijo (router-view).
const isHomeView = computed(() => route.name === 'transactions_home')
</script>

<template>
  <div class="home-container">
    <div v-if="isHomeView" class="menu-wrapper">
      <h1>Centro de Operaciones</h1>
      <p>Selecciona el tipo de transacción a realizar:</p>

      <div class="cards-grid">
        <router-link :to="{ name: 'transaction_exchange_create' }" class="menu-card primary">
          <div class="icon"><FontAwesomeIcon icon="fa-solid fa-money-bill-transfer" /></div>
          <h3>Operaciones de Divisas</h3>
          <p>Compra, Venta y Cambio. Incluye gestión de comisiones y tasas.</p>
        </router-link>

        <router-link :to="{ name: 'transaction_exchange_list' }" class="menu-card primary-light">
          <div class="icon"><FontAwesomeIcon icon="fa-solid fa-file-invoice" /></div>
          <h3>Ver Historial de Divisas</h3>
          <p>Revisa y gestiona el listado completo de todas las operaciones.</p>
        </router-link>

        <router-link :to="{ name: 'transaction_internal_create' }" class="menu-card secondary">
          <div class="icon"><FontAwesomeIcon icon="fa-solid fa-cash-register" /></div>
          <h3>Caja y Gastos</h3>
          <p>Registro de gastos operativos, nómina e ingresos de capital.</p>
        </router-link>

        <router-link :to="{ name: 'transaction_internal_list' }" class="menu-card secondary-light">
          <div class="icon"><FontAwesomeIcon icon="fa-solid fa-list-ul" /></div>
          <h3>Ver Historial de Caja</h3>
          <p>Auditoría de todos los ingresos y egresos internos.</p>
        </router-link>
        <router-link :to="{ name: 'transaction_ledger' }" class="menu-card danger-light">
          <div class="icon"><FontAwesomeIcon icon="fa-solid fa-file-invoice-dollar" /></div>
          <h3>Cuentas por Pagar</h3>
          <p>Gestión de deudas a Brokers, Proveedores y Cobros pendientes.</p>
        </router-link>
      </div>
    </div>

    <router-view></router-view>
  </div>
</template>

<style scoped>
.home-container {
  padding: 20px;
}
.menu-wrapper {
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
}
h1 {
  font-size: 1.8rem;
  margin-bottom: 5px;
}
p {
  margin-bottom: 30px;
  opacity: 0.8;
}
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
}

.menu-card {
  background: var(--color-secondary);
  padding: 40px 20px;
  border-radius: 12px;
  text-decoration: none;
  color: var(--color-text-light);
  border: 1px solid var(--color-border);
  transition:
    transform 0.2s,
    box-shadow 0.2s,
    border-color 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.menu-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
  border-color: var(--color-primary);
}

.icon {
  font-size: 3rem;
  margin-bottom: 15px;
  color: var(--color-primary);
}
.menu-card.primary .icon {
  color: var(--color-primary);
}
.menu-card.primary-light .icon {
  color: #5dade2;
}
.menu-card.secondary .icon {
  color: #ffbf00;
}

.menu-card h3 {
  font-size: 1.2rem;
  margin-bottom: 10px;
}
.menu-card p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.6;
}
</style>
