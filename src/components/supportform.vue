<template>
  <div class="fixed bottom-8 right-8 z-[9999] flex flex-col items-end gap-4">
    <!-- Card de Soporte (Glassmorphism) -->
    <Transition name="support-slide">
      <div v-if="isOpen" class="w-[320px] bg-secondary/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden animate-premium-in">
        <!-- Header Premium -->
        <div class="bg-gradient-to-r from-primary to-primary-dark p-6 text-secondary relative overflow-hidden">
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-white/20 blur-3xl rounded-full"></div>
          <div class="relative z-10">
            <h3 class="text-lg font-black tracking-tight flex items-center gap-2">
              <FontAwesomeIcon icon="fa-brands fa-whatsapp" class="text-xl" />
              Soporte Directo
            </h3>
            <p class="text-[0.65rem] font-bold uppercase tracking-widest opacity-70 mt-1">Conexión prioritaria activa</p>
          </div>
        </div>

        <!-- Body -->
        <form @submit.prevent="handleWhatsApp" class="p-6 space-y-5">
          <div class="space-y-1.5">
            <label class="text-[0.6rem] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Asunto del Ticket</label>
            <input 
              v-model="form.subject" 
              placeholder="Ej: Error en reporte de cierre" 
              required 
              class="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-[0.6rem] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Descripción del Problema</label>
            <textarea 
              v-model="form.message" 
              placeholder="Describe detalladamente lo ocurrido..." 
              required 
              rows="3"
              class="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all resize-none"
            ></textarea>
          </div>

          <button 
            type="submit" 
            class="w-full bg-primary hover:bg-primary-dark text-secondary font-black py-4 rounded-2xl transition-all shadow-lg shadow-primary/20 active:scale-95 flex items-center justify-center gap-3 group"
          >
            <span>Enviar a WhatsApp</span>
            <FontAwesomeIcon icon="fa-solid fa-paper-plane" class="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
          
          <p class="text-center text-[0.6rem] font-medium text-white/10 uppercase tracking-tighter">
            Tu identidad y empresa serán adjuntadas automáticamente
          </p>
        </form>
      </div>
    </Transition>

    <!-- Botón Flotante (FAB) -->
    <button 
      @click="isOpen = !isOpen" 
      class="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl relative group"
      :class="isOpen ? 'bg-white text-secondary rotate-90' : 'bg-primary text-secondary hover:scale-110 active:scale-90'"
    >
      <!-- Pulso Animado (solo si cerrado) -->
      <span v-if="!isOpen" class="absolute inset-0 rounded-full bg-primary animate-ping opacity-20 pointer-events-none"></span>
      
      <FontAwesomeIcon :icon="isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-headset'" class="text-2xl transition-transform duration-500" />
      
      <!-- Tooltip -->
      <span v-if="!isOpen" class="absolute right-20 bg-secondary px-4 py-2 rounded-xl text-[0.65rem] font-black text-white uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 shadow-xl pointer-events-none">
        ¿Necesitas Ayuda?
      </span>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import notify from '@/services/notify'

const isOpen = ref(false)
const form = ref({ subject: '', message: '' })

const handleWhatsApp = () => {
    const phone = "584120212878"

    const userData = JSON.parse(localStorage.getItem('user') || '{}')
    const userName = userData.name || 'Invitado'
    const tenantName = userData.tenant?.name || 'N/A'
    const userEmail = userData.email || 'N/A'

    const text =
        `*🚀 NUEVO TICKET DE SOPORTE*%0A` +
        `--------------------------------%0A` +
        `👤 *Usuario:* ${userName}%0A` +
        `🏢 *Empresa:* ${tenantName}%0A` +
        `📧 *Correo:* ${userEmail}%0A` +
        `--------------------------------%0A` +
        `❓ *Asunto:* ${form.value.subject}%0A` +
        `📝 *Mensaje:* ${form.value.message}%0A` +
        `--------------------------------%0A` +
        `_Enviado desde el Ecosistema TuConpay_`;

    const url = `https://wa.me/${phone}?text=${text}`
    
    // Abrir en una ventana emergente pequeña para no "salir" del sistema
    const width = 600;
    const height = 700;
    const left = (window.innerWidth / 2) - (width / 2);
    const top = (window.innerHeight / 2) - (height / 2);
    
    window.open(
      url, 
      'WhatsAppSupport', 
      `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=yes`
    );

    notify.info('Sincronizando con WhatsApp... El ticket se abrirá en una ventana emergente.')
    
    form.value = { subject: '', message: '' }
    isOpen.value = false
}
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
</style>