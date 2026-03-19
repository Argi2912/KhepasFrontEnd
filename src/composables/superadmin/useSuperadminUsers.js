import { ref, watch, onMounted } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'
import Swal from 'sweetalert2'

export function useSuperadminUsers() {
  const users = ref([])
  const pagination = ref({})
  const filters = ref({})
  const isLoading = ref(false)

  const showEditModal = ref(false)
  const selectedUser = ref(null)

  const fetchUsers = async (page = 1) => {
    isLoading.value = true
    try {
      const params = { page, ...filters.value }
      const { data } = await api.get('/superadmin/users', { params })
      users.value = data.data
      const { data: list, ...meta } = data
      pagination.value = meta
    } catch (e) {
      notify.error('Error al cargar usuarios')
    } finally {
      isLoading.value = false
    }
  }

  const openEdit = (user) => {
    selectedUser.value = { ...user }
    showEditModal.value = true
  }

  const changePassword = async (user) => {
    const { value: formValues } = await Swal.fire({
      title: `🔑 Cambiar Contraseña`,
      html: `
        <p style="color:#aaa;margin-bottom:15px;">Usuario: <strong style="color:#fff;">${user.name}</strong></p>
        <input id="swal-password" type="text" class="swal2-input" placeholder="Nueva contraseña" style="font-size:1rem;background:#1a1a1a;color:#fff;border:1px solid #333;">
      `,
      background: '#1a1a1a',
      color: '#fff',
      showCancelButton: true,
      confirmButtonText: 'Cambiar Contraseña',
      confirmButtonColor: '#f7a600',
      cancelButtonText: 'Cancelar',
      focusConfirm: false,
      preConfirm: () => {
        const password = document.getElementById('swal-password').value
        if (!password || password.length < 8) {
          Swal.showValidationMessage('La contraseña debe tener al menos 8 caracteres')
          return false
        }
        return password
      },
    })

    if (formValues) {
      try {
        await api.post(`/superadmin/users/${user.id}/reset-password`, {
          password: formValues,
        })

        await Swal.fire({
          title: '✅ Contraseña Cambiada',
          html: `
            <p style="color:#aaa;">La nueva contraseña de <strong style="color:#fff;">${user.name}</strong> es:</p>
            <div style="background:#222;padding:12px 20px;border-radius:12px;margin:15px 0;border:1px solid #f7a600;">
              <code style="font-size:1.3rem;color:#f7a600;letter-spacing:1px;">${formValues}</code>
            </div>
            <p style="color:#888;font-size:0.85rem;">Compártela con el usuario por un canal seguro.</p>
          `,
          background: '#1a1a1a',
          color: '#fff',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#0ecb81',
        })
      } catch (e) {
        notify.error('Error al cambiar la contraseña')
      }
    }
  }

  const toggleUser = async (user) => {
    const action = user.is_active ? 'Desactivar' : 'Activar'
    const color = user.is_active ? '#ff5252' : '#0ecb81'

    const result = await Swal.fire({
      title: `¿${action} usuario?`,
      text: `Vas a ${action.toLowerCase()} a "${user.name}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, ${action}`,
      confirmButtonColor: color,
      cancelButtonText: 'Cancelar',
      background: '#1a1a1a',
      color: '#fff',
    })

    if (result.isConfirmed) {
      try {
        await api.put(`/superadmin/users/${user.id}`, {
          is_active: !user.is_active,
        })
        notify.success(`Usuario ${action.toLowerCase()}do correctamente`)
        fetchUsers(pagination.value.current_page || 1)
      } catch (e) {
        notify.error('Error al cambiar estado del usuario')
      }
    }
  }

  const getRoleClass = (role) => {
    const map = {
      admin_tenant: 'bg-primary/20 text-primary border-primary/20',
      cajero: 'bg-success/20 text-success border-success/20',
      analista: 'bg-info/20 text-info border-info/20',
      corredor: 'bg-secondary/20 text-white/60 border-white/10',
    }
    return map[role] || 'bg-white/5 text-white/30 border-white/5'
  }

  onMounted(() => fetchUsers())

  watch(filters, () => fetchUsers(1), { deep: true })

  return {
    users,
    pagination,
    filters,
    isLoading,
    showEditModal,
    selectedUser,
    fetchUsers,
    openEdit,
    changePassword,
    toggleUser,
    getRoleClass,
  }
}
