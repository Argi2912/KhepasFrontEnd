<template>
  <div class="fixed bottom-8 right-8 z-[9999] flex flex-col items-end gap-4">
    <!-- Ventana de Chat (Glassmorphism) -->
    <Transition name="support-slide">
      <div v-if="supportStore.isOpen" class="w-[350px] h-[500px] bg-secondary/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-premium-in">
        
        <!-- Header Chat -->
        <div class="bg-gradient-to-r from-primary to-primary-dark p-5 text-secondary relative shrink-0">
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-white/20 blur-3xl rounded-full"></div>
          <div class="relative z-10 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center border border-white/20">
                <FontAwesomeIcon icon="fa-solid fa-headset" class="text-secondary" />
              </div>
              <div v-if="authStore.isSuperAdmin && supportStore.activeUserId">
                <button @click="supportStore.activeUserId = null" class="text-[0.6rem] font-bold uppercase tracking-widest opacity-70 flex items-center gap-1 hover:text-white transition-colors">
                  <FontAwesomeIcon icon="fa-solid fa-chevron-left" /> Volver a lista
                </button>
                <h3 class="text-sm font-black tracking-tight leading-none mt-1">Chat con Usuario</h3>
              </div>
              <div v-else>
                <h3 class="text-sm font-black tracking-tight leading-none">Soporte Khepas</h3>
                <p class="text-[0.6rem] font-bold uppercase tracking-widest opacity-70 mt-1 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                  Operativo 24/7
                </p>
              </div>
            </div>
            <button @click="supportStore.isOpen = false" class="hover:rotate-90 transition-transform">
              <FontAwesomeIcon icon="fa-solid fa-xmark" />
            </button>
          </div>
        </div>

        <!-- Área de Conversación o Lista de Hilos -->
        <div ref="chatContainer" class="flex-grow overflow-y-auto p-5 space-y-4 custom-scrollbar">
          
          <!-- LISTA DE HILOS (Solo Super Admin si no hay chat activo) -->
          <div v-if="authStore.isSuperAdmin && !supportStore.activeUserId" class="space-y-2">
            <p class="text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/30 mb-4 text-center">Mensajes Pendientes</p>
            <div v-if="supportStore.pendingThreads.length === 0" class="flex flex-col items-center justify-center h-full opacity-30 mt-10">
              <FontAwesomeIcon icon="fa-solid fa-check-double" class="text-3xl mb-3" />
              <p class="text-[0.7rem] font-bold uppercase tracking-widest">Sin pendientes por hoy</p>
            </div>
            <div 
              v-for="thread in supportStore.pendingThreads" 
              :key="thread.user_id"
              class="bg-white/5 border border-white/5 hover:border-primary/30 rounded-2xl p-4 cursor-pointer transition-all group"
              @click="supportStore.activeUserId = thread.user_id"
            >
              <div class="flex justify-between items-start">
                <h4 class="text-xs font-black text-white group-hover:text-primary transition-colors">{{ thread.sender?.name || 'Usuario Desconocido' }}</h4>
                <span class="px-1.5 py-0.5 bg-primary/20 text-primary text-[0.55rem] font-black rounded-md">{{ thread.count }}</span>
              </div>
              <p class="text-[0.6rem] text-white/40 mt-1 uppercase tracking-tighter">Último: {{ formatTime(thread.last_message_at) }}</p>
            </div>
          </div>

          <!-- MODO CHAT ACTIVO -->
          <template v-else>
            <div v-if="supportStore.messages.length === 0" class="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-30">
              <FontAwesomeIcon icon="fa-solid fa-comments" class="text-4xl" />
              <p class="text-[0.7rem] font-medium uppercase tracking-widest">Inicia una conversación</p>
            </div>

            <div 
              v-for="msg in supportStore.messages" 
              :key="msg.id"
              class="flex flex-col"
              :class="isMe(msg) ? 'items-end' : 'items-start'"
            >
              <div 
                class="max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed"
                :class="isMe(msg) 
                  ? 'bg-primary text-secondary rounded-tr-none' 
                  : 'bg-white/5 text-white border border-white/5 rounded-tl-none'"
              >
                {{ msg.body }}
              </div>
              <span class="text-[0.55rem] font-medium text-white/30 mt-1 uppercase tracking-tighter mx-1">
                {{ formatTime(msg.created_at) }}
              </span>
            </div>
          </template>
        </div>

        <!-- Input de Mensaje (Solo si hay chat activo o no es Admin) -->
        <div v-if="!authStore.isSuperAdmin || supportStore.activeUserId" class="p-4 bg-white/[0.02] border-t border-white/5 shrink-0">
          <form @submit.prevent="handleSendMessage" class="relative group">
            <input 
              v-model="newMessage" 
              placeholder="Escribe tu duda aquí..." 
              required 
              class="w-full bg-white/5 border border-white/10 rounded-2xl pl-5 pr-12 py-3.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
            />
            <button 
              type="submit" 
              :disabled="!newMessage.trim() || supportStore.isLoading"
              class="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-primary text-secondary rounded-xl flex items-center justify-center disabled:opacity-30 disabled:grayscale transition-all hover:scale-105 active:scale-95"
            >
              <FontAwesomeIcon icon="fa-solid fa-paper-plane" class="text-xs" />
            </button>
          </form>
        </div>
      </div>
    </Transition>

    <!-- Botón Flotante (FAB) -->
    <button 
      @click="toggleChat" 
      class="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl relative group"
      :class="supportStore.isOpen ? 'bg-white text-secondary rotate-90' : 'bg-primary text-secondary hover:scale-110 active:scale-90'"
    >
      <span v-if="!supportStore.isOpen" class="absolute inset-0 rounded-full bg-primary animate-ping opacity-20 pointer-events-none"></span>
      <FontAwesomeIcon :icon="supportStore.isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-comments'" class="text-2xl" />
      
      <!-- Indicador de Notificación -->
      <span v-if="hasUnread && !supportStore.isOpen" class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-secondary flex items-center justify-center animate-bounce">
        1
      </span>

      <span v-if="!supportStore.isOpen" class="absolute right-20 bg-secondary px-4 py-2 rounded-xl text-[0.65rem] font-black text-white uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 shadow-xl pointer-events-none">
        Chat de Soporte
      </span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useSupportStore } from '@/stores/support'
import { useAuthStore } from '@/stores/auth'

const supportStore = useSupportStore()
const authStore = useAuthStore()

// Ya no usamos ref local, usamos el store
// const isOpen = ref(false)
const chatContainer = ref(null)
const newMessage = ref('')
let pollingInterval = null

const hasUnread = computed(() => {
  // Simplificación: si el último mensaje no es mío y el chat está cerrado
  const lastMsg = supportStore.messages[supportStore.messages.length - 1]
  return lastMsg && lastMsg.sender_id !== authStore.user?.id && !supportStore.isOpen
})

const isMe = (msg) => msg.sender_id === authStore.user?.id

const toggleChat = () => {
  supportStore.isOpen = !supportStore.isOpen
  if (supportStore.isOpen) {
    scrollToBottom()
    supportStore.markRead() // Marca como leídos al abrir
  }
}

const handleSendMessage = async () => {
  if (!newMessage.value.trim()) return
  
  try {
    const text = newMessage.value
    newMessage.value = ''
    await supportStore.sendMessage({ body: text })
    await nextTick()
    scrollToBottom()
  } catch (error) {
    newMessage.value = text // Recuperar si falla
  }
}

const scrollToBottom = () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const startPolling = () => {
  if (pollingInterval) return
  pollingInterval = setInterval(async () => {
    const oldLength = supportStore.messages.length
    
    if (authStore.isSuperAdmin && !supportStore.activeUserId) {
      await supportStore.fetchPendingThreads()
    } else {
      await supportStore.fetchMessages()
      if (supportStore.messages.length > oldLength) {
        await nextTick()
        scrollToBottom()
      }
    }
    
    // Conteo global de la campanita
    if (authStore.isSuperAdmin) {
      supportStore.fetchPendingCount()
    }
  }, 2000) // 2 segundos para mayor fluidez
}

const stopPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
}

watch(() => supportStore.isOpen, (val) => {
  if (val) startPolling()
  else stopPolling()
})

// Si el Admin cambia de hilo (usuario activo), limpiamos y recargamos
watch(() => supportStore.activeUserId, () => {
  supportStore.messages = []
  if (supportStore.isOpen) {
    supportStore.fetchMessages()
  }
})

onMounted(() => {
  if (authStore.isLoggedIn) {
    supportStore.fetchMessages()
  }
})

onUnmounted(() => stopPolling())
</script>

<style scoped>
.support-slide-enter-active,
.support-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.support-slide-enter-from,
.support-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
  filter: blur(10px);
}

.animate-premium-in {
  animation: premiumIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes premiumIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>