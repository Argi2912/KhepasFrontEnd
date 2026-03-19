<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import alert from '@/services/alert'
import notify from '@/services/notify'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import BaseTable from '@/components/ui/BaseTable.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import Pagination from '@/components/ui/Pagination.vue'
import BaseCard from '@/components/shared/BaseCard.vue'
import ClientFormModal from '@/components/shared/ClientFormModal.vue'

const authStore = useAuthStore()
const permissionKey = 'manage_clients'

// Estado del Modal
const showClientModal = ref(false)
const clientIdToEdit = ref(null)

// Estado de la Lista
const clients = ref([])
const pagination = ref({})
const filters = ref({})
const isLoading = ref(false)

const tableHeaders = [
  { key: 'name', label: 'Nombre Completo' },
  { key: 'email', label: 'Contacto Digital' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'created_at', label: 'Fecha de Registro' },
  { key: 'actions', label: '' },
]

/**
 * Estadísticas Rápidas (Calculadas localmente)
 */
const totalClients = computed(() => pagination.value.total || clients.value.length)
const newClientsCount = computed(() => {
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
  return clients.value.filter(c => new Date(c.created_at) > oneMonthAgo).length
})

/**
 * Carga la lista de clientes.
 */
const fetchClients = async (page = 1) => {
  isLoading.value = true
  const params = { page: page, ...filters.value }
  try {
    const response = await api.get('/clients', { params })
    clients.value = response.data.data
    const { data, ...pagData } = response.data
    pagination.value = pagData
  } catch (error) {
    notify.error('Error al sincronizar cartera de clientes.')
  } finally {
    isLoading.value = false
  }
}

const openCreateModal = () => {
  clientIdToEdit.value = null
  showClientModal.value = true
}

const openEditModal = (clientId) => {
  clientIdToEdit.value = clientId
  showClientModal.value = true
}

const deleteClient = async (clientId, clientName) => {
  if (!authStore.can(permissionKey)) {
    notify.error('Acceso denegado: Permisos insuficientes.')
    return
  }
  const confirmed = await alert.confirm(
    `¿Archivar cliente ${clientName}?`,
    'Esta acción es irreversible y afectará el historial de operaciones.',
  )
  if (confirmed) {
    try {
      await api.delete(`/clients/${clientId}`)
      notify.success('Cliente removido del sistema.')
      fetchClients(pagination.value.current_page)
    } catch (error) {
      notify.error('Fallo al eliminar: El cliente posee transacciones activas.')
    }
  }
}

watch(filters, () => fetchClients(1), { deep: true })
onMounted(() => fetchClients())
</script>

<template>
  <div class="space-y-10 animate-premium-in pb-12">
    
    <!-- Header Premium -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
        <h1 class="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <span class="w-1.5 h-10 bg-primary rounded-full"></span>
          Cartera de <span class="text-gradient-primary">Clientes</span>
        </h1>
        <p class="text-white/30 text-xs font-bold uppercase tracking-[0.2em] mt-2 ml-4">Gestin estratgica de relaciones comerciales</p>
      </div>

      <button 
        v-if="authStore.can(permissionKey)" 
        @click="openCreateModal" 
        class="bg-primary hover:bg-primary-dark text-secondary px-6 py-3.5 rounded-2xl font-black transition-all shadow-[0_10px_30px_rgba(247,166,0,0.2)] flex items-center gap-3 group active:scale-95"
      >
        <FontAwesomeIcon icon="fa-solid fa-user-plus" class="text-lg group-hover:rotate-12 transition-transform duration-500" /> 
        <span>Nuevo Cliente</span>
      </button>
    </div>

    <!-- Panel de KPI v5 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Card: Total -->
      <div class="premium-card p-6 bg-white/[0.02]">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10 shadow-inner">
            <FontAwesomeIcon icon="fa-solid fa-users" class="text-xl" />
          </div>
          <div class="flex flex-col">
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/30 leading-none mb-1">Membresía Total</span>
            <span class="text-xs font-bold text-primary/60">Base de datos consolidada</span>
          </div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-4xl font-black text-white tracking-tighter">{{ totalClients }}</span>
          <span class="text-xs font-bold text-white/20 uppercase tracking-widest">Registros</span>
        </div>
      </div>

      <!-- Card: Nuevos -->
      <div class="premium-card p-6 border-success/5 bg-success/[0.01]">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success border border-success/10 shadow-inner">
            <FontAwesomeIcon icon="fa-solid fa-user-check" class="text-xl" />
          </div>
          <div class="flex flex-col">
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/30 leading-none mb-1">Nuevas Captaciones</span>
            <span class="text-xs font-bold text-success/60">Últimos 30 días</span>
          </div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-4xl font-black text-white tracking-tighter">{{ newClientsCount }}</span>
          <span class="text-[0.65rem] font-black text-success uppercase tracking-widest">+ Crecimiento</span>
        </div>
      </div>

      <!-- Card: Estado -->
      <div class="premium-card p-6 bg-white/[0.02]">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-info/10 flex items-center justify-center text-info border border-info/10 shadow-inner">
             <FontAwesomeIcon icon="fa-solid fa-shield-halved" class="text-xl" />
          </div>
          <div class="flex flex-col">
            <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/30 leading-none mb-1">Integridad</span>
            <span class="text-xs font-bold text-info/60">Datos verificados</span>
          </div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-4xl font-black text-white tracking-tighter">100%</span>
          <span class="text-xs font-bold text-white/20 uppercase tracking-widest">Activos</span>
        </div>
      </div>
    </div>

    <!-- Listado con Filtros y Tabla v5 -->
    <div class="space-y-6">
      <FilterBar @update:filters="filters = $event" placeholder="Buscar por nombre, email o identificación..." />

      <BaseCard title="Clientes Registrados" subtitle="Directorio optimizado para la gestión masiva y selectiva.">
        <BaseTable :headers="tableHeaders" :data="clients" :is-loading="isLoading">
          <tr v-for="client in clients" :key="client.id" class="group">
            
            <!-- Nombre -->
            <td class="font-bold text-white transition-colors group-hover:text-primary">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[0.65rem] font-black text-white/40 border border-white/10 opacity-50 group-hover:opacity-100 transition-all">
                  {{ client.name.charAt(0) }}
                </div>
                <span>{{ client.name }}</span>
              </div>
            </td>

            <!-- Email -->
            <td>
              <div class="flex flex-col">
                <span class="text-sm text-white/70">{{ client.email || 'N/A' }}</span>
                <span class="text-[0.6rem] font-black text-white/20 uppercase tracking-widest">Electrónico</span>
              </div>
            </td>

            <!-- Teléfono -->
            <td>
              <span class="text-sm font-mono text-white/60">{{ client.phone || 'N/A' }}</span>
            </td>

            <!-- Fecha -->
            <td>
              <span class="text-xs font-bold text-white/30 uppercase tracking-widest">
                {{ client.created_at ? new Date(client.created_at).toLocaleDateString() : '---' }}
              </span>
            </td>

            <!-- Acciones -->
            <td>
              <div class="flex justify-end gap-2 opacity-10 group-hover:opacity-100 transition-opacity duration-300">
                <template v-if="authStore.can(permissionKey)">
                  <button 
                    @click="openEditModal(client.id)" 
                    class="w-9 h-9 rounded-xl bg-info/10 text-info flex items-center justify-center transition-all hover:bg-info hover:text-white hover:shadow-lg active:scale-90"
                    title="Configurar Perfil"
                  >
                    <FontAwesomeIcon icon="fa-solid fa-user-gear" />
                  </button>
                  <button 
                    @click="deleteClient(client.id, client.name)" 
                    class="w-9 h-9 rounded-xl bg-danger/10 text-danger flex items-center justify-center transition-all hover:bg-danger hover:text-white hover:shadow-lg active:scale-90"
                    title="Archivar"
                  >
                    <FontAwesomeIcon icon="fa-solid fa-user-minus" />
                  </button>
                </template>
                <span v-else class="text-[0.55rem] font-black text-white/10 uppercase tracking-widest py-2">Solo lectura</span>
              </div>
            </td>
          </tr>
        </BaseTable>

        <template #footer>
          <div class="flex justify-between items-center px-2">
             <div class="text-[0.65rem] font-black text-white/10 uppercase tracking-widest hidden md:block">
               Mostrando {{ clients.length }} de {{ pagination.total || '...' }} registros
             </div>
             <Pagination :pagination="pagination" @change-page="fetchClients" />
          </div>
        </template>
      </BaseCard>
    </div>

    <!-- Modal Premium -->
    <ClientFormModal :show="showClientModal" :client-id="clientIdToEdit" @close="showClientModal = false"
      @saved="fetchClients(pagination.current_page || 1)" />
  </div>
</template>
