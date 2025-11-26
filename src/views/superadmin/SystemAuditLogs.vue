<script setup>
import { ref, onMounted, reactive, watch } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// Componentes
import BaseTable from '@/components/ui/BaseTable.vue'
import Pagination from '@/components/ui/Pagination.vue'
import BaseModal from '@/components/shared/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'

// --- ESTADO ---
const logs = ref([])
const isLoading = ref(false)
const pagination = ref({ current_page: 1, last_page: 1, total: 0 })

// Filtros
const filters = reactive({
  search: '',
  event: '',
  subject_type: '',
})

// Modal Detalle
const showModal = ref(false)
const selectedLog = ref(null)

const headers = [
  { key: 'created_at', label: 'Fecha' },
  { key: 'causer', label: 'Usuario / Tenant' },
  { key: 'subject', label: 'Recurso Afectado' },
  { key: 'description', label: 'Acción' },
  { key: 'event', label: 'Evento' },
  { key: 'actions', label: '' },
]

// Opciones de filtros
const eventOptions = [
  { value: '', label: 'Todos los eventos' },
  { value: 'created', label: 'Creación' },
  { value: 'updated', label: 'Actualización' },
  { value: 'deleted', label: 'Eliminación' },
]

// --- API ---
const fetchLogs = async (page = 1) => {
  isLoading.value = true
  try {
    // Construir query string
    const params = {
      page,
      search: filters.search,
      event: filters.event,
      subject_type: filters.subject_type,
    }

    const { data } = await api.get('/superadmin/logs', { params })
    logs.value = data.data

    const { data: list, ...meta } = data
    pagination.value = meta
  } catch (e) {
    console.error(e)
    notify.error('Error al cargar logs')
  } finally {
    isLoading.value = false
  }
}

// Watchers para filtros automáticos (con debounce manual simple si quisieras)
watch(filters, () => {
  fetchLogs(1)
})

// --- MODAL LOGICA ---
const viewDetails = (log) => {
  selectedLog.value = log
  showModal.value = true
}

// Helper para formatear JSON en el template
const formatJson = (json) => {
  try {
    return JSON.stringify(json, null, 2)
  } catch (e) {
    return '{}'
  }
}

// Colores para etiquetas
const getEventBadge = (event) => {
  switch (event) {
    case 'created':
      return 'bg-success'
    case 'updated':
      return 'bg-warning'
    case 'deleted':
      return 'bg-danger'
    default:
      return 'bg-info'
  }
}

onMounted(() => fetchLogs())
</script>

<template>
  <div class="audit-container">
    <div class="header">
      <h1>Auditoría Global del Sistema</h1>
      <p>Registro detallado de acciones realizadas en todos los tenants.</p>
    </div>

    <div class="filters-bar">
      <div class="filter-item search">
        <BaseInput v-model="filters.search" placeholder="Buscar descripción..." />
      </div>
      <div class="filter-item">
        <BaseSelect v-model="filters.event" :options="eventOptions" placeholder="Tipo de Evento" />
      </div>
      <div class="filter-item">
        <BaseInput v-model="filters.subject_type" placeholder="Modelo (Ej: Client)" />
      </div>
      <button class="btn-refresh" @click="fetchLogs(1)">
        <FontAwesomeIcon icon="fa-solid fa-rotate-right" />
      </button>
    </div>

    <div class="table-card">
      <BaseTable :headers="headers" :data="logs" :is-loading="isLoading">
        <tr v-for="row in logs" :key="row.id">
          <td class="date-col">
            <div>{{ row.created_at }}</div>
            <small>{{ row.time_ago }}</small>
          </td>

          <td>
            <div class="user-info">
              <strong>{{ row.causer_name }}</strong>
              <small>{{ row.tenant_name }}</small>
            </div>
          </td>

          <td>
            <span class="subject-badge">{{ row.subject_type }} #{{ row.subject_id }}</span>
          </td>

          <td>{{ row.description }}</td>

          <td>
            <span :class="['badge', getEventBadge(row.event)]">{{ row.event }}</span>
          </td>

          <td>
            <button class="btn-icon" @click="viewDetails(row)" title="Ver Cambios">
              <FontAwesomeIcon icon="fa-solid fa-code" />
            </button>
          </td>
        </tr>
      </BaseTable>
      <Pagination :pagination="pagination" @change-page="fetchLogs" />
    </div>

    <BaseModal :show="showModal" title="Detalle del Cambio" @close="showModal = false">
      <div v-if="selectedLog" class="log-detail">
        <div class="log-meta">
          <div class="meta-item">
            <label>Usuario:</label> <span>{{ selectedLog.causer_name }}</span>
          </div>
          <div class="meta-item">
            <label>Tenant:</label> <span>{{ selectedLog.tenant_name }}</span>
          </div>
          <div class="meta-item">
            <label>Fecha:</label> <span>{{ selectedLog.created_at }}</span>
          </div>
        </div>

        <div class="changes-viewer">
          <div class="change-block" v-if="selectedLog.properties?.attributes">
            <h4>Nuevos Valores (Attributes)</h4>
            <pre class="json-box">{{ formatJson(selectedLog.properties.attributes) }}</pre>
          </div>

          <div class="change-block" v-if="selectedLog.properties?.old">
            <h4>Valores Anteriores (Old)</h4>
            <pre class="json-box old">{{ formatJson(selectedLog.properties.old) }}</pre>
          </div>

          <div
            v-if="!selectedLog.properties?.attributes && !selectedLog.properties?.old"
            class="no-changes"
          >
            <p>No se registraron cambios de atributos específicos en este evento.</p>
            <pre class="json-box">{{ formatJson(selectedLog.properties) }}</pre>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-close" @click="showModal = false">Cerrar</button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.audit-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  color: var(--color-text-light);
}
.header h1 {
  color: var(--color-primary);
  margin-bottom: 5px;
}
.header p {
  opacity: 0.7;
  margin-bottom: 20px;
}

/* Filtros */
.filters-bar {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  background: var(--color-secondary);
  padding: 15px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  flex-wrap: wrap;
}
.filter-item {
  flex: 1;
  min-width: 200px;
}
.btn-refresh {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  color: #fff;
  width: 42px;
  border-radius: 6px;
  cursor: pointer;
}
.btn-refresh:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

/* Tabla */
.table-card {
  background: var(--color-secondary);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--color-border);
}
.date-col small {
  display: block;
  color: #888;
  font-size: 0.75rem;
}
.user-info {
  display: flex;
  flex-direction: column;
}
.user-info small {
  color: var(--color-primary);
  opacity: 0.8;
}

.subject-badge {
  background: #333;
  padding: 3px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85rem;
  color: #ccc;
}

/* Badges */
.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
}
.bg-success {
  background: rgba(14, 203, 129, 0.2);
  color: #0ecb81;
}
.bg-warning {
  background: rgba(243, 156, 18, 0.2);
  color: #f39c12;
}
.bg-danger {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}
.bg-info {
  background: rgba(52, 152, 219, 0.2);
  color: #3498db;
}

/* Modal Detalle */
.log-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid #444;
  padding-bottom: 15px;
}
.meta-item label {
  font-weight: bold;
  color: #888;
  margin-right: 5px;
}

.changes-viewer {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.change-block h4 {
  margin: 0 0 10px 0;
  font-size: 0.95rem;
  color: var(--color-primary);
}
.json-box {
  background: #111;
  padding: 15px;
  border-radius: 6px;
  color: #0ecb81;
  font-family: monospace;
  font-size: 0.85rem;
  overflow-x: auto;
  border: 1px solid #333;
}
.json-box.old {
  color: #e74c3c;
} /* Rojo para lo viejo */

.btn-close {
  background: transparent;
  border: 1px solid #555;
  color: #ccc;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}
.btn-close:hover {
  background: #333;
  color: #fff;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  color: #888;
  font-size: 1rem;
}
.btn-icon:hover {
  color: #fff;
}
</style>
