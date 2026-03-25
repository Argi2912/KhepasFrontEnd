<script setup>
import { reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import notify from '@/services/notify'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useRouter } from 'vue-router'
import { useFormValidation } from '@/utils/useFormValidation'
import BaseButton from '@/components/shared/BaseButton.vue'
import BaseModal from '@/components/shared/BaseModal.vue'
import PayPalButton from '@/components/shared/PayPalButton.vue'


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
const showPayPal = ref(false)
const registrationData = ref(null)

const handleRegister = async () => {
  if (!acceptedTerms.value) {
    notify.error('Protocolo de Privacidad requerido: Debes aceptar los términos.')
    return
  }

  isLoading.value = true
  try {
    const response = await authStore.register(form)
    registrationData.value = response.data || response

    if (form.plan === 'free') {
      const url = registrationData.value.url
      if (url) {
        notify.success('¡Ecosistema Creado! Iniciando despliegue de prueba...')
        setTimeout(() => { window.location.href = url }, 1000)
      }
    } else {
      // Para planes pagos, mostramos el botón de PayPal
      showPayPal.value = true
      notify.success('Ecosistema pre-configurado. Procede con el pago para activar.')
    }
  } catch (error) {
    if (!handleAxiosError(error)) {
      notify.error('Fallo en el registro del ecosistema laboral.')
    }
  } finally {
    isLoading.value = false
  }
}

const handlePaymentSuccess = () => {
  notify.success('¡Pago completado con éxito! Redirigiendo...')
  // Aquí el backend ya debería haber capturado la orden si usamos el flujo recomendado
  // Pero para este ejemplo, redirigimos al success page que manejará la verificación
  const tenant_id = registrationData.value.tenant_id || registrationData.value.id
  setTimeout(() => {
    router.push({ name: 'payment-success', query: { tenant_id } })
  }, 1500)
}

const goToLogin = () => router.push({ name: 'login' })
</script>

<template>
  <div class="min-h-screen bg-secondary flex overflow-hidden font-sans relative">
    
    <!-- Lado Izquierdo: Branding (Desktop) -->
    <div class="hidden lg:flex lg:w-1/3 relative flex-col justify-between p-16 overflow-hidden bg-[#0a0b0d] border-r border-white/5">
      <div class="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-success/10 blur-[120px] rounded-full animate-pulse"></div>
      <div class="absolute inset-0 opacity-[0.02]" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 40px 40px;"></div>

      <div class="relative z-10">
        <div class="flex items-center gap-4 mb-20">
          <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1 overflow-hidden shadow-xl">
            <img src="@/assets/logo.jpg" alt="Logo" class="w-full h-full object-cover rounded-lg" />
          </div>
          <span class="text-xl font-black text-white tracking-tighter">TuConpay.</span>
        </div>

        <div class="max-w-xs">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/20 mb-6">
             <span class="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
             <span class="text-[0.55rem] font-black text-success uppercase tracking-[0.2em]">Registro Abierto</span>
          </div>
          <h2 class="text-5xl font-black text-white leading-[1.1] mb-8 tracking-tight">
            Crea tu propio <span class="text-gradient-primary">Ecosistema</span>.
          </h2>
          <p class="text-white/30 text-sm font-medium leading-relaxed">
            Inicia hoy la transformación de tu negocio. Gestión multi-cliente, auditoría en tiempo real y seguridad bancaria unificada.
          </p>
        </div>
      </div>

      <div class="relative z-10 flex flex-col gap-6">
         <div class="flex items-center gap-4 text-white/20 text-[0.55rem] font-black uppercase tracking-[0.4em]">
           <span class="w-2 h-px bg-white/10"></span>
           Trusted by 500+ Nodes
         </div>
      </div>
    </div>

    <!-- Lado Derecho: Formulario de Registro -->
    <div class="w-full lg:w-2/3 flex flex-col bg-secondary relative">
      <!-- Navbar móvil / Header formulario -->
      <div class="p-8 lg:px-16 lg:py-10 flex justify-between items-center border-b border-white/5 bg-secondary/50 backdrop-blur-xl sticky top-0 z-20">
        <div class="flex items-center gap-4 lg:hidden">
            <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 overflow-hidden">
              <img src="@/assets/logo.jpg" alt="Logo" class="w-full h-full object-cover rounded-md" />
            </div>
            <span class="text-lg font-black text-white tracking-tighter">TuConpay.</span>
        </div>
        
        <div class="hidden lg:block">
           <h3 class="text-xl font-black text-white tracking-tight">Nueva Implementación.</h3>
           <p class="text-white/20 text-[0.6rem] font-black uppercase tracking-[0.2em]">Paso Único de Configuración</p>
        </div>

        <button @click="goToLogin" class="text-white/40 hover:text-primary transition-colors text-[0.6rem] font-black uppercase tracking-[0.2em] flex items-center gap-2 group">
           ¿Ya tienes cuenta? 
           <span class="text-primary group-hover:underline decoration-2 underline-offset-4 font-black">Iniciar Acceso</span>
        </button>
      </div>

      <!-- Formulario con Scroll -->
      <div class="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-16">
        <div class="max-w-[700px] mx-auto animate-premium-in">
          
          <form @submit.prevent="handleRegister" class="space-y-16 pb-20">
            
            <!-- Bloque 1: Identidad -->
            <section class="space-y-8">
               <div class="flex items-center gap-4">
                  <span class="text-[0.6rem] font-black text-primary/40 uppercase tracking-[0.4em]">01. Identidad Fiscal</span>
                  <div class="h-px bg-white/5 grow"></div>
               </div>
               
               <div class="space-y-4">
                <label class="block text-[0.6rem] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Razón o Nombre Comercial</label>
                <div class="relative group">
                  <div class="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-primary transition-all duration-500">
                    <FontAwesomeIcon icon="fa-solid fa-building-circle-check" />
                  </div>
                  <input 
                    v-model="form.company_name" 
                    type="text" 
                    placeholder="Ej. Cambio Seguro Global LLC" 
                    required 
                    class="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-sm font-bold placeholder:text-white/5 outline-none focus:border-primary/40 focus:bg-white/[0.04] focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                    @input="clearError('company_name')" 
                  />
                </div>
                <span v-if="getError('company_name')" class="text-danger text-[0.65rem] ml-1 font-bold">{{ getError('company_name') }}</span>
              </div>
            </section>

            <!-- Bloque 2: Administrador -->
            <section class="space-y-8">
               <div class="flex items-center gap-4">
                  <span class="text-[0.6rem] font-black text-info/40 uppercase tracking-[0.4em]">02. Master Admin</span>
                  <div class="h-px bg-white/5 grow"></div>
               </div>
               
               <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="space-y-3">
                  <label class="block text-[0.6rem] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Nombre Completo</label>
                  <input v-model="form.admin_name" type="text" placeholder="Tu identidad" required class="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 px-6 text-white text-sm font-bold placeholder:text-white/5 outline-none focus:border-info/40 focus:bg-white/[0.04] transition-all" />
                </div>
                <div class="space-y-3">
                  <label class="block text-[0.6rem] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Contacto Corporativo</label>
                  <input v-model="form.admin_email" type="email" placeholder="admin@empresa.com" required class="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 px-6 text-white text-sm font-bold placeholder:text-white/5 outline-none focus:border-info/40 focus:bg-white/[0.04] transition-all" />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="space-y-3">
                  <label class="block text-[0.6rem] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Clave Maestra</label>
                  <input v-model="form.password" type="password" placeholder="••••••••" required class="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 px-6 text-white text-sm font-bold tracking-[0.3em] outline-none focus:border-info/40 focus:bg-white/[0.04] transition-all" />
                </div>
                <div class="space-y-3">
                  <label class="block text-[0.6rem] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Confirmar Cifrado</label>
                  <input v-model="form.password_confirmation" type="password" placeholder="••••••••" required class="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 px-6 text-white text-sm font-bold tracking-[0.3em] outline-none focus:border-info/40 focus:bg-white/[0.04] transition-all" />
                </div>
              </div>
            </section>

            <!-- Bloque 3: Nivel de Alcance -->
            <section class="space-y-8">
              <div class="flex items-center gap-4">
                  <span class="text-[0.6rem] font-black text-success/40 uppercase tracking-[0.4em]">03. Nivel de Alcance</span>
                  <div class="h-px bg-white/5 grow"></div>
               </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <!-- Plan Card Adaptado -->
                <div 
                  v-for="plan in [{id:'free', n:'Gratis', p:'0.00', t:'/30d'}, {id:'basic', n:'Básico', p:'10.00', t:'/mes'}, {id:'pro', n:'Pro', p:'29.99', t:'/mes'}]" 
                  :key="plan.id"
                  @click="form.plan = plan.id"
                  class="relative p-6 rounded-3xl border cursor-pointer transition-all duration-500 overflow-hidden group"
                  :class="form.plan === plan.id ? 'bg-primary/5 border-primary/40 shadow-xl' : 'bg-white/[0.02] border-white/5 hover:border-white/10'"
                >
                  <div v-if="form.plan === plan.id" class="absolute top-0 right-0 p-2">
                     <div class="w-1.5 h-1.5 bg-primary rounded-full animate-ping"></div>
                  </div>
                  <h4 class="text-white text-sm font-black mb-1">{{ plan.n }}</h4>
                  <p class="text-primary text-xl font-black">${{ plan.p }}<span class="text-[0.55rem] text-white/20 ml-1">{{ plan.t }}</span></p>
                </div>
              </div>
            </section>

            <!-- Finalizar -->
            <div class="pt-8 flex flex-col items-center gap-8">
              <label class="flex items-start gap-4 cursor-pointer group max-w-md">
                <input type="checkbox" v-model="acceptedTerms" class="mt-1 w-6 h-6 rounded-lg bg-white/5 border-white/10 accent-primary text-primary" />
                <span class="text-[0.65rem] font-bold text-white/30 uppercase tracking-tight leading-relaxed group-hover:text-white/50 transition-colors">
                  Acepto el <a @click.prevent="showTermsModal = true" class="text-primary hover:underline">Aviso de Privacidad</a> y los protocolos de seguridad industrial de TuConpay.
                </span>
              </label>

              <BaseButton 
                v-if="!showPayPal"
                class="!w-full !h-16 !rounded-2xl !text-sm !font-black !tracking-[0.2em] !uppercase border border-primary/20"
                @click="handleRegister" 
                :disabled="isLoading || !acceptedTerms"
              >
                <template v-if="!isLoading">Implementar Ecosistema</template>
                <template v-else><div class="w-5 h-5 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin"></div></template>
              </BaseButton>

              <!-- Botón de PayPal (SDK) -->
              <div v-if="showPayPal" class="w-full space-y-4 animate-premium-in">
                <div class="p-4 bg-primary/5 border border-primary/20 rounded-2xl mb-4 text-center">
                  <p class="text-[0.6rem] font-black text-primary uppercase tracking-[0.2em]">Pagar Plan {{ form.plan.toUpperCase() }}</p>
                </div>
                <PayPalButton 
                  :amount="form.plan === 'pro' ? '29.99' : '10.00'" 
                  :planId="form.plan"
                  :description="`Plan ${form.plan} - TuConpay`"
                  @success="handlePaymentSuccess"
                />
                <button @click="showPayPal = false" class="text-white/20 hover:text-white text-[0.55rem] font-black uppercase tracking-[0.2em] transition-colors">
                  ← Volver a editar datos
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
    
    <!-- Modal de Términos y Condiciones -->
    <BaseModal :show="showTermsModal" title="Privacidad y Seguridad" @close="showTermsModal = false">
      <div class="space-y-6 text-white/70 text-sm leading-relaxed px-2">
        <p class="italic text-white/30 text-[0.6rem] uppercase tracking-widest">Última actualización: 12 de marzo de 2026</p>
        
        <div class="space-y-4">
          <p>
            En <strong class="text-white">Productos Digitales SyO LLC</strong>, valoramos la privacidad de nuestros usuarios. Esta Política de Privacidad describe cómo tratamos la información en la aplicación <strong class="text-primary">Tu Conpay</strong>.
          </p>
          <p>
            Al utilizar nuestros servicios, usted acepta las prácticas descritas en este documento.
          </p>
        </div>

        <div class="space-y-4 py-4 border-t border-white/5">
          <h4 class="text-primary font-black uppercase tracking-[0.2em] text-[0.65rem]">01. Recolección de Información</h4>
          <p>Para el funcionamiento de la App, recolectamos dos tipos de datos:</p>
          <ul class="space-y-3">
            <li class="flex gap-3">
              <span class="text-primary mt-1">•</span>
              <span><strong class="text-white">Datos de Cuenta:</strong> Información básica para la creación del perfil (nombre, correo electrónico y datos de autenticación).</span>
            </li>
            <li class="flex gap-3">
              <span class="text-primary mt-1">•</span>
              <span><strong class="text-white">Datos de Transacciones:</strong> Información que el Usuario introduce manualmente sobre sus operaciones de corretaje o P2P (montos, divisas, nombres de contrapartes, fechas).</span>
            </li>
          </ul>
        </div>

        <div class="space-y-4 py-4 border-t border-white/5">
          <h4 class="text-primary font-black uppercase tracking-[0.2em] text-[0.65rem]">02. Uso de la Información</h4>
          <p>Nuestra filosofía es de acceso mínimo. La información se utiliza exclusivamente para:</p>
          <ul class="space-y-3">
            <li class="flex gap-3"><span class="text-primary">•</span> <span>Proporcionar las funciones de registro solicitadas.</span></li>
            <li class="flex gap-3"><span class="text-primary">•</span> <span>Generar reportes y estadísticas privadas.</span></li>
            <li class="flex gap-3"><span class="text-primary">•</span> <span>Brindar soporte técnico bajo petición expresa.</span></li>
          </ul>
          
          <div class="bg-primary/5 p-6 rounded-2xl border border-primary/20 mt-6 group transition-all hover:bg-primary/10">
            <p class="text-primary text-[0.7rem] font-bold leading-relaxed">
              <strong class="uppercase tracking-widest block mb-2 underline decoration-2 underline-offset-4">Garantía de Privacidad:</strong>
              Productos Digitales SyO LLC NO vende, NO alquila, NO intercambia ni utiliza los datos de sus transacciones para fines publicitarios o de marketing. Sus datos le pertenecen exclusivamente a usted.
            </p>
          </div>
        </div>

        <div class="space-y-4 py-4 border-t border-white/5">
          <h4 class="text-primary font-black uppercase tracking-[0.2em] text-[0.65rem]">03. Seguridad de Nivel Bancario</h4>
          <p>Implementamos medidas de seguridad de nivel industrial:</p>
          <ul class="space-y-3">
            <li class="flex gap-3">
              <span class="text-primary mt-1">•</span>
              <span><strong class="text-white">Cifrado:</strong> Datos cifrados en tránsito (SSL/TLS) y en reposo.</span>
            </li>
            <li class="flex gap-3">
              <span class="text-primary mt-1">•</span>
              <span><strong class="text-white">Acceso Restringido:</strong> Solo personal autorizado tiene acceso limitado bajo petición.</span>
            </li>
          </ul>
        </div>

        <div class="space-y-4 py-4 border-t border-white/5">
          <h4 class="text-primary font-black uppercase tracking-[0.2em] text-[0.65rem]">04. Control del Usuario</h4>
          <p>Usted es el dueño de su información en todo momento:</p>
          <ul class="space-y-3 flex flex-wrap gap-2">
            <li class="bg-white/5 px-4 py-2 rounded-xl text-white font-bold text-[0.6rem] uppercase tracking-wider">Acceder y Exportar</li>
            <li class="bg-white/5 px-4 py-2 rounded-xl text-white font-bold text-[0.6rem] uppercase tracking-wider">Rectificar Datos</li>
            <li class="bg-white/5 px-4 py-2 rounded-xl text-white font-bold text-[0.6rem] uppercase tracking-wider">Eliminación Definitiva</li>
          </ul>
        </div>

        <div class="pt-6 border-t border-white/5">
          <p class="text-[0.65rem] text-white/30 text-center">
            Dudas: <span class="text-primary/60 font-black">admin@tuconpay.com</span>
          </p>
        </div>
      </div>
      <template #footer>
        <BaseButton @click="showTermsModal = false" class="!w-full !h-12 !rounded-xl !text-xs !uppercase !tracking-widest">Entendido</BaseButton>
      </template>
    </BaseModal>
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
.text-gradient-primary {
  background: linear-gradient(135deg, #f7a600, #ffdf6d);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
