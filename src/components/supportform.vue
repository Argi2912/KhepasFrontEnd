<template>
  <div class="fixed bottom-8 right-8 z-[9999] flex flex-col items-end gap-4">
    <!-- Ventana de Chat (Glassmorphism) -->
    <Transition name="support-slide">
      <div v-if="supportStore.isOpen" class="w-[350px] h-[550px] bg-secondary/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-premium-in">
        
        <!-- Header Chat -->
        <div class="bg-gradient-to-r from-primary to-primary-dark p-5 text-secondary relative shrink-0">
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-white/20 blur-3xl rounded-full"></div>
          <div class="relative z-10 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center border border-white/20">
                <FontAwesomeIcon icon="fa-solid fa-headset" class="text-secondary" />
              </div>
              <div>
                <button v-if="supportStore.activeTicketId" @click="supportStore.activeTicketId = null" class="text-[0.6rem] font-bold uppercase tracking-widest opacity-70 flex items-center gap-1 hover:text-white transition-colors">
                  <FontAwesomeIcon icon="fa-solid fa-chevron-left" /> Mis Tickets
                </button>
                <h3 class="text-sm font-black tracking-tight leading-none">
                  {{ activeTicket ? activeTicket.subject : 'Soporte Khepas' }}
                </h3>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <!-- Botón de cerrrar para Admin si está abierto -->
              <button 
                v-if="authStore.isSuperAdmin && activeTicket && activeTicket.status === 'open'"
                @click="supportStore.closeTicket()"
                title="Cerrar Ticket"
                class="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
              >
                <FontAwesomeIcon icon="fa-solid fa-lock" class="text-xs" />
              </button>
              <button @click="supportStore.isOpen = false" class="hover:rotate-90 transition-transform">
                <FontAwesomeIcon icon="fa-solid fa-xmark" />
              </button>
            </div>
          </div>
        </div>

        <!-- Área Central -->
        <div ref="chatContainer" class="flex-grow overflow-y-auto p-5 space-y-4 custom-scrollbar">
          
          <!-- LISTA DE TICKETS (Si no hay ticket activo) -->
          <div v-if="!supportStore.activeTicketId" class="space-y-3">
            <div class="flex justify-between items-center mb-4">
              <p class="text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/30">Historial de Consultas</p>
              <button 
                v-if="!authStore.isSuperAdmin"
                @click="isCreatingTicket = true"
                class="text-[0.6rem] font-bold text-primary hover:underline uppercase tracking-widest"
              >
                + Nuevo Ticket
              </button>
            </div>

            <!-- Formulario Nuevo Ticket -->
            <div v-if="isCreatingTicket" class="bg-white/5 border border-primary/30 rounded-2xl p-4 animate-premium-in">
              <input v-model="newTicketSubject" placeholder="Asunto (ej. Error en retiro)" class="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white mb-2 focus:outline-none focus:border-primary/50" />
              <textarea v-model="newMessage" placeholder="Describe tu problema..." rows="3" class="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white resize-none focus:outline-none focus:border-primary/50"></textarea>
              <div class="flex gap-2 mt-2">
                <button @click="handleCreateTicket" :disabled="!newTicketSubject || !newMessage" class="flex-grow bg-primary text-secondary text-[0.6rem] font-black py-2 rounded-xl disabled:opacity-30">INICIAR TICKET</button>
                <button @click="isCreatingTicket = false" class="px-4 bg-white/5 text-white/50 text-[0.6rem] font-bold py-2 rounded-xl">CANCELAR</button>
              </div>
            </div>

            <div v-if="supportStore.tickets.length === 0 && !isCreatingTicket" class="flex flex-col items-center justify-center py-10 opacity-30">
              <FontAwesomeIcon icon="fa-solid fa-folder-open" class="text-3xl mb-3" />
              <p class="text-[0.7rem] font-bold uppercase tracking-widest">No hay tickets activos</p>
            </div>

            <div 
              v-for="ticket in supportStore.tickets" 
              :key="ticket.id"
              class="bg-white/5 border border-white/5 hover:border-primary/30 rounded-2xl p-4 cursor-pointer transition-all group relative overflow-hidden"
              @click="supportStore.activeTicketId = ticket.id"
            >
              <div class="flex justify-between items-start relative z-10">
                <div class="flex flex-col">
                  <span class="text-[0.5rem] font-black text-primary uppercase tracking-tighter mb-1">
                    {{ ticket.status === 'open' ? 'En Curso' : 'Resuelto' }}
                  </span>
                  <h4 class="text-xs font-black text-white group-hover:text-primary transition-colors">
                    {{ ticket.subject }} 
                    <span v-if="authStore.isSuperAdmin" class="text-white/40 text-[0.6rem] font-normal italic"> - {{ ticket.user?.name }}</span>
                  </h4>
                </div>
                <div v-if="ticket.status === 'open'" class="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              </div>
              <p class="text-[0.6rem] text-white/40 mt-1 uppercase tracking-tighter">Último contacto: {{ formatTime(ticket.last_message_at) }}</p>
            </div>
          </div>

          <!-- CHAT ACTIVO -->
          <template v-else>
            <div v-if="supportStore.messages.length === 0" class="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-30">
              <FontAwesomeIcon icon="fa-solid fa-spinner" class="text-4xl animate-spin" />
            </div>

            <div 
              v-for="msg in supportStore.messages" 
              :key="msg.id"
              class="flex flex-col"
              :class="isMe(msg) ? 'items-end' : 'items-start'"
            >
              <div 
                class="max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm"
                :class="isMe(msg) 
                  ? 'bg-primary text-secondary rounded-tr-none' 
                  : 'bg-white/5 text-white border border-white/5 rounded-tl-none'"
              >
                {{ msg.body }}
              </div>
              <span class="text-[0.5rem] font-medium text-white/30 mt-1 uppercase tracking-tighter mx-1">
                {{ formatTime(msg.created_at) }}
              </span>
            </div>

            <!-- Aviso de Ticket Cerrado -->
            <div v-if="activeTicket && activeTicket.status === 'closed'" class="bg-white/5 border border-white/10 rounded-2xl p-4 text-center mt-6">
              <FontAwesomeIcon icon="fa-solid fa-lock" class="text-primary mb-2" />
              <p class="text-[0.65rem] font-black text-white uppercase tracking-widest">Este ticket ha sido resuelto</p>
              <p class="text-[0.55rem] text-white/40 mt-1 italic">Para nuevas consultas, inicia un ticket adicional.</p>
            </div>
          </template>
        </div>

        <!-- Input o Footer -->
        <div v-if="supportStore.activeTicketId && activeTicket && activeTicket.status === 'open'" class="p-4 bg-white/[0.02] border-t border-white/5 shrink-0">
          <form @submit.prevent="handleSendMessage" class="relative group">
            <input 
              v-model="newMessage" 
              placeholder="Responder..." 
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
      
      <span v-if="supportStore.pendingCount > 0 && !supportStore.isOpen" class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-secondary flex items-center justify-center animate-bounce">
        {{ supportStore.pendingCount }}
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

const chatContainer = ref(null)
const newMessage = ref('')
const newTicketSubject = ref('')
const isCreatingTicket = ref(false)
let pollingInterval = null

const activeTicket = computed(() => {
  return supportStore.tickets.find(t => t.id === supportStore.activeTicketId)
})

const isMe = (msg) => msg.sender_id === authStore.user?.id

const toggleChat = () => {
  supportStore.isOpen = !supportStore.isOpen
  if (supportStore.isOpen) {
    supportStore.fetchTickets()
    scrollToBottom()
  }
}

const handleCreateTicket = async () => {
  if (!newTicketSubject.value.trim() || !newMessage.value.trim()) return
  try {
    await supportStore.sendMessage({
      subject: newTicketSubject.value,
      body: newMessage.value
    })
    isCreatingTicket.value = false
    newTicketSubject.value = ''
    newMessage.value = ''
    await nextTick()
    scrollToBottom()
  } catch (error) {}
}

const handleSendMessage = async () => {
  if (!newMessage.value.trim()) return
  
  try {
    const text = newMessage.value
    newMessage.value = ''
    await supportStore.sendMessage({ 
      body: text,
      ticket_id: supportStore.activeTicketId 
    })
    await nextTick()
    scrollToBottom()
  } catch (error) {
    newMessage.value = text 
  }
}

const scrollToBottom = () => {
  setTimeout(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  }, 100)
}

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const startPolling = () => {
  if (pollingInterval) return
  pollingInterval = setInterval(async () => {
    if (!supportStore.isOpen) return

    if (!supportStore.activeTicketId) {
      await supportStore.fetchTickets()
    } else if (activeTicket.value?.status === 'open') {
      const oldLength = supportStore.messages.length
      await supportStore.fetchMessages()
      if (supportStore.messages.length > oldLength) {
        await nextTick()
        scrollToBottom()
        supportStore.markRead()
      }
    }
    
    if (authStore.isSuperAdmin) {
      supportStore.fetchPendingCount()
    }
  }, 2500)
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

watch(() => supportStore.activeTicketId, (id) => {
  supportStore.messages = []
  if (id) {
    supportStore.fetchMessages()
    supportStore.markRead()
    scrollToBottom()
  }
})

onMounted(() => {
  if (authStore.isLoggedIn) {
    supportStore.fetchPendingCount()
    if (supportStore.isOpen) supportStore.fetchTickets()
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