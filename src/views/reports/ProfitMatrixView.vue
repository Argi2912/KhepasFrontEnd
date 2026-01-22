<template>
  <div class="profit-matrix-pro">
    <div class="header-summary">
      <div>
        <h1 class="title">Matriz de Rentabilidad Operativa</h1>
        <p class="subtitle">Flujo real de dinero entre cuentas • Período: {{ periodLabel }}</p>
      </div>
      <div class="summary-cards">
        <div class="summary-card">
          <span class="label">Volumen Total Recibido</span>
          <span class="value text-emerald-400">{{ formatCompact(summary.total_volume_received) }}</span>
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

      <div class="export-group">
        <button @click="downloadReport('excel')" :disabled="isDownloading" class="btn-export btn-excel"
          title="Exportar a Excel">
          <i class="fa-solid fa-file-excel"></i>
        </button>
        <button @click="downloadReport('pdf')" :disabled="isDownloading" class="btn-export btn-pdf"
          title="Exportar a PDF">
          <i class="fa-solid fa-file-pdf"></i>
        </button>
      </div>
    </div>

    <div class="grid-container">
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
                <span class="value text-emerald-400">{{ formatCompact(item.volume_received) }}</span>
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
                <td v-for="dest in uniqueDestinations" :key="dest.id" class="flow-cell"
                  :style="getCellStyle(source.id, dest.id)" @click="showDetail(source.id, dest.id)">
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
import api from '@/services/api'
import Swal from 'sweetalert2'

const transactionStore = useTransactionStore()

const loading = ref(false)
const isDownloading = ref(false)
const rawData = ref([])
const top10 = ref([])
const summary = ref({
  total_volume_received: 0,
  total_profit: 0,
  total_operations: 0
})

const filters = ref({
  start_date: '',
  end_date: '',
})

// --- AQUÍ ESTÁ LA CORRECCIÓN Y EL DEBUG ---
const loadReport = async () => {
  loading.value = true
  try {
    // 1. Llamamos al store
    const response = await transactionStore.fetchProfitMatrixReport(filters.value)

    // 2. DEBUG: Mira la consola del navegador (F12) para ver qué llega exactamente
    console.log("🔍 Datos recibidos del Store:", response)

    // 3. Normalización: A veces llega como response.data y a veces directo
    const data = response.data || response

    // 4. Asignación defensiva
    if (data) {
      rawData.value = data.matrix_data || []
      top10.value = data.top_10 || []
      summary.value = data.summary || {
        total_volume_received: 0,
        total_profit: 0,
        total_operations: 0
      }
    } else {
      console.warn("⚠️ La respuesta está vacía o indefinida")
    }

  } catch (error) {
    console.error("❌ Error cargando el reporte:", error)
    Swal.fire('Error', 'No se pudieron cargar los datos del reporte', 'error')
  } finally {
    loading.value = false
  }
}
// ------------------------------------------

const downloadReport = async (format) => {
  isDownloading.value = true
  try {
    const params = {
      report_type: 'profit_matrix',
      format: format,
      start_date: filters.value.start_date,
      end_date: filters.value.end_date
    }

    const response = await api.get('/reports/download', {
      params,
      responseType: 'blob'
    })

    if (response.data && response.data.type === 'application/json') {
      const errorText = await response.data.text()
      throw new Error(JSON.parse(errorText).message || 'Error generando reporte')
    }

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Matriz_Rentabilidad_${filters.value.start_date}.${format === 'excel' ? 'xlsx' : 'pdf'}`)

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

  } catch (error) {
    console.error("Error descargando:", error)
    Swal.fire('Error', error.message || 'No se pudo generar el reporte.', 'error')
  } finally {
    isDownloading.value = false
  }
}

const uniqueSources = computed(() => {
  if (!rawData.value || rawData.value.length === 0) return []
  const map = new Map()
  rawData.value.forEach((i) => {
    if (i.from_account) map.set(i.from_account.id, i.from_account)
  })
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
})

const uniqueDestinations = computed(() => {
  if (!rawData.value || rawData.value.length === 0) return []
  const map = new Map()
  rawData.value.forEach((i) => {
    if (i.to_account) map.set(i.to_account.id, i.to_account)
  })
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
  if (rawData.value.length === 0) return 1
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
  // Ajuste para asegurar formato YYYY-MM-DD correcto
  const pad = (n) => n.toString().padStart(2, '0')

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  filters.value.start_date = `${firstDay.getFullYear()}-${pad(firstDay.getMonth() + 1)}-${pad(firstDay.getDate())}`
  filters.value.end_date = `${lastDay.getFullYear()}-${pad(lastDay.getMonth() + 1)}-${pad(lastDay.getDate())}`

  loadReport()
})
</script>

<style scoped>
/* === ESTILOS BASE (Desktop First) === */
.profit-matrix-pro {
  font-family: 'Segoe UI', sans-serif;
  color: #e2e8f0;
  padding: 1.5rem;
  box-sizing: border-box;
  /* Asegura que el padding no rompa el ancho */
}

/* Header y Títulos */
.header-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  /* Permite que caiga si no hay espacio */
  gap: 1.5rem;
}

.title {
  font-size: clamp(1.5rem, 4vw, 2.2rem);
  /* Tipografía fluida */
  font-weight: 800;
  color: #fff;
  margin: 0;
  line-height: 1.2;
}

.subtitle {
  color: #94a3b8;
  font-size: 0.95rem;
  margin-top: 0.5rem;
}

/* Tarjetas de Resumen Superior */
.summary-cards {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  flex: 1;
  justify-content: flex-end;
}

.summary-card {
  background: rgba(55, 65, 81, 0.3);
  padding: 1rem 1.5rem;
  border-radius: 12px;
  border: 1px solid #374151;
  min-width: 140px;
  /* Ancho mínimo para que no se aplasten */
  flex-grow: 1;
  /* Crecen para llenar huecos en móvil */
  max-width: 300px;
}

.summary-card .label {
  font-size: 0.8rem;
  color: #94a3b8;
  display: block;
}

.summary-card .value {
  font-size: 1.4rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  word-break: break-word;
}

/* Barra de Filtros */
.filters-bar {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  background: #1e1e1e;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid #374151;
}

.date-input-wrapper {
  position: relative;
  flex-grow: 1;
  min-width: 150px;
}

.date-input {
  background: #111;
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #fff;
  width: 100%;
  /* Ocupa todo el contenedor */
  box-sizing: border-box;
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
  justify-content: center;
  gap: 0.5rem;
  min-width: 120px;
  transition: background 0.2s;
}

.btn-primary:active {
  transform: scale(0.98);
}

/* Botones Export */
.export-group {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.btn-export {
  background: #1f2937;
  color: #fff;
  border: 1px solid #374151;
  width: 42px;
  height: 42px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.2s;
}

/* === GRID PRINCIPAL === */
.grid-container {
  display: grid;
  grid-template-columns: 1fr 2fr;
  /* Layout original desktop */
  gap: 2rem;
}

.top-routes-card,
.matrix-card {
  background: #1e1e1e;
  border: 1px solid #374151;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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

/* Lista Top 15 */
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
  flex-wrap: wrap;
  /* Importante para móvil */
}

.rank-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  background: #374151;
  color: #e2e8f0;
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

.route-flow {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  min-width: 200px;
  /* Fuerza wrap si es muy estrecho */
}

.from,
.to {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot.out {
  background: #ef4444;
}

.dot.in {
  background: #34d399;
}

.metrics {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  margin-left: auto;
  /* Empuja a la derecha */
}

/* Tabla Matriz */
.table-wrapper {
  overflow: auto;
  /* Permite scroll en ambas direcciones */
  max-height: 80vh;
  width: 100%;
  -webkit-overflow-scrolling: touch;
  /* Scroll suave en iOS */
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
  min-width: 140px;
}

.dest-header,
.flow-cell {
  padding: 1rem 0.5rem;
  border-bottom: 1px solid #374151;
  border-right: 1px solid #374151;
  text-align: center;
  min-width: 120px;
  /* Ancho mínimo para columnas */
}

/* === RESPONSIVIDAD (MEDIA QUERIES) === */

/* Tablets y Laptops Pequeñas (max 1200px) */
@media (max-width: 1200px) {
  .grid-container {
    grid-template-columns: 1fr;
    /* Colapsa a 1 columna */
  }

  .matrix-card {
    order: 2;
    /* Pone la matriz abajo */
  }

  .top-routes-card {
    order: 1;
    max-height: 500px;
    /* Limita altura */
  }
}

/* Móviles (max 768px) */
@media (max-width: 768px) {
  .profit-matrix-pro {
    padding: 1rem;
    /* Menos padding general */
  }

  /* Header Vertical */
  .header-summary {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-cards {
    width: 100%;
    justify-content: space-between;
  }

  .summary-card {
    width: 48%;
    /* Dos por fila */
    padding: 0.8rem;
  }

  .summary-card .value {
    font-size: 1.1rem;
  }

  /* Filtros en columna */
  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .export-group {
    width: 100%;
    justify-content: space-between;
    margin-top: 0.5rem;
  }

  .btn-export {
    flex: 1;
  }

  /* Items de la lista */
  .route-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .metrics {
    width: 100%;
    justify-content: space-between;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Tabla */
  .sticky-col {
    position: relative;
    /* Quita sticky en movil para ganar espacio */
    left: auto;
    border-right: none;
    background: #252525;
  }
}

/* MODAL RESPONSIVO */
.modal-content {
  width: 95%;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
}

.modal-body {
  overflow-y: auto;
  padding: 1.5rem;
}

.route-header {
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.account-box {
  width: 100%;
  justify-content: center;
}

.arrow-center {
  transform: rotate(90deg);
  /* Flecha hacia abajo en móvil */
  margin: 1rem 0;
}

@media (min-width: 768px) {
  .arrow-center {
    transform: rotate(0deg);
  }
}
</style>