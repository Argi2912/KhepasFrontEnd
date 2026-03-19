import { ref, reactive, onMounted, watch } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'

export function useSystemAuditLogs() {
  const logs = ref([])
  const isLoading = ref(false)
  const pagination = ref({ current_page: 1, last_page: 1, total: 0 })

  const filters = reactive({
    search: '',
    event: '',
    subject_type: '',
  })

  const showModal = ref(false)
  const selectedLog = ref(null)

  const eventOptions = [
    { value: '', label: 'Todos los eventos' },
    { value: 'created', label: 'Creación' },
    { value: 'updated', label: 'Actualización' },
    { value: 'deleted', label: 'Eliminación' },
  ]

  const fetchLogs = async (page = 1) => {
    isLoading.value = true
    try {
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
      notify.error('Error al cargar logs')
    } finally {
      isLoading.value = false
    }
  }

  const viewDetails = (log) => {
    selectedLog.value = log
    showModal.value = true
  }

  const formatJson = (json) => {
    try {
      return JSON.stringify(json, null, 2)
    } catch (e) {
      return '{}'
    }
  }

  const getEventBadge = (event) => {
    switch (event) {
      case 'created':
        return 'bg-success/10 text-success border-success/20 shadow-[0_0_10px_rgba(46,204,113,0.1)]'
      case 'updated':
        return 'bg-warning/10 text-warning border-warning/20'
      case 'deleted':
        return 'bg-danger/10 text-danger border-danger/20'
      default:
        return 'bg-info/10 text-info border-info/20'
    }
  }

  onMounted(() => fetchLogs())

  watch(filters, () => fetchLogs(1), { deep: true })

  return {
    logs,
    isLoading,
    pagination,
    filters,
    showModal,
    selectedLog,
    eventOptions,
    fetchLogs,
    viewDetails,
    formatJson,
    getEventBadge,
  }
}
