<script setup>
import { ref, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import alert from '@/services/alert'
import notify from '@/services/notify'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// Componentes
import BaseTable from '@/components/ui/BaseTable.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import Pagination from '@/components/ui/Pagination.vue'
import BaseCard from '@/components/shared/BaseCard.vue'
import BrokerFormModal from '@/components/shared/BrokerFormModal.vue'

const authStore = useAuthStore()
const permissionKey = 'manage_exchanges' // Permiso para gestionar brokers

// Estado del Modal
const showBrokerModal = ref(false)
const brokerIdToEdit = ref(null)

// Estado de la Lista
const brokers = ref([])
const pagination = ref({})
const filters = ref({})
const isLoading = ref(false)

// 🚨 ACTUALIZADO: Headers directos
const tableHeaders = [
  { key: 'name', label: 'Corredor' },
  { key: 'email', label: 'Email' },
  { key: 'commission', label: 'Comisión Base' },
  { key: 'created_at', label: 'Registro' },
  { key: 'actions', label: '' },
]

/**
 * Carga la lista de corredores desde la API.
 */
const fetchBrokers = async (page = 1) => {
  isLoading.value = true
  const params = { page: page, ...filters.value }

  try {
    const response = await api.get('/brokers', { params })

    // 🚨 CAMBIO: Asignación directa (ya no mapeamos desde 'user')
    brokers.value = response.data.data

    // Extraer paginación
    const { data, ...pagData } = response.data
    pagination.value = pagData
  } catch (error) {
    console.error(error)
    notify.error('Error al cargar la lista de corredores.')
  } finally {
    isLoading.value = false
  }
}

// --- MODALES ---
const openCreateModal = () => {
  brokerIdToEdit.value = null
  showBrokerModal.value = true
}

const openEditModal = (brokerId) => {
  brokerIdToEdit.value = brokerId
  showBrokerModal.value = true
}

/**
 * Elimina un corredor tras confirmación.
 */
const deleteBroker = async (brokerId, brokerName) => {
  if (!authStore.can(permissionKey)) {
    notify.error('No tienes permiso para eliminar corredores.')
    return
  }

  const confirmed = await alert.confirm(
    `¿Eliminar al Corredor ${brokerName}?`,
    'Esta acción es irreversible y podría afectar el historial si no se maneja con cuidado.',
  )

  if (confirmed) {
    try {
      await api.delete(`/brokers/${brokerId}`)
      notify.success('Corredor eliminado correctamente.')
      fetchBrokers(pagination.value.current_page)
    } catch (error) {
      console.error('Error deleting broker:', error)
      notify.error('No se pudo eliminar el corredor.')
    }
  }
}

watch(filters, () => fetchBrokers(1), { deep: true })

onMounted(() => {
  fetchBrokers()
})
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-2xl md:text-3xl font-black text-white tracking-tight">
        Gestión de <span class="text-primary">Corredores</span>
      </h1>
      <button 
        v-if="authStore.can(permissionKey)" 
        @click="openCreateModal" 
        class="bg-primary hover:bg-primary-dark text-secondary px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 group"
      >
        <FontAwesomeIcon icon="fa-solid fa-user-plus" class="group-hover:rotate-12 transition-transform" /> 
        <span>Registrar Corredor</span>
      </button>
    </div>

    <FilterBar @update:filters="filters = $event" />

    <BaseCard title="Corredores Asociados" subtitle="Gestión de comisiones base y datos de identificación." class="mt-8">
      <BaseTable :headers="tableHeaders" :data="brokers" :is-loading="isLoading">
        <tr v-for="broker in brokers" :key="broker.id" class="hover:bg-white/5 transition-colors group">
          
          <td class="py-4 px-4">
            <div class="flex flex-col">
              <span class="font-bold text-white group-hover:text-primary transition-colors text-sm">{{ broker.name }}</span>
              <span v-if="broker.document_id" class="text-[0.65rem] font-black tracking-widest text-white/30 uppercase mt-0.5">
                ID: {{ broker.document_id }}
              </span>
            </div>
          </td>

          <td class="py-4 px-4 text-sm text-white/60 font-mono">
            {{ broker.email || '---' }}
          </td>

          <td class="py-4 px-4">
            <div class="inline-flex items-center gap-2 bg-info/10 text-info px-2.5 py-1 rounded-lg border border-info/20 shadow-sm">
              <span class="text-xs font-black">{{ broker.default_commission_rate }}%</span>
              <span class="text-[0.6rem] uppercase tracking-tighter opacity-50">Base</span>
            </div>
          </td>

          <td class="py-4 px-4 text-[0.7rem] font-bold text-white/40 uppercase tracking-wider">
            {{ new Date(broker.created_at).toLocaleDateString() }}
          </td>

          <td class="py-4 px-4">
            <div class="flex items-center gap-2">
              <template v-if="authStore.can(permissionKey)">
                <button 
                  @click="openEditModal(broker.id)" 
                  class="w-8 h-8 rounded-lg bg-info/10 text-info flex items-center justify-center transition-all hover:bg-info hover:text-white"
                  title="Editar Corredor"
                >
                  <FontAwesomeIcon icon="fa-solid fa-pen-to-square" />
                </button>
                <button 
                  @click="deleteBroker(broker.id, broker.name)" 
                  class="w-8 h-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center transition-all hover:bg-danger hover:text-white"
                  title="Eliminar Corredor"
                >
                  <FontAwesomeIcon icon="fa-solid fa-trash" />
                </button>
              </template>
              <span v-else class="text-[0.6rem] font-black text-white/10 uppercase tracking-[0.2em]">Restringido</span>
            </div>
          </td>
        </tr>
      </BaseTable>

      <template #footer>
        <Pagination :pagination="pagination" @change-page="fetchBrokers" />
      </template>
    </BaseCard>

    <BrokerFormModal :show="showBrokerModal" :broker-id="brokerIdToEdit" @close="showBrokerModal = false"
      @saved="fetchBrokers(pagination.current_page || 1)" />
  </div>
</template>

<style scoped>
/* Estilos migrados a Tailwind y global.css */
</style>
