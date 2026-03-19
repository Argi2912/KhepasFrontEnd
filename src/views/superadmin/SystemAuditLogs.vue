<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
// Componentes
import BaseTable from '@/components/ui/BaseTable.vue'
import Pagination from '@/components/ui/Pagination.vue'
import BaseModal from '@/components/shared/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseCard from '@/components/shared/BaseCard.vue'
import { formatDateTime, fromNow } from '@/utils/date'
import { useSystemAuditLogs } from '@/composables/superadmin/useSystemAuditLogs'

const {
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
} = useSystemAuditLogs()

const headers = [
  { key: 'created_at', label: 'Estampa de Tiempo' },
  { key: 'causer', label: 'Origen / Actor' },
  { key: 'subject', label: 'Objeto del Sistema' },
  { key: 'description', label: 'Actividad Detectada' },
  { key: 'event', label: 'Clasificación' },
  { key: 'actions', label: '' },
]
</script>

<template>
  <div class="space-y-10 animate-premium-in pb-12">
    
    <!-- Header Premium -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
        <h1 class="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <span class="w-1.5 h-10 bg-primary rounded-full shadow-[0_0_20px_rgba(247,166,0,0.4)]"></span>
          Auditoría <span class="text-gradient-primary">Global</span>
        </h1>
        <p class="text-white/30 text-xs font-bold uppercase tracking-[0.2em] mt-2 ml-4">Registro forense de actividad en red</p>
      </div>

      <button 
        @click="fetchLogs(1)" 
        :disabled="isLoading"
        class="bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 px-6 py-3.5 rounded-2xl font-black transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
      >
        <FontAwesomeIcon icon="fa-solid fa-rotate-right" :spin="isLoading" /> 
        <span>Sincronizar Logs</span>
      </button>
    </div>

    <!-- Barra de Filtros Inteligente -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/[0.02] p-4 rounded-3xl border border-white/5 shadow-inner">
      <div class="md:col-span-2">
        <BaseInput v-model="filters.search" placeholder="Filtrar por descripción técnica..." class="!bg-transparent" />
      </div>
      <div>
        <BaseSelect v-model="filters.event" :options="eventOptions" placeholder="Tipo de Evento" class="!bg-transparent" />
      </div>
      <div>
        <BaseInput v-model="filters.subject_type" placeholder="Clave de Modelo (Ej: Client)" class="!bg-transparent" />
      </div>
    </div>

    <!-- Tabla de Logs -->
    <BaseCard title="Libro de Eventos" subtitle="Monitoreo en tiempo real de transacciones administrativas y de datos.">
        <BaseTable :headers="headers" :data="logs" :is-loading="isLoading">
          <tr v-for="row in logs" :key="row.id" class="group hover:bg-white/[0.01] transition-colors border-b border-white/[0.02] last:border-0">
            
            <!-- Fecha -->
            <td class="py-4">
              <div class="flex flex-col">
                <span class="text-xs font-bold text-white/80 leading-tight">{{ formatDateTime(row.created_at) }}</span>
                <span class="text-[0.65rem] font-black text-primary/40 uppercase tracking-widest mt-0.5">{{ fromNow(row.created_at) }}</span>
              </div>
            </td>

            <!-- Actor -->
            <td>
              <div class="flex flex-col">
                <span class="text-sm font-bold text-white group-hover:text-primary transition-colors">{{ row.causer_name }}</span>
                <span class="text-[0.6rem] font-black text-white/20 uppercase tracking-[0.2em]">{{ row.tenant_name || 'NÚCLEO SISTEMA' }}</span>
              </div>
            </td>

            <!-- Sujeto -->
            <td>
              <span class="px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[0.65rem] font-mono text-white/40 group-hover:text-white/60 transition-colors">
                {{ row.subject_type }} <span class="text-primary/40 font-black">#{{ row.subject_id }}</span>
              </span>
            </td>

            <!-- Descripción -->
            <td>
              <span class="text-sm text-white/60 font-medium group-hover:text-white/80 transition-colors">{{ row.description }}</span>
            </td>

            <!-- Evento -->
            <td>
              <span 
                class="px-2.5 py-1 rounded-lg text-[0.6rem] font-black uppercase tracking-widest border transition-all"
                :class="getEventBadge(row.event)"
              >
                {{ row.event }}
              </span>
            </td>

            <!-- Acciones -->
            <td>
              <button 
                @click="viewDetails(row)" 
                class="w-8 h-8 rounded-lg bg-white/5 text-white/20 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all active:scale-95 border border-white/5"
                title="Inspeccionar Payload"
              >
                <FontAwesomeIcon icon="fa-solid fa-code" />
              </button>
            </td>
          </tr>
        </BaseTable>

        <template #footer>
          <div class="flex justify-between items-center px-4 py-2">
             <div class="text-[0.65rem] font-black text-white/10 uppercase tracking-widest hidden md:block">
               Mostrando {{ logs.length }} de {{ pagination.total || '...' }} registros forenses
             </div>
             <Pagination :pagination="pagination" @change-page="fetchLogs" />
          </div>
        </template>
    </BaseCard>

    <!-- Modal de Inspección -->
    <BaseModal :show="showModal" title="Carga Útil del Evento (Payload)" @close="showModal = false">
      <div v-if="selectedLog" class="space-y-6 py-4">
        
        <div class="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div class="flex flex-col gap-1">
            <span class="text-[0.55rem] font-black text-white/20 uppercase tracking-widest">Responsable</span>
            <span class="text-xs font-bold text-white">{{ selectedLog.causer_name }}</span>
          </div>
          <div class="flex flex-col gap-1 border-x border-white/5 px-4 text-center">
            <span class="text-[0.55rem] font-black text-white/20 uppercase tracking-widest">Entorno</span>
            <span class="text-xs font-bold text-primary">{{ selectedLog.tenant_name || 'System' }}</span>
          </div>
          <div class="flex flex-col gap-1 text-right">
            <span class="text-[0.55rem] font-black text-white/20 uppercase tracking-widest">Sello Temporal</span>
            <span class="text-xs font-bold text-white/60">{{ formatDateTime(selectedLog.created_at) }}</span>
          </div>
        </div>

        <div class="space-y-4">
          <div v-if="selectedLog.properties?.attributes" class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-success"></span>
              <h4 class="text-[0.65rem] font-black text-white/40 uppercase tracking-widest">Nuevos Valores Tras el Evento</h4>
            </div>
            <pre class="p-4 rounded-2xl bg-[#0d0d0d] border border-white/5 text-[0.7rem] font-mono text-success/80 overflow-x-auto shadow-inner">{{ formatJson(selectedLog.properties.attributes) }}</pre>
          </div>

          <div v-if="selectedLog.properties?.old" class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-danger"></span>
              <h4 class="text-[0.65rem] font-black text-white/40 uppercase tracking-widest">Estado Previo (Old State)</h4>
            </div>
            <pre class="p-4 rounded-2xl bg-[#0d0d0d] border border-white/5 text-[0.7rem] font-mono text-danger/60 overflow-x-auto shadow-inner">{{ formatJson(selectedLog.properties.old) }}</pre>
          </div>

          <div v-if="!selectedLog.properties?.attributes && !selectedLog.properties?.old" class="space-y-2">
            <h4 class="text-[0.65rem] font-black text-white/40 uppercase tracking-widest">Metadata General</h4>
            <pre class="p-4 rounded-2xl bg-[#0d0d0d] border border-white/5 text-[0.7rem] font-mono text-info/60 overflow-x-auto shadow-inner">{{ formatJson(selectedLog.properties) }}</pre>
          </div>
        </div>

        <div class="flex justify-end pt-4 border-t border-white/5">
          <button @click="showModal = false" class="px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/5 active:scale-95">Cerrar Inspección</button>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<style scoped>
.text-gradient-primary {
  background: linear-gradient(135deg, #f7a600, #ffdf6d);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.animate-premium-in {
  animation: slideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

pre::-webkit-scrollbar {
  height: 6px;
}
pre::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
</style>
