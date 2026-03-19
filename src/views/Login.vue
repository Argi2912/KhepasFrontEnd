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
    notify.success('Acceso autorizado. Bienvenid@ al ecosistema.')
  } catch (error) {
    if (!handleAxiosError(error)) {
      notify.error('Credenciales no válidas o fallo en nodo central.')
    }
  } finally {
    isLoading.value = false
  }
}

const goBack = () => router.push({ name: 'landing' })
const goToRegister = () => router.push({ name: 'register' })
</script>

  <div class="min-h-screen bg-secondary flex overflow-hidden font-sans relative">
    
    <!-- Lado Izquierdo: Branding & Atmósfera (Visible solo en desktop) -->
    <div class="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-20 overflow-hidden bg-[#0a0b0d]">
      <!-- Efectos de fondo dinámicos -->
      <div class="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-primary/10 blur-[120px] rounded-full animate-pulse"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-info/5 blur-[100px] rounded-full"></div>
      
      <!-- Grid decorativa sutil -->
      <div class="absolute inset-0 opacity-[0.03]" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 40px 40px;"></div>

      <div class="relative z-10">
        <div class="flex items-center gap-4 mb-16">
          <div class="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <FontAwesomeIcon icon="fa-solid fa-bolt" class="text-secondary text-xl" />
          </div>
          <span class="text-2xl font-black text-white tracking-tighter">TuConpay<span class="text-primary">.</span></span>
        </div>

        <div class="max-w-lg">
          <h2 class="text-6xl font-black text-white leading-[1.1] mb-8 tracking-tight">
            Gestión <span class="text-primary">Evolucionada</span> de Activos Digitales.
          </h2>
          <p class="text-white/40 text-lg font-medium leading-relaxed mb-12">
            La consola de auditoría y control de caja más potente del mercado. Multitenancy real, seguridad de grado militar y flujos automatizados.
          </p>
          
          <div class="flex items-center gap-10">
            <div class="flex flex-col">
              <span class="text-white text-2xl font-black italic tracking-tighter">99.9%</span>
              <span class="text-white/20 text-[0.6rem] font-black uppercase tracking-[0.2em] mt-1">Sincronización</span>
            </div>
            <div class="w-px h-8 bg-white/5"></div>
            <div class="flex flex-col">
              <span class="text-white text-2xl font-black italic tracking-tighter">AES-256</span>
              <span class="text-white/20 text-[0.6rem] font-black uppercase tracking-[0.2em] mt-1">Encriptación</span>
            </div>
          </div>
        </div>
      </div>

      <div class="relative z-10 flex items-center gap-4 text-white/20 text-[0.6rem] font-black uppercase tracking-[0.4em]">
        <span class="w-2 h-px bg-white/10"></span>
        Core Node V4.0 / Stable Build
      </div>
    </div>

    <!-- Lado Derecho: Formulario de Acceso -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 bg-secondary relative">
      <!-- Decoración para móvil -->
      <div class="lg:hidden absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div class="absolute -top-[20%] -right-[20%] w-[80%] h-[80%] bg-primary/10 blur-[100px] rounded-full"></div>
      </div>

      <div class="w-full max-w-[440px] relative z-10 animate-premium-in">
        
        <div class="mb-12">
          <div class="lg:hidden flex items-center gap-3 mb-8">
            <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon="fa-solid fa-bolt" class="text-secondary text-base" />
            </div>
            <span class="text-xl font-black text-white tracking-tighter">TuConpay.</span>
          </div>
          <h3 class="text-4xl font-black text-white mb-3 tracking-tighter">Acceso de Auditor.</h3>
          <p class="text-white/30 text-sm font-bold uppercase tracking-widest">Ingresa tus credenciales de nodo</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div class="space-y-2">
            <label class="block text-[0.6rem] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Identidad Digital</label>
            <div class="relative group">
              <div class="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-primary transition-colors duration-500">
                <FontAwesomeIcon icon="fa-solid fa-at" />
              </div>
              <input 
                v-model="form.email" 
                type="email" 
                placeholder="admin@tuconpay.com" 
                required
                class="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-sm font-bold placeholder:text-white/5 outline-none focus:border-primary/40 focus:bg-white/[0.04] focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                @input="clearError('email')"
              />
            </div>
            <span v-if="getError('email')" class="text-danger text-[0.65rem] ml-1 font-bold">{{ getError('email') }}</span>
          </div>

          <div class="space-y-2">
            <div class="flex justify-between items-center ml-1">
              <label class="block text-[0.6rem] font-black text-white/20 uppercase tracking-[0.3em]">Clave de Protocolo</label>
              <a href="#" class="text-[0.6rem] text-primary/40 hover:text-primary font-black uppercase tracking-widest transition-colors tracking-tighter italic">Recuperar</a>
            </div>
            <div class="relative group">
              <div class="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-primary transition-colors duration-500">
                <FontAwesomeIcon icon="fa-solid fa-lock-open" />
              </div>
              <input 
                v-model="form.password" 
                type="password" 
                placeholder="••••••••" 
                required
                class="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-sm font-bold tracking-[0.3em] placeholder:text-white/5 outline-none focus:border-primary/40 focus:bg-white/[0.04] focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                @input="clearError('password')"
              />
            </div>
            <span v-if="getError('password')" class="text-danger text-[0.65rem] ml-1 font-bold">{{ getError('password') }}</span>
          </div>

          <div class="pt-4">
            <BaseButton 
              class="w-full h-16 !rounded-2xl !text-sm !font-black !tracking-[0.2em] !uppercase border border-primary/20 hover:border-primary/50 transition-all flex items-center justify-center gap-3"
              @click="handleLogin"
              :disabled="isLoading"
            >
              <span v-if="!isLoading">Sincronizar Nodo</span>
              <div v-else class="w-5 h-5 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
            </BaseButton>
          </div>
        </form>

        <div class="mt-12 pt-8 border-t border-white/5 space-y-8">
           <div class="text-center">
             <p class="text-white/20 text-[0.6rem] font-black uppercase tracking-[0.15em] mb-4">¿Sin autorización en el ecosistema?</p>
             <button @click="goToRegister" class="text-primary hover:text-white transition-colors text-xs font-black uppercase tracking-[0.2em] border-b border-primary/20 pb-1 hover:border-white">
                Crear Nuevo Nodo
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
@keyframes slideUpFade {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-premium-in {
  animation: slideUpFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Efecto de cristal para inputs */
input {
  backdrop-filter: blur(10px);
}
</style>