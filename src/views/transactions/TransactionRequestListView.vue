<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import BaseButton from '@/components/shared/BaseButton.vue'
import BaseCard from '@/components/shared/BaseCard.vue'
import BaseModal from '@/components/shared/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import { useTransactionRequestList } from '@/composables/transactions/useTransactionRequestList'

const {
  requestStore,
  currentFilter,
  isActionModalOpen,
  selectedRequest,
  actionForm,
  isProcessing,
  changeFilter,
  formatCurrency,
  getStatusBadge,
  getStatusText,
  goToCreate,
  goToAction,
  closeActionModal,
  handleApprove,
  handleReject
} = useTransactionRequestList()

const headers = [
  { key: 'date', label: 'Fecha' },
  { key: 'client', label: 'Cliente / Propietario' },
  { key: 'type', label: 'Tipo' },
  { key: 'route', label: 'Ruta de Cambio' },
  { key: 'amount', label: 'Monto de Solicitud' },
  { key: 'status', label: 'Estado' },
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
          Buzón de <span class="text-gradient-primary">Solicitudes</span>
        </h1>
        <p class="text-white/30 text-xs font-bold uppercase tracking-[0.2em] mt-2 ml-4">Gestión de retiros e intercambios de clientes</p>
      </div>

      <div class="flex items-center gap-4">
        <!-- Filtros Rápidos Premium -->
        <div class="flex flex-wrap items-center bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner backdrop-blur-md gap-1">
          <button 
            v-for="f in [{v:'pending', l:'Pendientes', c:'primary'}, {v:'processed', l:'Procesadas', c:'success'}, {v:'rejected', l:'Rechazadas', c:'danger'}]" 
            :key="f.v"
            @click="changeFilter(f.v)" 
            :class="[
              'px-5 py-2 text-[0.65rem] font-black uppercase tracking-widest rounded-xl transition-all duration-300', 
              currentFilter === f.v 
                ? `bg-${f.c}/20 text-${f.c} border border-${f.c}/20 shadow-lg` 
                : 'text-white/20 hover:text-white/40'
            ]"
          >
            {{ f.l }}
          </button>
        </div>

        <button 
          @click="goToCreate" 
          class="bg-primary hover:bg-primary-dark text-secondary px-6 py-3.5 rounded-2xl font-black transition-all shadow-[0_10px_30px_rgba(247,166,0,0.2)] flex items-center gap-3 group active:scale-95"
        >
          <FontAwesomeIcon icon="fa-solid fa-plus-circle" class="text-lg group-hover:rotate-90 transition-transform duration-300" /> 
          <span>Nueva Solicitud</span>
        </button>
      </div>
    </div>

    <!-- Lista -->
    <BaseCard title="Solicitudes del Sistema" subtitle="Control de autorizaciones previas a la ejecución de movimientos financieros.">
      
      <div v-if="requestStore.requests.length === 0 && !requestStore.isLoading" class="flex flex-col items-center justify-center py-20 text-center animate-premium-in">
        <div class="w-20 h-20 bg-white/[0.02] rounded-full flex items-center justify-center mb-6 border border-white/5">
          <FontAwesomeIcon icon="fa-solid fa-inbox" class="text-4xl text-white/10" />
        </div>
        <h3 class="text-xl font-black text-white/40 tracking-tight">Bandeja Vacía</h3>
        <p class="text-sm text-white/20 mt-2 font-medium">No se han encontrado registros para el filtro "{{ getStatusText(currentFilter) }}".</p>
      </div>

      <BaseTable v-else :headers="headers" :data="requestStore.requests" :is-loading="requestStore.isLoading">
        <tr v-for="req in requestStore.requests" :key="req.id" class="group hover:bg-white/[0.01] transition-colors border-b border-white/[0.02] last:border-0">
          
          <!-- Fecha -->
          <td class="py-5">
            <div class="flex flex-col">
              <span class="text-xs font-bold text-white/80 tracking-tight leading-tight">{{ new Date(req.created_at).toLocaleDateString('es-VE') }}</span>
              <span class="text-[0.6rem] font-black text-white/20 uppercase tracking-widest mt-0.5">{{ new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
            </div>
          </td>

          <!-- Cliente -->
          <td>
            <div class="flex flex-col">
              <span class="text-sm font-bold text-white group-hover:text-primary transition-colors leading-tight">{{ req.client?.name || 'ENTIDAD DESCONOCIDA' }}</span>
              <span class="text-[0.65rem] font-mono text-white/20 uppercase tracking-tighter mt-0.5">REQ-{{ req.id.toString().padStart(6, '0') }}</span>
            </div>
          </td>

          <!-- Tipo -->
          <td>
            <div class="flex items-center gap-2">
              <span 
                class="px-2.5 py-1 rounded-lg text-[0.6rem] font-black uppercase tracking-[0.15em] border transition-all duration-300"
                :class="req.type === 'withdrawal' ? 'bg-danger/5 text-danger border-danger/20' : 'bg-info/5 text-info border-info/20'"
              >
                {{ req.type === 'withdrawal' ? 'RETIRO' : 'EXCHANGE' }}
              </span>
            </div>
          </td>

          <!-- Ruta -->
          <td>
            <div class="flex flex-col gap-1.5 py-2">
              <div class="flex items-center gap-2 group/route">
                <div class="w-1.5 h-1.5 rounded-full bg-white/10 group-hover/route:bg-primary transition-colors"></div>
                <span class="text-[0.65rem] font-bold text-white/40 group-hover/route:text-white/60 uppercase tracking-tight">{{ req.source_origin || 'ND' }}</span>
              </div>
              <div class="flex items-center gap-2 group/route">
                <div class="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                <span class="text-[0.65rem] font-black text-white/60 tracking-tight">{{ req.destination_target || 'ND' }}</span>
              </div>
            </div>
          </td>

          <!-- Monto -->
          <td>
            <div class="flex items-baseline gap-1 text-white group-hover:text-primary transition-colors">
              <span class="text-base font-black tracking-tighter">{{ formatCurrency(req.amount, req.currency_code).split('.')[0] }}</span>
              <span class="text-[0.65rem] font-bold opacity-30">.{{ formatCurrency(req.amount, req.currency_code).split('.')[1] || '00' }}</span>
              <span class="text-[0.55rem] font-black uppercase text-white/20 ml-1">{{ req.currency_code }}</span>
            </div>
          </td>

          <!-- Estado -->
          <td>
            <span 
              class="px-3 py-1.5 rounded-xl text-[0.65rem] font-black uppercase tracking-[0.2em] border transition-all"
              :class="getStatusBadge(req.status)"
            >
              {{ getStatusText(req.status) }}
            </span>
          </td>

          <!-- Acciones -->
          <td>
            <div class="flex justify-end pr-2 opacity-10 group-hover:opacity-100 transition-opacity duration-300">
                <button 
                  v-if="req.status === 'pending'" 
                  @click="goToAction(req)" 
                  class="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center transition-all hover:bg-primary hover:text-secondary shadow-lg active:scale-90"
                  title="Procesar Solicitud"
                >
                  <FontAwesomeIcon icon="fa-solid fa-bolt" />
                </button>
                <div v-else class="w-10 h-10 flex items-center justify-center text-white/10" :title="req.notes || 'Completada'">
                   <FontAwesomeIcon icon="fa-solid fa-check-double" v-if="req.status === 'processed'" class="text-success/20" />
                   <FontAwesomeIcon icon="fa-solid fa-ban" v-else class="text-danger/20" />
                </div>
            </div>
          </td>
        </tr>
      </BaseTable>
    </BaseCard>

    <!-- Modal de Acción Premium -->
    <BaseModal :show="isActionModalOpen" title="Autorización de Solicitud" @close="closeActionModal">
      <div v-if="selectedRequest" class="space-y-8 py-4">
        
        <!-- Resumen de Solicitud Card -->
        <div class="relative p-8 rounded-[2rem] bg-black/60 border border-white/5 overflow-hidden group">
           <div class="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-all duration-1000"></div>
           <div class="relative z-10 flex flex-col items-center text-center space-y-3">
              <div class="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[0.6rem] font-black text-white/40 uppercase tracking-[0.3em] mb-2">
                {{ selectedRequest.type === 'withdrawal' ? 'RETIRO DE CAPITAL' : 'INTERCAMBIO (EXCHANGE)' }}
              </div>
              <div class="flex flex-col">
                <span class="text-5xl font-black text-white tracking-tighter drop-shadow-2xl">
                  {{ formatCurrency(selectedRequest.amount, selectedRequest.currency_code) }}
                </span>
                <span class="text-[0.65rem] font-medium text-white/20 uppercase tracking-widest mt-2">DÉBITO PROYECTADO DESDE {{ selectedRequest.source_origin }}</span>
              </div>
           </div>
        </div>

        <!-- Meta Data Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 px-4">
           <div class="space-y-1">
              <label class="text-[0.55rem] font-black text-white/20 uppercase tracking-[0.2em] mb-1 block">Titular del Fondo</label>
              <p class="font-bold text-white tracking-tight leading-tight">{{ selectedRequest.client?.name }}</p>
           </div>
           <div class="text-right space-y-1">
              <label class="text-[0.55rem] font-black text-white/20 uppercase tracking-[0.2em] mb-1 block">Destino de Fondos</label>
              <p class="text-xs font-bold text-primary tracking-tight">{{ selectedRequest.destination_target || 'N/A' }}</p>
           </div>
        </div>

        <!-- Input de Notas Premium -->
        <div class="px-2">
          <BaseInput
            label="Instrucciones / Notas de Procesamiento"
            v-model="actionForm.notes"
            placeholder="Añade detalle sobre la plataforma o motivo de rechazo..."
            class="premium-input-large"
          />
        </div>

        <!-- Acciones de Modal -->
        <div class="flex gap-4 pt-6 border-t border-white/5">
           <button 
             @click="handleReject" 
             :disabled="isProcessing" 
             class="px-8 py-4 rounded-2xl bg-danger/10 text-danger font-black text-xs uppercase tracking-widest transition-all hover:bg-danger hover:text-white border border-danger/20 active:scale-95 disabled:opacity-50"
           >
             Rechazar
           </button>
           <button 
             @click="handleApprove" 
             :disabled="isProcessing" 
             class="flex-1 bg-success text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-success-dark hover:shadow-[0_10px_30px_rgba(14,203,129,0.3)] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
           >
             <FontAwesomeIcon v-if="isProcessing" icon="fa-solid fa-spinner" spin />
             {{ isProcessing ? 'CONSOLIDANDO...' : 'APROBAR E INICIAR FLUJO' }}
           </button>
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
</style>
