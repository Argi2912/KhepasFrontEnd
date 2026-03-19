<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTransactionRequestStore } from '@/stores/transactionRequest'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import alert from '@/services/alert'

const authStore = useAuthStore()
const requestStore = useTransactionRequestStore()
const router = useRouter()
const emit = defineEmits(['toggle-sidebar'])

const userRole = authStore.authUser?.roles[0]?.name || 'Usuario'

let pollingInterval = null

onMounted(() => {
  requestStore.fetchPendingCount()
  pollingInterval = setInterval(() => {
    requestStore.fetchPendingCount()
  }, 60000) // Cada 60 segundos
})

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval)
})

const goToRequests = () => {
  router.push({ name: 'transaction_requests_list' })
}

const confirmLogout = async () => {
  const confirmed = await alert.confirm(
    'Cerrar Sesión Segura',
    '¿Estás seguro de que deseas finalizar tu jornada de trabajo actual?',
  )
  if (confirmed) {
    authStore.logout()
  }
}
</script>

<template>
  <header class="h-[80px] bg-secondary/40 backdrop-blur-[40px] border-b border-white/5 flex justify-between items-center px-10 sticky top-0 z-[900] transition-all duration-700 shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden">
    
    <!-- Efecto ambiental sutil -->
    <div class="absolute -top-10 left-1/4 w-32 h-32 bg-primary/5 blur-[60px] pointer-events-none"></div>

    <div class="flex items-center flex-1 min-w-0 relative z-10">
      <button 
        @click="emit('toggle-sidebar')" 
        class="bg-white/5 border border-white/10 text-white/50 text-lg cursor-pointer transition-all mr-8 w-11 h-11 rounded-2xl flex items-center justify-center hover:bg-primary/10 hover:text-primary hover:border-primary/20 hover:shadow-[0_0_20px_rgba(247,166,0,0.15)] active:scale-90 group transition-all duration-500"
      >
        <FontAwesomeIcon icon="fa-solid fa-bars-staggered" class="group-hover:scale-110 transition-transform" />
      </button>
      
      <div class="flex flex-col">
        <div class="flex items-center gap-2 mb-0.5">
           <span class="w-1 h-3 bg-primary/50 rounded-full"></span>
           <span class="text-[0.6rem] text-white/30 uppercase tracking-[0.4em] font-black leading-none">Console / Core</span>
        </div>
        <span class="text-xl font-black text-white whitespace-nowrap overflow-hidden text-ellipsis leading-tight tracking-tight">
          {{ $route.meta.label || 'Sistemas Khepas' }}
        </span>
      </div>
    </div>

    <div class="flex items-center gap-8 shrink-0 relative z-10">
      
      <!-- Utilidades Rápidas -->
      <div class="hidden lg:flex items-center gap-2 pr-6 border-r border-white/5">
         <button class="w-9 h-9 rounded-xl bg-white/[0.02] text-white/20 flex items-center justify-center hover:bg-white/5 hover:text-white/60 transition-all border border-transparent hover:border-white/5">
            <FontAwesomeIcon icon="fa-solid fa-expand" class="text-xs" />
         </button>
         <button 
           @click="goToRequests"
           class="w-9 h-9 rounded-xl bg-white/[0.02] text-white/20 flex items-center justify-center hover:bg-white/5 hover:text-white/60 transition-all border border-transparent hover:border-white/5 relative"
           title="Solicitudes Pendientes"
         >
            <FontAwesomeIcon icon="fa-solid fa-bell" class="text-xs" />
            
            <!-- Badge de Notificación -->
            <span 
              v-if="requestStore.pendingCount > 0"
              class="absolute -top-1 -right-1 w-4 h-4 bg-danger text-white text-[0.6rem] font-black flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(246,70,93,0.5)] animate-bounce"
            >
              {{ requestStore.pendingCount > 9 ? '9+' : requestStore.pendingCount }}
            </span>
         </button>
      </div>

      <!-- Perfil Compacto Premium -->
      <div class="flex items-center gap-4 bg-white/[0.02] py-2 pl-5 pr-2.5 rounded-[22px] border border-white/5 transition-all hover:bg-white/[0.04] group cursor-pointer shadow-inner">
        <div class="flex flex-col items-end mr-1">
          <span class="text-[0.85rem] font-bold text-white leading-none mb-1 group-hover:text-primary transition-colors">{{ authStore.authUser?.name || 'Usuario' }}</span>
          <div class="flex items-center gap-1.5">
            <span class="w-1 w-1 bg-success/60 rounded-full"></span>
            <span class="text-[0.6rem] text-white/30 font-black tracking-widest uppercase">{{ userRole }}</span>
          </div>
        </div>
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-secondary font-black text-xs shadow-[0_5px_15px_rgba(247,166,0,0.3)] group-hover:scale-105 group-hover:rotate-3 transition-all duration-500">
          {{ authStore.authUser?.name?.charAt(0) || 'U' }}
        </div>
      </div>

      <!-- Logout Sophisticated -->
      <button 
        @click="confirmLogout" 
        class="bg-danger/10 border border-danger/10 text-danger w-11 h-11 rounded-2xl cursor-pointer flex items-center justify-center transition-all hover:bg-danger hover:text-white hover:shadow-[0_10px_25px_rgba(246,70,93,0.3)] active:scale-90 group duration-500" 
        title="Cerrar Seguridad"
      >
        <FontAwesomeIcon icon="fa-solid fa-power-off" class="group-hover:rotate-12 transition-transform" />
      </button>
    </div>
  </header>
</template>

<style scoped>
/* Glassmorphism optimized */
header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}
</style>