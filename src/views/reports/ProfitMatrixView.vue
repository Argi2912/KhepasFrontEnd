<template>
  <div class="profit-matrix-pro">
    <!-- Header con título + resumen rápido -->
    <div class="header-summary">
      <div>
        <h1 class="title">Matriz de Rentabilidad Operativa</h1>
        <p class="subtitle">Flujo real de dinero entre cuentas • Período: {{ periodLabel }}</p>
      </div>
      <div class="summary-cards">
        <div class="summary-card">
          <span class="label">Volumen Total Recibido</span>
          <span class="value text-emerald-400">{{
            formatCompact(summary.total_volume_received)
          }}</span>
        </div>
        <div class="summary-card">
          <span class="label">Ganancia Neta</span>
          <span class="value text-yellow-400">{{ formatCompact(summary.total_profit) }}</span>
        </div>
        <div class="summary-card">
          <span class="label">Operaciones</span>
          <span class="value">{{ summary.total_operations }}</span>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <div class="date-input-wrapper">
        <input type="date" v-model="filters.start_date" class="date-input" />
        <span class="date-label">Desde</span>
      </div>
      <div class="date-input-wrapper">
        <input type="date" v-model="filters.end_date" class="date-input" />
        <span class="date-label">Hasta</span>
      </div>
      <button @click="loadReport" :disabled="loading" class="btn-primary">
        <i class="fa-solid fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
        Actualizar
      </button>
    </div>

    <div class="grid-container">
      <!-- Top 15 Rutas Más Usadas -->
      <div class="top-routes-card">
        <div class="card-title">
          <i class="fa-solid fa-trophy"></i>
          Top 15 Rutas Más Rentables / Usadas
        </div>
        <div class="top-list">
          <div v-for="(item, i) in top10" :key="i" class="route-item">
            <div class="rank-badge" :class="`rank-${i + 1}`">{{ i + 1 }}</div>
            <div class="route-flow">
              <div class="from">
                <div class="dot out"></div>
                <span class="account">{{ item.source }}</span>
                <span class="currency">{{ item.source_currency }}</span>
              </div>
              <div class="arrow">→</div>
              <div class="to">
                <div class="dot in"></div>
                <span class="account">{{ item.destination }}</span>
                <span class="currency">{{ item.dest_currency }}</span>
              </div>
            </div>
            <div class="metrics">
              <div class="metric">
                <span class="label">Recibido</span>
                <span class="value text-emerald-400">{{
                  formatCompact(item.volume_received)
                }}</span>
              </div>
              <div class="metric">
                <span class="label">Ganancia</span>
                <span class="value text-yellow-400">{{ formatCompact(item.profit) }}</span>
              </div>
              <div class="metric ops">
                <span class="value">{{ item.operations }} ops</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla Matriz Mejorada -->
      <div class="matrix-card">
        <div class="card-title">Mapa de Flujo Completo</div>
        <div class="table-wrapper">
          <table class="flow-table">
            <thead>
              <tr>
                <th class="sticky-col">Origen → Destino</th>
                <th v-for="dest in uniqueDestinations" :key="dest.id" class="dest-header">
                  <div class="account-name">{{ dest.name }}</div>
                  <div class="currency">{{ dest.currency_code }}</div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="source in uniqueSources" :key="source.id">
                <th class="sticky-col source-header">
                  <div class="account-name">{{ source.name }}</div>
                  <div class="currency">{{ source.currency_code }}</div>
                </th>
                <td
                  v-for="dest in uniqueDestinations"
                  :key="dest.id"
                  class="flow-cell"
                  :style="getCellStyle(source.id, dest.id)"
                  @click="showDetail(source.id, dest.id)"
                >
                  <div v-if="getCellData(source.id, dest.id)" class="cell-content">
                    <div class="received">
                      <i class="fa-solid fa-arrow-down text-emerald-400"></i>
                      {{ formatCompact(getCellData(source.id, dest.id).received) }}
                    </div>
                    <div class="sent text-xs opacity-70">
                      {{ formatCompact(getCellData(source.id, dest.id).sent) }}
                    </div>
                    <div class="profit text-yellow-400 text-xs font-bold">
                      +{{ formatCompact(getCellData(source.id, dest.id).profit) }}
                    </div>
                    <div class="ops text-xs">{{ getCellData(source.id, dest.id).ops }} ops</div>
                  </div>
                  <span v-else class="empty">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  <!-- MODAL DE DETALLE (Agregar justo antes de </template>) -->
  <teleport to="body">
    <div v-if="modal.visible" class="modal-overlay" @click="modal.visible = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">
            <i class="fa-solid fa-route text-indigo-400"></i>
            Detalle de Ruta Operativa
          </h2>
          <button @click="modal.visible = false" class="close-btn">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="route-header">
            <div class="from-section">
              <span class="label">Origen (Salida)</span>
              <div class="account-box out">
                <div class="dot"></div>
                <div>
                  <div class="name">{{ modal.data.from_account.name }}</div>
                  <div class="currency">{{ modal.data.from_account.currency_code }}</div>
                </div>
              </div>
            </div>

            <div class="arrow-center">
              <i class="fa-solid fa-arrow-right fa-3x text-indigo-500"></i>
            </div>

            <div class="to-section">
              <span class="label">Destino (Entrada)</span>
              <div class="account-box in">
                <div class="dot"></div>
                <div>
                  <div class="name">{{ modal.data.to_account.name }}</div>
                  <div class="currency">{{ modal.data.to_account.currency_code }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="metrics-grid">
            <div class="metric-card">
              <div class="icon"><i class="fa-solid fa-arrow-up-right text-red-400"></i></div>
              <div>
                <div class="label">Monto Enviado</div>
                <div class="value text-red-400">{{ formatCompact(modal.data.total_sent) }}</div>
              </div>
            </div>

            <div class="metric-card highlight">
              <div class="icon"><i class="fa-solid fa-arrow-down-left text-emerald-400"></i></div>
              <div>
                <div class="label">Monto Recibido</div>
                <div class="value big text-emerald-400">
                  {{ formatCompact(modal.data.total_received) }}
                </div>
              </div>
            </div>

            <div class="metric-card profit">
              <div class="icon"><i class="fa-solid fa-sack-dollar text-yellow-400"></i></div>
              <div>
                <div class="label">Ganancia Neta</div>
                <div class="value big text-yellow-400">
                  +{{ formatCompact(modal.data.total_profit) }}
                </div>
              </div>
            </div>

            <div class="metric-card">
              <div class="icon"><i class="fa-solid fa-exchange-alt text-blue-400"></i></div>
              <div>
                <div class="label">Operaciones</div>
                <div class="value">{{ modal.data.total_ops }}</div>
              </div>
            </div>
          </div>

          <div class="extra-info">
            <div class="info-item">
              <span class="label">Tasa Promedio:</span>
              <span class="value">
                1 {{ modal.data.from_account.currency_code }} →
                {{ (modal.data.total_received / modal.data.total_sent).toFixed(4) }}
                {{ modal.data.to_account.currency_code }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">Rentabilidad Promedio:</span>
              <span class="value text-yellow-400">
                +{{ ((modal.data.total_profit / modal.data.total_sent) * 100).toFixed(2) }}%
              </span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="modal.visible = false" class="btn-close">Cerrar</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTransactionStore } from '@/stores/transaction'

const transactionStore = useTransactionStore()

const loading = ref(false)
const rawData = ref([])
const top10 = ref([])
const summary = ref({})

const filters = ref({
  start_date: '',
  end_date: '',
})

const loadReport = async () => {
  loading.value = true
  try {
    const data = await transactionStore.fetchProfitMatrixReport(filters.value)
    rawData.value = data.matrix_data || []
    top10.value = data.top_10 || []
    summary.value = data.summary || {}
  } finally {
    loading.value = false
  }
}

const uniqueSources = computed(() => {
  const map = new Map()
  rawData.value.forEach((i) => i.from_account && map.set(i.from_account.id, i.from_account))
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
})

const uniqueDestinations = computed(() => {
  const map = new Map()
  rawData.value.forEach((i) => i.to_account && map.set(i.to_account.id, i.to_account))
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
})

const getCellData = (srcId, destId) => {
  return (
    rawData.value.find((i) => i.from_account.id === srcId && i.to_account.id === destId) || null
  )
}

const getCellStyle = (srcId, destId) => {
  const data = getCellData(srcId, destId)
  if (!data || data.total_received <= 0) return {}

  const intensity = Math.min(data.total_received / maxVolume.value, 1)
  const opacity = 0.2 + intensity * 0.8
  return { backgroundColor: `rgba(52, 211, 153, ${opacity})` }
}

const maxVolume = computed(() => {
  return Math.max(...rawData.value.map((i) => i.total_received || 0), 1)
})

const periodLabel = computed(() => {
  if (!filters.value.start_date) return 'Todo el tiempo'
  return `${filters.value.start_date} → ${filters.value.end_date || 'hoy'}`
})

const formatCompact = (num) => {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num || 0)
}

const modal = ref({
  visible: false,
  data: null,
})

const showDetail = (srcId, destId) => {
  const cell = getCellData(srcId, destId)
  if (cell) {
    modal.value = {
      visible: true,
      data: {
        from_account: cell.from_account,
        to_account: cell.to_account,
        total_sent: cell.total_sent,
        total_received: cell.total_received,
        total_profit: cell.total_profit,
        total_ops: cell.total_ops,
      },
    }
  }
}

onMounted(() => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  filters.value.start_date = new Date(year, month, 1).toISOString().slice(0, 10)
  filters.value.end_date = new Date(year, month + 1, 0).toISOString().slice(0, 10)
  loadReport()
})
</script>

<style scoped>
.profit-matrix-pro {
  font-family: 'Segoe UI', sans-serif;
  color: #e2e8f0;
  padding: 1.5rem;
}
.header-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.title {
  font-size: 2.2rem;
  font-weight: 800;
  color: #fff;
  margin: 0;
}
.subtitle {
  color: #94a3b8;
  font-size: 0.95rem;
}
.summary-cards {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}
.summary-card {
  background: rgba(55, 65, 81, 0.3);
  padding: 1rem 1.5rem;
  border-radius: 12px;
  border: 1px solid #374151;
}
.summary-card .label {
  font-size: 0.8rem;
  color: #94a3b8;
  display: block;
}
.summary-card .value {
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.filters-bar {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}
.date-input-wrapper {
  position: relative;
}
.date-input {
  background: #111;
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #fff;
}
.date-label {
  position: absolute;
  top: -8px;
  left: 12px;
  background: #1e1e1e;
  font-size: 0.7rem;
  color: #94a3b8;
  padding: 0 6px;
}
.btn-primary {
  background: #6366f1;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.grid-container {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
}
@media (max-width: 1400px) {
  .grid-container {
    grid-template-columns: 1fr;
  }
}

.top-routes-card,
.matrix-card {
  background: #1e1e1e;
  border: 1px solid #374151;
  border-radius: 16px;
  overflow: hidden;
}
.card-title {
  background: rgba(79, 70, 229, 0.3);
  padding: 1.2rem 1.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid #374151;
}
.top-list {
  padding: 1rem;
  max-height: 800px;
  overflow-y: auto;
}
.route-item {
  background: rgba(55, 65, 81, 0.25);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  transition: all 0.2s;
}
.route-item:hover {
  background: rgba(55, 65, 81, 0.45);
  transform: translateY(-2px);
}
.rank-badge {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
  flex-shrink: 0;
}
.rank-1 {
  background: #fbbf24;
  color: #000;
}
.rank-2 {
  background: #94a3b8;
  color: #000;
}
.rank-3 {
  background: #f97316;
  color: #fff;
}
.rank-badge {
  background: #374151;
  color: #e2e8f0;
}
.route-flow {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.95rem;
}
.from,
.to {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot.out {
  background: #ef4444;
}
.dot.in {
  background: #34d399;
}
.arrow {
  font-size: 1.5rem;
  color: #6366f1;
  font-weight: bold;
}
.metrics {
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
}
.metric .label {
  display: block;
  color: #94a3b8;
  font-size: 0.7rem;
}
.ops {
  color: #94a3b8;
}

.table-wrapper {
  overflow: auto;
  max-height: 80vh;
}
.flow-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
.sticky-col {
  position: sticky;
  left: 0;
  background: #1e1e1e;
  z-index: 10;
  border-right: 1px solid #374151;
  text-align: left;
  padding: 1rem;
  min-width: 180px;
}
.source-header .account-name {
  font-weight: 700;
  color: #fff;
}
.source-header .currency {
  font-size: 0.8rem;
  color: #60a5fa;
}
.dest-header {
  background: #1e1e1e;
  text-align: center;
  padding: 1rem 0.5rem;
  border-bottom: 1px solid #374151;
  min-width: 140px;
}
.dest-header .currency {
  font-size: 0.8rem;
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.2);
  padding: 2px 8px;
  border-radius: 4px;
  margin-top: 4px;
  display: inline-block;
}
.flow-cell {
  text-align: center;
  padding: 1rem 0.5rem;
  border-right: 1px solid #374151;
  border-bottom: 1px solid #374151;
  cursor: pointer;
  transition: all 0.2s;
  height: 100px;
  vertical-align: middle;
}
.flow-cell:hover {
  transform: scale(1.05);
  z-index: 5;
}
.cell-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
}
.received {
  font-weight: 700;
  font-size: 1.1rem;
  color: #34d399;
}
.profit {
  margin-top: 4px;
}
.empty {
  color: #374151;
  font-size: 1.5rem;
}

/* === MODAL PROFESIONAL === */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-out;
}

.modal-content {
  background: #1e1e1e;
  border: 1px solid #374151;
  border-radius: 20px;
  width: 90%;
  max-width: 720px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.4s ease-out;
}

.modal-header {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: white;
  font-size: 1.4rem;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: rotate(90deg);
}

.modal-body {
  padding: 2rem;
}

.route-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.from-section,
.to-section {
  flex: 1;
  min-width: 200px;
}

.label {
  display: block;
  font-size: 0.8rem;
  color: #94a3b8;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.account-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  background: rgba(55, 65, 81, 0.3);
  border: 1px solid #374151;
}

.account-box.out {
  border-left: 4px solid #ef4444;
}
.account-box.in {
  border-left: 4px solid #34d399;
}

.account-box .dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
}

.account-box.out .dot {
  background: #ef4444;
}
.account-box.in .dot {
  background: #34d399;
}

.name {
  font-weight: 700;
  font-size: 1.1rem;
  color: #fff;
}
.currency {
  font-size: 0.9rem;
  color: #60a5fa;
}

.arrow-center {
  color: #6366f1;
  padding: 0 1rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.metric-card {
  background: rgba(55, 65, 81, 0.3);
  padding: 1.2rem;
  border-radius: 16px;
  border: 1px solid #374151;
  text-align: center;
}

.metric-card.highlight {
  background: rgba(52, 211, 153, 0.15);
  border: 1px solid #34d399;
  transform: scale(1.05);
}

.metric-card.profit {
  background: rgba(251, 191, 36, 0.15);
  border: 1px solid #fbbf24;
}

.metric-card .icon {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.metric-card .label {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-bottom: 0.5rem;
}

.metric-card .value {
  font-size: 1.4rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.metric-card .value.big {
  font-size: 1.7rem;
}

.extra-info {
  background: rgba(55, 65, 81, 0.2);
  padding: 1rem;
  border-radius: 12px;
  margin-top: 1.5rem;
  font-size: 0.95rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.info-item:last-child {
  margin-bottom: 0;
}

.modal-footer {
  padding: 1.5rem 2rem;
  text-align: right;
  border-top: 1px solid #374151;
  background: #1a1a1a;
}

.btn-close {
  background: #374151;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #4b5563;
}

/* Animaciones */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
