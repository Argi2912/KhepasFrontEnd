// src/views/protected/Dashboard.vue (Completo)

<template>
  <div>
    <h1 class="page-title">Dashboard de Balance y KPIs</h1>

    <div v-if="statsStore.kpiError" class="alert-error mt-4">
      {{ statsStore.kpiError }}
    </div>

    <div class="kpi-grid">
      <div class="kpi-card bg-kpi-accent">
        <div class="kpi-icon">🌐</div>
        <div class="kpi-info">
          <p class="kpi-label">Balance Neto Total</p>
          <h2 class="kpi-value">{{ formatCurrency(statsStore.netBalance) }}</h2>
          <p class="kpi-detail">Activos - Pasivos (En Moneda Base)</p>
        </div>
      </div>

      <div class="kpi-card bg-kpi-primary">
        <div class="kpi-icon">💰</div>
        <div class="kpi-info">
          <p class="kpi-label">Total en Cajas y Bancos</p>
          <h2 class="kpi-value">{{ formatCurrency(statsStore.totalCash) }}</h2>
          <p class="kpi-detail">Suma de todos los balances de caja.</p>
        </div>
      </div>

      <div class="kpi-card bg-kpi-secondary">
        <div class="kpi-icon">🟢</div>
        <div class="kpi-info">
          <p class="kpi-label">Cuentas por Cobrar (CXC)</p>
          <h2 class="kpi-value">
            {{ formatCurrency(statsStore.totalReceivable) }}
          </h2>
          <p class="kpi-detail">Monto que los clientes te deben.</p>
        </div>
      </div>

      <div class="kpi-card bg-kpi-tertiary">
        <div class="kpi-icon">🔴</div>
        <div class="kpi-info">
          <p class="kpi-label">Cuentas por Pagar (CXP)</p>
          <h2 class="kpi-value">
            {{ formatCurrency(statsStore.totalPayable) }}
          </h2>
          <p class="kpi-detail">Monto que tú debes a proveedores.</p>
        </div>
      </div>

      <div class="kpi-card kpi-full-row bg-kpi-commissions">
        <div class="kpi-icon">📈</div>
        <div class="kpi-info">
          <p class="kpi-label">Comisiones Netas Registradas (Ingresos)</p>
          <h2 class="kpi-value">{{ formatCurrency(statsStore.totalCommissions) }}</h2>
          <p class="kpi-detail">Ganancias por operaciones de Intercambio de Divisas.</p>
        </div>
      </div>
    </div>

    <h2 class="form-subtitle mt-8">Balance Actual por Caja/Plataforma</h2>

    <div v-if="cashStore.loading" class="text-center py-5">Cargando balances de cajas...</div>

    <div v-else class="content-table-wrapper">
      <table class="content-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Divisa</th>
            <th>Cuenta Contable</th>
            <th class="text-right">Saldo Actual</th>
          </tr>
        </thead>
        <tbody v-if="cashStore.cashes.length > 0">
          <tr v-for="cash in cashStore.cashes" :key="cash.id">
            <td>{{ cash.name }}</td>
            <td>
              <span class="role-tag" :style="{ backgroundColor: '#4a515c' }">
                {{ cash.currency?.code || 'N/A' }}
              </span>
            </td>
            <td>{{ cash.account?.name || 'N/A' }}</td>
            <td class="text-right">
              <strong :class="{ 'text-red': cash.balance < 0 }">
                {{ formatCurrency(cash.balance, cash.currency?.symbol || '$') }}
              </strong>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="4" class="text-center">No hay cajas registradas o activas.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useStatsStore } from '@/stores/statsStore'
import { useCashStore } from '@/stores/cashStore'

const statsStore = useStatsStore()
const cashStore = useCashStore()

onMounted(() => {
  statsStore.fetchDashboardData()
})

// --- Helpers ---
const formatCurrency = (value, symbol = '$') => {
  const number = parseFloat(value)
  if (isNaN(number)) return `${symbol} 0.00`
  // Formato con separador de miles y dos decimales
  return `${symbol} ${number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
</script>

<style scoped>
/* ==========================================================
   Estilos Específicos del Dashboard (Usando layout.css)
   ========================================================== */

.kpi-grid {
  display: grid;
  /* Grid de 4 columnas o menos, con un ancho mínimo para móviles */
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

/* Estilo para que la comisión ocupe el ancho completo */
.kpi-full-row {
  grid-column: 1 / -1;
}

.kpi-card {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
}

.kpi-icon {
  font-size: 2.5rem;
  margin-right: 1.25rem;
  padding: 0.5rem;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.05);
}

.kpi-info {
  flex-grow: 1;
}

.kpi-label {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.25rem;
}

.kpi-value {
  font-size: 1.8rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--color-text-primary);
}

.kpi-detail {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 0.25rem;
}

/* Colores de Acento para las tarjetas */
/* Color Principal (Amarillo) */
.bg-kpi-accent {
  border-left: 5px solid var(--color-accent-yellow);
}
.bg-kpi-accent .kpi-value {
  color: var(--color-accent-yellow);
}

/* Color Secundario (Verde/Activos) */
.bg-kpi-primary {
  border-left: 5px solid #0ecb81;
}
.bg-kpi-primary .kpi-value {
  color: #0ecb81;
}

/* Color Terciario (Rojo/Pasivos) */
.bg-kpi-tertiary {
  border-left: 5px solid #d63031;
}
.bg-kpi-tertiary .kpi-value {
  color: #d63031;
}

/* Color de Comisiones */
.bg-kpi-commissions {
  border-left: 5px solid #00bfff; /* Un azul para diferenciar */
}
.bg-kpi-commissions .kpi-value {
  color: #00bfff;
}

/* Estilo para saldos negativos */
.text-red {
  color: #d63031;
}

.text-right {
  text-align: right;
}

.form-subtitle {
  /* Estilo ya definido en layout.css */
  font-size: 1.3rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.5rem;
}
</style>
