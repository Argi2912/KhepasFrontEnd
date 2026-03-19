import { ref, reactive, onMounted } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'
import Swal from 'sweetalert2'

export function useTenantDashboard() {
  const stats = ref({
    total_tenants: 0,
    active_tenants: 0,
    inactive_tenants: 0,
    total_users: 0,
  })
  const tenants = ref([])
  const isLoading = ref(false)
  const pagination = ref({ current_page: 1, last_page: 1, total: 0 })
  const showModal = ref(false)
  const isSubmitting = ref(false)

  const form = reactive({
    name: '',
    admin_name: '',
    admin_email: '',
    password: '',
    plan: 'basic',
  })

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/superadmin/stats')
      stats.value = data
    } catch (e) {
      console.error(e)
    }
  }

  const fetchTenants = async (page = 1) => {
    isLoading.value = true
    try {
      const { data } = await api.get(`/superadmin/tenants?page=${page}`)
      tenants.value = data.data.map((t) => {
        const adminUser = t.admin
        return {
          ...t,
          admin_info: adminUser ? adminUser.name : 'Sin Asignar',
          admin_email: adminUser ? adminUser.email : 'No registrado',
          created_fmt: new Date(t.created_at).toLocaleDateString('es-VE'),
          status_text: t.is_active ? 'ACTIVO' : 'INACTIVO',
        }
      })
      const { data: list, ...meta } = data
      pagination.value = meta
    } catch (e) {
      notify.error('Error cargando tenants')
    } finally {
      isLoading.value = false
    }
  }

  const createTenant = async () => {
    isSubmitting.value = true
    try {
      await api.post('/superadmin/tenants', form)
      notify.success('Tenant creado exitosamente')
      showModal.value = false
      resetForm()
      refreshAll()
    } catch (e) {
      notify.error(e.response?.data?.message || 'Error al crear tenant')
    } finally {
      isSubmitting.value = false
    }
  }

  const resetForm = () => {
    Object.assign(form, {
      name: '',
      admin_name: '',
      admin_email: '',
      password: '',
      plan: 'basic',
    })
  }

  const toggleTenant = async (tenant) => {
    const action = tenant.is_active ? 'Desactivar' : 'Activar'
    const color = tenant.is_active ? '#ff5252' : '#0ecb81'

    const result = await Swal.fire({
      title: `¿${action} Negocio?`,
      text: `Vas a cambiar el estado de "${tenant.name}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, ${action}`,
      confirmButtonColor: color,
      cancelButtonText: 'Cancelar',
      background: '#1a1a1a',
      color: '#fff'
    })

    if (result.isConfirmed) {
      try {
        await api.patch(`/superadmin/tenants/${tenant.id}/toggle`)
        notify.success(`Tenant ${action.toLowerCase()}do correctamente`)
        fetchTenants(pagination.value.current_page)
        fetchStats()
      } catch (e) {
        notify.error('Error al cambiar estado')
      }
    }
  }

  const deleteTenant = async (tenant) => {
    const result = await Swal.fire({
      title: `¿Eliminar "${tenant.name}"?`,
      text: "¡Cuidado! Esta acción borrará la empresa y TODOS sus datos financieros. NO se puede deshacer.",
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Sí, Eliminar Definitivamente',
      confirmButtonColor: '#ff5252',
      cancelButtonText: 'Cancelar',
      background: '#1a1a1a',
      color: '#fff'
    })

    if (result.isConfirmed) {
      try {
        await api.delete(`/superadmin/tenants/${tenant.id}`)
        notify.success('Tenant eliminado correctamente')
        if (tenants.value.length === 1 && pagination.value.current_page > 1) {
          fetchTenants(pagination.value.current_page - 1)
        } else {
          fetchTenants(pagination.value.current_page)
        }
        fetchStats()
      } catch (e) {
        notify.error(e.response?.data?.message || 'Error al eliminar')
      }
    }
  }

  const refreshAll = () => {
    fetchStats()
    fetchTenants()
  }

  onMounted(() => refreshAll())

  return {
    stats,
    tenants,
    isLoading,
    pagination,
    showModal,
    isSubmitting,
    form,
    fetchTenants,
    createTenant,
    toggleTenant,
    deleteTenant,
    refreshAll,
  }
}
