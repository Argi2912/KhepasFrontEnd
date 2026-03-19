<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import Swal from 'sweetalert2' // <--- 1. NUEVO: Importar SweetAlert
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome' // <--- 2. NUEVO: Iconos

const props = defineProps({
  title: String,
  endpoint: String,
  // --- 3. NUEVO: Prop para saber qué reporte descargar (por defecto Matriz) ---
  exportType: {
    type: String,
    default: 'profit_matrix'
  }
})

const route = useRoute()
const isLoading = ref(true)
const isDownloading = ref(false) // <--- 4. NUEVO: Estado de descarga

// Fechas por defecto
const startDate = ref(new Date().getFullYear() + '-01-01')
const endDate = ref(new Date().toISOString().slice(0, 10))

const reports = ref([])

const loadData = async () => {
  isLoading.value = true
  try {
    const params = {
      start_date: startDate.value,
      end_date: endDate.value,
      entity_id: route.query.entity_id || undefined,
    }

    const { data } = await api.get(props.endpoint, { params })
    reports.value = data.reports || []
  } catch (err) {
    console.error('Error cargando reporte:', err)
    reports.value = []
  } finally {
    isLoading.value = false
  }
}

// --- 5. NUEVO: Función de descarga ---
const downloadReport = async (format) => {
  isDownloading.value = true
  try {
    const params = {
      report_type: props.exportType, // Usa el tipo definido en el prop
      format: format,
      start_date: startDate.value,
      end_date: endDate.value,
      entity_id: route.query.entity_id || undefined
    }

    const response = await api.get('/reports/download', {
      params,
      responseType: 'blob'
    })

    if (response.data.type === 'application/json') {
      const errorText = await response.data.text()
      throw new Error(JSON.parse(errorText).message || 'Error generando reporte')
    }

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${props.exportType}_${startDate.value}_${endDate.value}.${format === 'excel' ? 'xlsx' : 'pdf'}`)

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

const totals = computed(() => {
  return reports.value.reduce(
    (acc, r) => ({
      profit: acc.profit + (r.total_profit || 0),
      moved: acc.moved + (r.total_moved || 0),
      paid: acc.paid + (r.total_paid_to_admin || 0),
    }),
    { profit: 0, moved: 0, paid: 0 },
  )
})

const formatMoney = (value) => {
  if (!value) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

watch([startDate, endDate], loadData)
onMounted(loadData)
</script>

<template>
  <div class="text-white/90 w-full">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 flex-wrap gap-4 border-b border-white/10 pb-6">
      <h1 class="text-3xl font-bold text-primary tracking-tight leading-tight">{{ props.title }}</h1>

      <div class="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
        <div class="flex items-center gap-4 bg-secondary-light px-4 py-2 rounded-lg border border-white/10 w-full md:w-auto justify-between">
          <div class="flex flex-col">
            <label class="text-[0.7rem] text-white/50 mb-0.5">Desde</label>
            <input type="date" v-model="startDate" class="bg-transparent border-none text-white font-inherit text-[0.95rem] outline-none cursor-pointer" style="color-scheme: dark" />
          </div>
          <span class="text-primary font-bold">→</span>
          <div class="flex flex-col">
            <label class="text-[0.7rem] text-white/50 mb-0.5">Hasta</label>
            <input type="date" v-model="endDate" class="bg-transparent border-none text-white font-inherit text-[0.95rem] outline-none cursor-pointer" style="color-scheme: dark" />
          </div>
        </div>

        <div class="flex gap-2 w-full md:w-auto justify-end">
          <button @click="downloadReport('excel')" :disabled="isDownloading" class="bg-secondary-light text-white border border-white/10 w-[42px] h-[42px] rounded-lg cursor-pointer flex items-center justify-center text-xl transition-all hover:bg-success hover:border-success disabled:opacity-50 disabled:cursor-not-allowed flex-1 md:flex-none" title="Exportar a Excel">
            <FontAwesomeIcon icon="fa-solid fa-file-excel" />
          </button>
          <button @click="downloadReport('pdf')" :disabled="isDownloading" class="bg-secondary-light text-white border border-white/10 w-[42px] h-[42px] rounded-lg cursor-pointer flex items-center justify-center text-xl transition-all hover:bg-danger hover:border-danger disabled:opacity-50 disabled:cursor-not-allowed flex-1 md:flex-none" title="Exportar a PDF">
            <FontAwesomeIcon icon="fa-solid fa-file-pdf" />
          </button>
        </div>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <div class="bg-secondary-light border border-white/10 border-b-4 border-b-success p-6 rounded-xl flex items-center gap-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-white/20 min-w-0">
        <div class="text-3xl bg-white/5 w-[50px] h-[50px] flex items-center justify-center rounded-full shrink-0">💰</div>
        <div class="flex-1 min-w-0">
          <div class="text-xs text-white/50 uppercase tracking-wider mb-1 whitespace-nowrap">Ganancia Bruta</div>
          <div class="text-3xl font-bold text-success leading-tight break-words">{{ formatMoney(totals.profit) }}</div>
        </div>
      </div>
      <div class="bg-secondary-light border border-white/10 border-b-4 border-b-[#60a5fa] p-6 rounded-xl flex items-center gap-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-white/20 min-w-0">
        <div class="text-3xl bg-white/5 w-[50px] h-[50px] flex items-center justify-center rounded-full shrink-0">📊</div>
        <div class="flex-1 min-w-0">
          <div class="text-xs text-white/50 uppercase tracking-wider mb-1 whitespace-nowrap">Volumen Movido</div>
          <div class="text-3xl font-bold text-white/90 leading-tight break-words">{{ formatMoney(totals.moved) }}</div>
        </div>
      </div>
      <div class="bg-secondary-light border border-white/10 border-b-4 border-b-primary p-6 rounded-xl flex items-center gap-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-white/20 min-w-0">
        <div class="text-3xl bg-white/5 w-[50px] h-[50px] flex items-center justify-center rounded-full shrink-0">🛡️</div>
        <div class="flex-1 min-w-0">
          <div class="text-xs text-white/50 uppercase tracking-wider mb-1 whitespace-nowrap">Ganancia Neta (Admin)</div>
          <div class="text-3xl font-bold text-warning leading-tight break-words">{{ formatMoney(totals.paid) }}</div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-secondary-light rounded-xl border border-white/10 overflow-x-auto shadow-lg w-full mb-5" style="-webkit-overflow-scrolling: touch">
      <table class="w-full border-collapse min-w-[700px]">
        <thead>
          <tr>
            <th class="text-left bg-background text-primary py-5 px-6 text-xs font-semibold uppercase tracking-wider border-b border-white/10 whitespace-nowrap">Nombre de Entidad</th>
            <th class="text-center bg-background text-primary py-5 px-6 text-xs font-semibold uppercase tracking-wider border-b border-white/10 whitespace-nowrap">Transacciones</th>
            <th class="text-right bg-background text-primary py-5 px-6 text-xs font-semibold uppercase tracking-wider border-b border-white/10 whitespace-nowrap">Volumen Total</th>
            <th class="text-right bg-background text-primary py-5 px-6 text-xs font-semibold uppercase tracking-wider border-b border-white/10 whitespace-nowrap">Ganancia Bruta</th>
            <th class="text-right bg-background text-primary py-5 px-6 text-xs font-semibold uppercase tracking-wider border-b border-white/10 whitespace-nowrap">Ganancia Neta</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in reports" :key="row.entity_id" class="hover:bg-white/5 transition-colors">
            <td class="py-5 px-6 border-b border-white/10 text-[0.95rem] whitespace-nowrap font-semibold text-white">{{ row.entity_name }}</td>
            <td class="py-5 px-6 border-b border-white/10 text-[0.95rem] whitespace-nowrap text-center">{{ row.transaction_count || '-' }}</td>
            <td class="py-5 px-6 border-b border-white/10 text-[0.95rem] whitespace-nowrap text-right font-mono tracking-tight">{{ formatMoney(row.total_moved) }}</td>
            <td class="py-5 px-6 border-b border-white/10 text-[0.95rem] whitespace-nowrap text-right font-mono tracking-tight text-success">{{ formatMoney(row.total_profit) }}</td>
            <td class="py-5 px-6 border-b border-white/10 text-[0.95rem] whitespace-nowrap text-right font-mono tracking-tight text-warning">{{ formatMoney(row.total_paid_to_admin) }}</td>
          </tr>
          <tr v-if="!isLoading && reports.length === 0">
            <td colspan="5" class="text-center py-16 px-8 text-white/30">
              <p>No hay datos para el período seleccionado</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Loading overlay -->
    <div v-if="isLoading" class="fixed inset-0 bg-black/80 backdrop-blur flex flex-col items-center justify-center z-[9999]">
      <div class="spinner"></div>
      <p class="text-white/70">Procesando datos...</p>
    </div>
  </div>
</template>

<style scoped>
.spinner {
  width: 50px; height: 50px;
  border: 4px solid #3f3f46;
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>