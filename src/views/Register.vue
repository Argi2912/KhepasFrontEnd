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
  company_name: '',
  admin_name: '',
  admin_email: '',
  password: '',
  password_confirmation: '',
  plan: 'free',
  method: 'paypal',
})

const isLoading = ref(false)
const acceptedTerms = ref(false)
const showTermsModal = ref(false)

const handleRegister = async () => {
  if (!acceptedTerms.value) {
    notify.error('Protocolo de Privacidad requerido: Debes aceptar los términos.')
    return
  }

  isLoading.value = true
  try {
    const response = await authStore.register(form)
    const url = response.data?.url || response.url

    if (url) {
      const successMsg = form.plan === 'free'
          ? '¡Ecosistema Creado! Iniciando despliegue de prueba...'
          : 'Redirigiendo a Pasarela de Pago Segura...'

      notify.success(successMsg)
      setTimeout(() => { window.location.href = url }, 1000)
    }
  } catch (error) {
    if (!handleAxiosError(error)) {
      notify.error('Fallo en el registro del ecosistema laboral.')
    }
  } finally {
    isLoading.value = false
  }
}

const goToLogin = () => router.push({ name: 'login' })
</script>

<template>
  <div class="flex justify-center items-center min-h-screen bg-background relative overflow-hidden px-4 py-20">
    <!-- Atmósfera Premium -->
    <div class="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/10 blur-[180px] rounded-full"></div>
    <div class="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-success/5 blur-[150px] rounded-full"></div>

    <div class="glass-panel p-12 md:p-20 rounded-[56px] w-full max-w-[850px] shadow-[0_60px_150px_rgba(0,0,0,0.8)] animate-premium-in relative z-10 border border-white/10">
      
      <div class="text-center mb-16 relative">
        <div class="inline-flex items-center gap-3 bg-primary/10 px-5 py-2 rounded-full border border-primary/20 text-primary text-[0.7rem] font-black uppercase tracking-[0.3em] mb-6 shadow-xl">
           <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
           Nueva Implementación
        </div>
        <h2 class="text-5xl font-black text-white mb-4 tracking-tighter leading-tight">Crea tu Ecosistema <span class="text-gradient-primary">Pro</span></h2>
        <p class="text-white/40 font-bold max-w-lg mx-auto text-sm uppercase tracking-widest leading-relaxed">
          Control absoluto multi-divisa, gestión de cajas físicas y auditoría pericial.
        </p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-12">
        
        <!-- Sección Empresa -->
        <div class="space-y-8">
           <div class="flex items-center gap-4">
              <span class="text-[0.65rem] font-black text-primary uppercase tracking-[0.4em]">Identidad Fiscal</span>
              <div class="h-px bg-white/5 grow"></div>
           </div>
           
           <div class="space-y-4">
            <label class="block text-[0.65rem] font-black text-white/30 uppercase tracking-[0.25em] ml-1">Razón o Nombre Comercial</label>
            <div 
              class="bg-white/[0.03] border border-white/10 rounded-2xl flex items-center px-6 transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 group h-16 shadow-inner"
              :class="{ '!border-danger/50 !ring-danger/5': getError('company_name') }"
            >
              <FontAwesomeIcon icon="fa-solid fa-building-circle-check" class="text-white/10 group-focus-within:text-primary transition-colors" />
              <input 
                v-model="form.company_name" 
                type="text" 
                placeholder="Ej. Cambio Seguro Global LLC" 
                required 
                class="w-full bg-transparent border-none text-white outline-none ml-4 text-[0.95rem] font-bold placeholder:text-white/10"
                @input="clearError('company_name')" 
              />
            </div>
          </div>
        </div>

        <!-- Sección Admin -->
        <div class="space-y-8">
           <div class="flex items-center gap-4">
              <span class="text-[0.65rem] font-black text-info uppercase tracking-[0.4em]">Protocolo de Master Admin</span>
              <div class="h-px bg-white/5 grow"></div>
           </div>
           
           <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-4">
              <label class="block text-[0.65rem] font-black text-white/30 uppercase tracking-[0.25em] ml-1">Nombre Completo</label>
              <div class="bg-white/[0.03] border border-white/10 rounded-2xl flex items-center px-6 h-16 group focus-within:border-primary/50 transition-all shadow-inner">
                <FontAwesomeIcon icon="fa-solid fa-signature" class="text-white/10 group-focus-within:text-primary" />
                <input v-model="form.admin_name" type="text" placeholder="Tu identidad" required class="w-full bg-transparent border-none text-white outline-none ml-4 text-[0.95rem] font-bold placeholder:text-white/10" />
              </div>
            </div>
            <div class="space-y-4">
              <label class="block text-[0.65rem] font-black text-white/30 uppercase tracking-[0.25em] ml-1">Contacto Corporativo</label>
              <div class="bg-white/[0.03] border border-white/10 rounded-2xl flex items-center px-6 h-16 group focus-within:border-primary/50 transition-all shadow-inner">
                <FontAwesomeIcon icon="fa-solid fa-envelope-circle-check" class="text-white/10 group-focus-within:text-primary" />
                <input v-model="form.admin_email" type="email" placeholder="admin@empresa.com" required class="w-full bg-transparent border-none text-white outline-none ml-4 text-[0.95rem] font-bold placeholder:text-white/10" />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-4">
              <label class="block text-[0.65rem] font-black text-white/30 uppercase tracking-[0.25em] ml-1">Definir Clave</label>
              <div class="bg-white/[0.03] border border-white/10 rounded-2xl flex items-center px-6 h-16 group focus-within:border-primary/50 transition-all shadow-inner">
                <FontAwesomeIcon icon="fa-solid fa-user-shield" class="text-white/10 group-focus-within:text-primary" />
                <input v-model="form.password" type="password" placeholder="••••••••" required class="w-full bg-transparent border-none text-white outline-none ml-4 text-[0.95rem] font-bold tracking-[0.3em] placeholder:text-white/10" />
              </div>
            </div>
            <div class="space-y-4">
              <label class="block text-[0.65rem] font-black text-white/30 uppercase tracking-[0.25em] ml-1">Confirmar Protocolo</label>
              <div class="bg-white/[0.03] border border-white/10 rounded-2xl flex items-center px-6 h-16 group focus-within:border-primary/50 transition-all shadow-inner">
                <FontAwesomeIcon icon="fa-solid fa-lock" class="text-white/10 group-focus-within:text-primary" />
                <input v-model="form.password_confirmation" type="password" placeholder="••••••••" required class="w-full bg-transparent border-none text-white outline-none ml-4 text-[0.95rem] font-bold tracking-[0.3em] placeholder:text-white/10" />
              </div>
            </div>
          </div>
        </div>

        <!-- Selección de Plan Premium -->
        <div class="space-y-8">
          <div class="flex items-center gap-4">
              <span class="text-[0.65rem] font-black text-success uppercase tracking-[0.4em]">Nivel de Alcance Técnico</span>
              <div class="h-px bg-white/5 grow"></div>
           </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <!-- Plan Gratis -->
            <div 
              class="relative bg-white/[0.03] border border-white/10 p-8 rounded-[32px] cursor-pointer transition-all hover:border-primary/40 group overflow-hidden"
              :class="{ '!border-primary/50 !bg-primary/5 shadow-2xl': form.plan === 'free' }" 
              @click="form.plan = 'free'"
            >
              <div v-if="form.plan === 'free'" class="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(247,166,0,1)]"></div>
              <div class="relative z-10">
                <div class="text-[0.65rem] font-black text-white/20 uppercase mb-6 tracking-[0.2em] group-hover:text-primary transition-colors">EXPLORER</div>
                <h3 class="text-xl font-black text-white mb-1 tracking-tight">Prueba</h3>
                <p class="text-3xl font-black text-primary">$0<span class="text-[0.65rem] text-white/20 font-bold ml-2 lowercase tracking-tighter">/siempre</span></p>
                <div class="h-px bg-white/5 my-6"></div>
                <ul class="space-y-3">
                  <li class="flex items-center text-[0.65rem] font-bold text-white/40 uppercase tracking-tighter"><FontAwesomeIcon icon="fa-solid fa-check-double" class="text-primary mr-2" /> 30 Días Full</li>
                </ul>
              </div>
            </div>

            <!-- Otros planes simplificados para el ejemplo -->
            <div 
              class="relative bg-white/[0.03] border border-white/10 p-8 rounded-[32px] cursor-pointer transition-all hover:border-primary/40 group overflow-hidden"
              :class="{ '!border-primary/50 !bg-primary/5 shadow-2xl': form.plan === 'pro' }" 
              @click="form.plan = 'pro'"
            >
              <div v-if="form.plan === 'pro'" class="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(247,166,0,1)]"></div>
              <div class="relative z-10">
                <div class="text-[0.65rem] font-black text-white/20 uppercase mb-6 tracking-[0.2em] group-hover:text-primary transition-colors">ELITE</div>
                <h3 class="text-xl font-black text-white mb-1 tracking-tight">Especialista</h3>
                <p class="text-3xl font-black text-primary">$19<span class="text-[0.65rem] text-white/20 font-bold ml-2 lowercase tracking-tighter">/mensual</span></p>
                <div class="h-px bg-white/5 my-6"></div>
                <ul class="space-y-3">
                  <li class="flex items-center text-[0.65rem] font-bold text-white/40 uppercase tracking-tighter"><FontAwesomeIcon icon="fa-solid fa-check-double" class="text-primary mr-2" /> Usuarios ilim.</li>
                </ul>
              </div>
            </div>

            <!-- Master -->
             <div 
              class="relative bg-white/[0.03] border border-primary/20 p-8 rounded-[32px] cursor-pointer transition-all hover:border-primary/40 group overflow-hidden"
              :class="{ '!border-primary !bg-primary/10 shadow-2xl': form.plan === 'master' }" 
              @click="form.plan = 'pro'"
            >
               <div class="absolute top-0 right-0 bg-primary text-secondary text-[0.6rem] font-black px-4 py-1 rounded-bl-xl uppercase tracking-[0.1em]">MASTER</div>
              <div class="relative z-10">
                <div class="text-[0.65rem] font-black text-white/20 uppercase mb-6 tracking-[0.2em] group-hover:text-primary transition-colors">HOLDING</div>
                <h3 class="text-xl font-black text-white mb-1 tracking-tight">Corporativo</h3>
                <p class="text-3xl font-black text-primary">$49<span class="text-[0.65rem] text-white/20 font-bold ml-2 lowercase tracking-tighter">/mensual</span></p>
                <div class="h-px bg-white/5 my-6"></div>
                <ul class="space-y-3">
                  <li class="flex items-center text-[0.65rem] font-bold text-white/40 uppercase tracking-tighter"><FontAwesomeIcon icon="fa-solid fa-crown" class="text-primary mr-2" /> Soporte VIP</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Cierre de Protocolo -->
        <div class="pt-12 border-t border-white/10 flex flex-col items-center gap-10">
          <div class="flex flex-col items-center gap-6">
            <label class="flex items-center gap-4 text-sm text-white/40 cursor-pointer group">
              <input type="checkbox" v-model="acceptedTerms" class="w-8 h-8 cursor-pointer bg-white/5 border-white/20 rounded-xl accent-primary transition-all shadow-inner" />
              <span class="group-hover:text-white transition-colors tracking-tight font-bold text-xs uppercase tracking-[0.1em] text-center max-w-sm">
                Confirmo haber leído y aceptado el <a @click.prevent="showTermsModal = true" class="text-primary hover:underline">Aviso de Privacidad y Protocolo de Uso</a>.
              </span>
            </label>

            <BaseButton 
              class="!w-[400px] !h-16 !rounded-3xl !text-lg !font-black" 
              @click="handleRegister" 
              :disabled="isLoading || !acceptedTerms"
            >
              <template v-if="!isLoading">
                {{ form.plan === 'free' ? 'Desplegar Ecosistema' : 'Confirmar Implementación' }}
              </template>
              <template v-else>
                <div class="w-5 h-5 border-[3px] border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
              </template>
            </BaseButton>
          </div>

          <p class="text-center font-bold text-[0.7rem] uppercase tracking-[0.2em] text-white/30">
            ¿Ya posees credenciales? 
            <a class="text-primary cursor-pointer hover:underline ml-4" @click="goToLogin">Sincronizar Acceso</a>
          </p>
        </div>
      </form>
    </div>

    <!-- El resto del modal se mantiene igual por ahora, ya está adaptado -->
  </div>
</template>

<style scoped>
.glass-panel {
  background: rgba(10, 10, 12, 0.4);
  backdrop-filter: blur(60px);
}
.text-gradient-primary {
  background: linear-gradient(135deg, #f7a600, #f0b90b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
