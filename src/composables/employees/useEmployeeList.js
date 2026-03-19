import { ref, computed, watch, onMounted } from 'vue'
import api from '@/services/api'
import alert from '@/services/alert'
import notify from '@/services/notify'

export function useEmployeeList() {
  const employees = ref([])
  const pagination = ref({})
  const isLoading = ref(false)
  const filters = ref({})
  const isProcessing = ref(false)

  const showFormModal = ref(false)
  const selectedEmployee = ref(null)

  const totalEmployees = computed(() => pagination.value.total || employees.value.length)
  
  const totalPayrollUSD = computed(() => {
    return employees.value.reduce((acc, e) => acc + (Number(e.salary_amount) || 0), 0)
  })
  
  const totalPending = computed(() => {
    return employees.value.reduce((acc, e) => acc + (Number(e.pending_balance) || 0), 0)
  })

  const fetchEmployees = async (page = 1) => {
    isLoading.value = true
    try {
      const params = { page, ...filters.value }
      const { data } = await api.get('/employees', { params })
      employees.value = data.data
      pagination.value = data.meta || {}
    } catch (error) {
      notify.error('Fallo al sincronizar plantilla de empleados.')
    } finally {
      isLoading.value = false
    }
  }

  const openCreate = () => {
    selectedEmployee.value = null
    showFormModal.value = true
  }

  const openEdit = (emp) => {
    selectedEmployee.value = emp
    showFormModal.value = true
  }

  const deleteEmployee = async (emp) => {
    const confirm = await alert.confirm(`¿Remover a ${emp.name}?`, 'Esto archivará su historial laboral.')
    if (confirm) {
      try {
        await api.delete(`/employees/${emp.id}`)
        notify.success('Empleado removido del sistema.')
        fetchEmployees(pagination.value.current_page || 1)
      } catch (e) {
        notify.error('Fallo al eliminar: Verifique liquidaciones pendientes.')
      }
    }
  }

  const processPayroll = async (emp = null) => {
    const isSingle = !!emp
    const msg = isSingle
      ? `¿Generar nómina individual para ${emp.name}?`
      : '¿Procesar ciclo de nómina para TODA la plantilla activa?'

    const confirm = await alert.confirm(msg, 'Esta acción generará obligaciones de pago en el sistema.')
    if (confirm) {
      isProcessing.value = true
      try {
        const payload = isSingle ? { employee_id: emp.id } : {}
        const { data } = await api.post('/employees/process-payroll', payload)
        notify.success(data.message)
        fetchEmployees(pagination.value.current_page || 1)
      } catch (error) {
        notify.error('Fallo al procesar nómina: Verifique configuración de salarios.')
      } finally {
        isProcessing.value = false
      }
    }
  }

  const formatNumber = (value) => {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0)
  }

  onMounted(() => fetchEmployees())

  watch(filters, () => fetchEmployees(1), { deep: true })

  return {
    employees,
    pagination,
    isLoading,
    filters,
    isProcessing,
    showFormModal,
    selectedEmployee,
    totalEmployees,
    totalPayrollUSD,
    totalPending,
    fetchEmployees,
    openCreate,
    openEdit,
    deleteEmployee,
    processPayroll,
    formatNumber
  }
}
