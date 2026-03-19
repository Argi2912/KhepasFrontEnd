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

<template>
  <div class="flex items-center justify-center min-h-screen bg-background relative overflow-hidden">
    <!-- Atmósfera Premium -->
    <div class="absolute -top-[10%] -right-[5%] w-[40%] h-[40%] bg-primary/10 blur-[150px] animate-pulse rounded-full"></div>
    <div class="absolute -bottom-[10%] -left-[5%] w-[40%] h-[40%] bg-info/5 blur-[150px] rounded-full"></div>

    <div class="glass-panel p-12 md:p-16 w-full max-w-[500px] rounded-[48px] shadow-[0_50px_120px_rgba(0,0,0,0.8)] animate-premium-in border border-white/10 relative overflow-hidden z-10 mx-4">
      
      <!-- Logo Central Premium -->
      <div class="text-center mb-12 relative z-10">
        <div class="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-[28px] flex items-center justify-center shadow-[0_15px_35px_rgba(247,166,0,0.3)] mx-auto mb-8 group overflow-hidden">
          <div class="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <FontAwesomeIcon icon="fa-solid fa-bolt" class="text-secondary text-3xl group-hover:scale-125 transition-transform duration-700" />
        </div>
        <h1 class="text-white text-5xl font-black m-0 tracking-tighter leading-none mb-4">
          TuConpay<span class="text-primary">.</span>
        </h1>
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
           <span class="w-1.5 h-1.5 rounded-full bg-primary/60 shadow-[0_0_8px_rgba(247,166,0,0.5)]"></span>
           <span class="text-[0.65rem] font-black text-white/30 uppercase tracking-[0.3em]">Consola de Acceso Seguro</span>
        </div>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-8 relative z-10">
        <!-- Identificador -->
        <div class="space-y-3">
          <label class="block text-white/30 text-[0.65rem] font-black uppercase tracking-[0.25em] ml-1">Identidad Digital</label>
          <div 
            class="bg-white/[0.03] border border-white/10 rounded-2xl flex items-center px-6 transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 group h-16 shadow-inner"
            :class="{ '!border-danger/50 !ring-danger/5': getError('email') }"
          >
            <FontAwesomeIcon icon="fa-solid fa-at" class="text-white/10 group-focus-within:text-primary transition-colors" />
            <input 
              v-model="form.email" 
              type="email" 
              placeholder="admin@tuconpay.com" 
              required 
              class="bg-transparent border-none text-white w-full outline-none text-[0.95rem] ml-4 font-bold placeholder:text-white/10"
              @input="clearError('email')"
            />
          </div>
          <span v-if="getError('email')" class="text-danger text-[0.7rem] ml-1 block font-bold">{{ getError('email') }}</span>
        </div>

        <!-- Clave Segura -->
        <div class="space-y-3">
          <div class="flex justify-between items-end ml-1">
            <label class="block text-white/30 text-[0.65rem] font-black uppercase tracking-[0.25em]">Clave de Acceso</label>
            <a href="#" class="text-[0.65rem] text-primary/40 hover:text-primary font-black uppercase tracking-widest transition-colors mb-0.5">Recuperar</a>
          </div>
          <div 
            class="bg-white/[0.03] border border-white/10 rounded-2xl flex items-center px-6 transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 group h-16 shadow-inner"
            :class="{ '!border-danger/50 !ring-danger/5': getError('password') }"
          >
            <FontAwesomeIcon icon="fa-solid fa-lock-open" class="text-white/10 group-focus-within:text-primary transition-colors" />
            <input 
              v-model="form.password" 
              type="password" 
              placeholder="••••••••" 
              required 
              class="bg-transparent border-none text-white w-full outline-none text-[0.95rem] ml-4 font-bold tracking-[0.3em] placeholder:text-white/10"
              @input="clearError('password')"
            />
          </div>
          <span v-if="getError('password')" class="text-danger text-[0.7rem] ml-1 block font-bold">{{ getError('password') }}</span>
        </div>

        <!-- Botón Central Premium -->
        <BaseButton class="w-full h-16 !rounded-3xl !text-lg !font-black !tracking-tight" @click="handleLogin" :disabled="isLoading">
          <span v-if="!isLoading">Autenticar Entrada</span>
          <span v-else class="flex items-center gap-3">
             <div class="w-5 h-5 border-[3px] border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
             Sincronizando Nodo...
          </span>
        </BaseButton>
      </form>

      <!-- Footer Alternativo -->
      <div class="text-center mt-16 text-white/30 text-xs relative z-10 font-bold uppercase tracking-[0.1em]">
        <p>¿No estás registrado? <span @click="goToRegister" class="text-primary font-black cursor-pointer hover:underline underline-offset-8">Crear Ecosistema</span></p>
        
        <div class="mt-12 flex items-center justify-center gap-4 opacity-50 hover:opacity-100 transition-opacity">
           <div class="h-px w-8 bg-white/10"></div>
           <button @click="goBack" class="text-[0.65rem] font-black flex items-center gap-2 hover:text-white transition-colors">
              INICIO
           </button>
           <div class="h-px w-8 bg-white/10"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass-panel {
  background: rgba(10, 10, 12, 0.4);
  backdrop-filter: blur(50px);
}
</style>