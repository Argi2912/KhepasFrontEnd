<template>
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" @click="$emit('close')"></div>
      <div class="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
        <div class="absolute top-0 right-0 p-4">
          <button @click="$emit('close')" class="text-slate-400 hover:text-white transition-colors">
            <XIcon class="w-6 h-6" />
          </button>
        </div>
        
        <div class="space-y-6 relative z-10">
          <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
            <UsersIcon class="w-8 h-8 text-primary" />
          </div>
          
          <div class="space-y-2">
            <h3 class="text-2xl font-['Outfit'] font-bold text-white">Únete a la Comunidad</h3>
            <p class="text-slate-400 text-sm leading-relaxed">
              Sé parte de las más de 147 personas que ya están transformando su relación con el dinero bajo el sistema TuConpay.
            </p>
          </div>

          <div class="space-y-4">
            <a href="https://wa.me/your-number" target="_blank" class="w-full bg-primary hover:bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-primary/10">
              <MessageCircleIcon class="w-5 h-5" />
              WhatsApp de Espera
            </a>
            <p class="text-[10px] text-center text-slate-500 uppercase tracking-widest font-black">Próximamente acceso directo</p>
          </div>
        </div>

        <!-- Decorative background -->
        <div class="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { X as XIcon, Users as UsersIcon, MessageCircle as MessageCircleIcon } from 'lucide-vue-next'

defineProps({
  show: Boolean
})

defineEmits(['close'])
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
