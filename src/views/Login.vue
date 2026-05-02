<script setup>
import { reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import notify from '@/services/notify'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useRouter } from 'vue-router'
import { useFormValidation } from '@/utils/useFormValidation'
import BaseButton from '@/components/shared/BaseButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const { handleAxiosError, getError, clearError } = useFormValidation()

const form = reactive({
  email: '',
  password: '',
})

const isLoading = ref(false)

const handleLogin = async () => {
  if (!form.email || !form.password) {
    notify.warning('Identidad requerida: Email y clave.')
    return
  }

  isLoading.value = true
  try {
    await authStore.login(form)
    notify.success('Acceso autorizado. Bienvenido a TuConpay.')
    router.push({ name: 'dashboard' })
  } catch (error) {
    if (!handleAxiosError(error)) {
      notify.error('Credenciales no válidas o fallo en el sistema.')
    }
  } finally {
    isLoading.value = false
  }
}

const goBack = () => router.push({ name: 'landing' })
const goToRegister = () => router.push({ name: 'register' })
</script>

<template>
  <div class="login-page min-h-screen bg-[#0b0e11] flex overflow-hidden font-['Inter'] relative text-white">
    
    <!-- Ambient Lights (Matching Landing) -->
    <div class="ambient-light gold-light"></div>
    <div class="ambient-light blue-light"></div>

    <!-- Lado Izquierdo: Branding & Ecosistema (Desktop) -->
    <div class="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-20 overflow-hidden bg-black/20 backdrop-blur-3xl border-r border-white/5">
      <div class="relative z-10">
        <div class="flex items-center gap-4 mb-16 cursor-pointer" @click="goBack">
          <div class="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl p-2.5 overflow-hidden border border-white/10">
            <img src="@/assets/logo.jpg" alt="Logo" class="w-full h-full object-cover rounded-lg" />
          </div>
          <span class="text-3xl font-black tracking-tighter italic">TuConpay<span class="text-[#f0b90b]">.</span></span>
        </div>

        <div class="max-w-lg">
          <h2 class="text-6xl font-black leading-[1.1] mb-8 tracking-tight italic">
            El control <span class="text-[#f0b90b] uppercase">Definitivo</span> <br>de tu capital.
          </h2>
          <p class="text-slate-400 text-lg font-medium leading-relaxed mb-12">
            Accede a la consola de gestión financiera más robusta del mercado. Seguridad bancaria, multi-divisa y auditoría en tiempo real.
          </p>
          
          <div class="flex items-center gap-10">
            <div class="flex flex-col">
              <span class="text-[#f0b90b] text-2xl font-black italic tracking-tighter">99.9%</span>
              <span class="text-white/20 text-[0.6rem] font-black uppercase tracking-[0.2em] mt-1">Sincronización</span>
            </div>
            <div class="w-px h-8 bg-white/5"></div>
            <div class="flex flex-col">
              <span class="text-[#f0b90b] text-2xl font-black italic tracking-tighter">AES-256</span>
              <span class="text-white/20 text-[0.6rem] font-black uppercase tracking-[0.2em] mt-1">Protección</span>
            </div>
          </div>
        </div>
      </div>

      <div class="relative z-10 flex items-center gap-4 text-white/20 text-[0.6rem] font-black uppercase tracking-[0.4em]">
        <span class="w-2 h-px bg-white/10"></span>
        TuConpay Financial Engine V2.0
      </div>
    </div>

    <!-- Lado Derecho: Formulario de Acceso -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 relative">
      <div class="w-full max-w-[440px] relative z-10 animate-premium-in">
        
        <div class="mb-12">
          <!-- Logo para móvil -->
          <div class="lg:hidden flex items-center gap-3 mb-10">
            <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1.5 overflow-hidden border border-white/10">
               <img src="@/assets/logo.jpg" alt="Logo" class="w-full h-full object-cover rounded-lg" />
            </div>
            <span class="text-2xl font-black tracking-tighter italic">TuConpay.</span>
          </div>
          
          <h3 class="text-4xl font-black mb-3 tracking-tighter italic">Identificación<span class="text-[#f0b90b]">.</span></h3>
          <p class="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Bienvenido al Ecosistema Financiero</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div class="space-y-2">
            <label class="block text-[0.6rem] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Email Registrado</label>
            <div class="relative group">
              <div class="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#f0b90b] transition-colors duration-500">
                <FontAwesomeIcon :icon="['fas', 'at']" />
              </div>
              <input 
                v-model="form.email" 
                type="email" 
                placeholder="usuario@tuconpay.com" 
                required
                class="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-sm font-bold outline-none focus:border-[#f0b90b]/40 focus:bg-white/[0.05] transition-all"
                @input="clearError('email')"
              />
            </div>
            <span v-if="getError('email')" class="text-red-500 text-[0.65rem] ml-1 font-bold">{{ getError('email') }}</span>
          </div>

          <div class="space-y-2">
            <div class="flex justify-between items-center ml-1">
              <label class="block text-[0.6rem] font-black text-white/20 uppercase tracking-[0.3em]">Clave de Protocolo</label>
              <a href="#" class="text-[0.6rem] text-[#f0b90b]/60 hover:text-[#f0b90b] font-black uppercase tracking-widest transition-colors italic">Recuperar</a>
            </div>
            <div class="relative group">
              <div class="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#f0b90b] transition-colors duration-500">
                <FontAwesomeIcon :icon="['fas', 'lock']" />
              </div>
              <input 
                v-model="form.password" 
                type="password" 
                placeholder="••••••••" 
                required
                class="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-sm font-bold tracking-[0.3em] outline-none focus:border-[#f0b90b]/40 focus:bg-white/[0.05] transition-all"
                @input="clearError('password')"
              />
            </div>
            <span v-if="getError('password')" class="text-red-500 text-[0.65rem] ml-1 font-bold">{{ getError('password') }}</span>
          </div>

          <div class="pt-4">
            <button 
              type="submit"
              class="w-full h-16 bg-[#f0b90b] hover:bg-white text-black rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] transition-all shadow-[0_10px_30px_rgba(240,185,11,0.2)] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
              :disabled="isLoading"
            >
              <span v-if="!isLoading">Acceder al Sistema</span>
              <FontAwesomeIcon v-else :icon="['fas', 'circle-notch']" spin />
            </button>
          </div>
        </form>

        <div class="mt-12 pt-8 border-t border-white/5 space-y-8">
           <div class="text-center">
             <p class="text-white/20 text-[0.6rem] font-black uppercase tracking-[0.15em] mb-4">¿No tienes acceso al ecosistema?</p>
             <button @click="goToRegister" class="text-[#f0b90b] hover:text-white transition-colors text-xs font-black uppercase tracking-[0.2em] border-b border-[#f0b90b]/20 pb-1 hover:border-white">
                Crear Nueva Cuenta
             </button>
           </div>
           
           <div class="flex items-center justify-center gap-4">
              <button @click="goBack" class="text-[0.55rem] font-black text-white/10 hover:text-white/40 tracking-[0.3em] transition-colors uppercase italic">Regresar al inicio</button>
           </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.ambient-light {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.15;
  z-index: 0;
  pointer-events: none;
}

.gold-light {
  top: -100px;
  right: -100px;
  width: 500px;
  height: 500px;
  background: #f0b90b;
}

.blue-light {
  bottom: -100px;
  left: -100px;
  width: 600px;
  height: 600px;
  background: #1e88e5;
  opacity: 0.05;
}

@keyframes slideUpFade {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-premium-in {
  animation: slideUpFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

input {
  backdrop-filter: blur(10px);
}
</style>