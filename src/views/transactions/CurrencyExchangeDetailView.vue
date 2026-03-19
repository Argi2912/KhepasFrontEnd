<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { downloadTransactionReceipt } from '@/utils/download'

const route = useRoute()
const router = useRouter()
const tx = ref(null)
const loading = ref(true)
const showDebug = ref(false)

// --- COMPUTEDS INTELIGENTES (Detectan CamelCase o snake_case) ---
const getRel = (obj, camelKey) => {
  if (!obj) return null
  if (obj[camelKey]) return obj[camelKey]
  const snakeKey = camelKey.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
  if (obj[snakeKey]) return obj[snakeKey]
  return null
}

const fromAccount = computed(() => getRel(tx.value, 'fromAccount') || {})
const toAccount = computed(() => getRel(tx.value, 'toAccount') || {})
const client = computed(() => getRel(tx.value, 'client') || {})
const adminUser = computed(() => getRel(tx.value, 'adminUser') || {})
const provider = computed(() => getRel(tx.value, 'provider') || {})
const broker = computed(() => getRel(tx.value, 'broker') || {})
const brokerUser = computed(() => broker.value.user || {})

// --- LÓGICA DE VISUALIZACIÓN ---
const operationType = computed(() => {
  if (tx.value?.operation_type) return tx.value.operation_type
  if (tx.value?.buy_rate && parseFloat(tx.value.buy_rate) !== parseFloat(tx.value.exchange_rate)) {
    return 'purchase'
  }
  return 'exchange'
})

const commissionCurrency = computed(() => {
  if (operationType.value === 'purchase') {
    return toAccount.value.currency_code || 'USD'
  }
  return fromAccount.value.currency_code || 'USD'
})

const exchangeRateDetails = computed(() => {
  if (!tx.value) return {}
  if (operationType.value === 'purchase') {
    return {
      title: 'Ingeniería de Tasas',
      rate1: { label: 'Costo (Base)', value: tx.value.buy_rate || tx.value.exchange_rate },
      rate2: { label: 'Venta (Cliente)', value: tx.value.received_rate || '---' },
      usedRate: tx.value.buy_rate || tx.value.exchange_rate,
    }
  }
  return {
    title: 'Tasa Operativa',
    rate1: { label: 'Tasa Unificada', value: tx.value.exchange_rate },
    rate2: null,
    usedRate: tx.value.exchange_rate,
  }
})

const netProfit = computed(() => {
  if (!tx.value) return 0
  const charged = parseFloat(tx.value.commission_total_amount || tx.value.commission_charged_amount || 0)
  const providerCost = parseFloat(tx.value.commission_provider_amount || 0)
  const adminCost = parseFloat(tx.value.commission_admin_amount || 0)
  return (charged - providerCost - adminCost).toFixed(2)
})

// --- API ---
onMounted(async () => {
  try {
    const { data } = await api.get(`/transactions/exchanges/${route.params.id}`)
    tx.value = data
  } catch (e) {
    console.error(e)
    router.push({ name: 'transaction_exchange_list' })
  } finally {
    loading.value = false
  }
})

const formatMoney = (val) => parseFloat(val || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const handleDownload = async () => {
  if (tx.value?.id) {
    await downloadTransactionReceipt(tx.value.id, 'exchange')
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto py-10 px-4 animate-premium-in">
    
    <!-- Shimmer Loader -->
    <div v-if="loading" class="space-y-8">
      <div class="h-20 w-full bg-white/5 rounded-[2rem] animate-pulse"></div>
      <div class="h-96 w-full bg-white/5 rounded-[3rem] animate-pulse"></div>
    </div>

    <div v-else-if="tx" class="space-y-10">
      
      <!-- Top Action Bar -->
      <div class="flex justify-between items-center">
        <button @click="router.back()" class="flex items-center gap-3 text-white/30 hover:text-white transition-colors group">
           <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all">
             <FontAwesomeIcon icon="fa-solid fa-arrow-left" />
           </div>
           <span class="text-xs font-black uppercase tracking-widest">Regresar al Listado</span>
        </button>

        <div class="flex gap-4">
           <button @click="handleDownload" class="w-10 h-10 rounded-xl bg-white/5 text-white/40 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all" title="Imprimir Comprobante">
             <FontAwesomeIcon icon="fa-solid fa-print" />
           </button>
           <button @click="handleDownload" class="w-10 h-10 rounded-xl bg-white/5 text-white/40 flex items-center justify-center hover:bg-danger/20 hover:text-danger transition-all" title="Descargar PDF">
             <FontAwesomeIcon icon="fa-solid fa-file-pdf" />
           </button>
        </div>
      </div>

      <!-- Voucher Premium -->
      <div class="relative bg-white/[0.02] border border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
        <div class="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[100px] rounded-full -mr-48 -mt-48"></div>
        
        <!-- Header del Comprobante -->
        <div class="p-10 md:p-14 border-b border-white/5 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <span class="px-3 py-1 rounded-lg bg-primary/20 text-primary text-[0.6rem] font-black uppercase tracking-widest border border-primary/20">
                  {{ operationType === 'purchase' ? 'COMPRA DE DIVISA' : 'INTERCAMBIO OPERATIVO' }}
                </span>
                <span class="text-white/20 font-mono text-xs">#{{ tx.number }}</span>
              </div>
              <h2 class="text-4xl font-black text-white tracking-tighter">Comprobante de <span class="text-gradient-primary">Liquidación</span></h2>
              <div class="flex items-center gap-4 text-xs font-bold text-white/30">
                <span class="flex items-center gap-2">
                  <FontAwesomeIcon icon="fa-solid fa-calendar" class="text-primary/40" />
                  {{ new Date(tx.created_at).toLocaleDateString('es-VE') }}
                </span>
                <span class="flex items-center gap-2">
                  <FontAwesomeIcon icon="fa-solid fa-clock" class="text-primary/40" />
                  {{ new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                </span>
              </div>
            </div>

            <div class="text-center md:text-right">
               <div :class="['px-6 py-2 rounded-2xl text-[0.65rem] font-black uppercase tracking-[0.2em] border', tx.status === 'completed' ? 'bg-success/5 text-success border-success/20 shadow-[0_0_20px_rgba(14,203,129,0.1)]' : 'bg-warning/5 text-warning border-warning/20']">
                  {{ tx.status ? tx.status.toUpperCase() : 'CONSOLIDADO' }}
               </div>
            </div>
        </div>

        <!-- Cuerpo del Comprobante -->
        <div class="p-10 md:p-14 space-y-16 relative z-10">
          
          <!-- Meta Data Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
             <div class="space-y-1.5">
                <label class="text-[0.6rem] font-black text-white/20 uppercase tracking-[0.3em] block">Entidad Cliente</label>
                <p class="text-lg font-black text-white tracking-tight">{{ client.name || '---' }}</p>
                <p class="text-[0.6rem] font-bold text-white/10 uppercase tracking-widest">Identificador: {{ client.id || 'N/D' }}</p>
             </div>
             <div class="space-y-1.5">
                <label class="text-[0.6rem] font-black text-white/20 uppercase tracking-[0.3em] block">Socio / Broker</label>
                <p class="text-base font-bold text-white/80 group flex items-center gap-2">
                  {{ brokerUser.name || 'Liquidación Directa' }}
                  <FontAwesomeIcon v-if="brokerUser.name" icon="fa-solid fa-award" class="text-primary/40 text-xs" />
                </p>
             </div>
             <div class="space-y-1.5">
                <label class="text-[0.6rem] font-black text-white/20 uppercase tracking-[0.3em] block">Auditor del Sistema</label>
                <p class="text-base font-bold text-white/80">{{ adminUser.name || 'Procesamiento Automático' }}</p>
             </div>
          </div>

          <!-- Flujo de Fondos Visual -->
          <div class="py-10">
             <div class="flex flex-col md:flex-row items-center justify-between gap-12 md:gap-4 relative">
                <!-- Origen -->
                <div class="flex-1 w-full p-8 rounded-[2.5rem] bg-black/40 border border-white/5 group hover:border-danger/20 transition-all duration-500">
                   <div class="flex items-center gap-3 mb-4">
                      <div class="w-8 h-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center text-xs">
                        <FontAwesomeIcon icon="fa-solid fa-arrow-up" />
                      </div>
                      <span class="text-[0.6rem] font-black text-white/20 uppercase tracking-[0.2em]">Origen de Fondos</span>
                   </div>
                   <p class="text-xs font-bold text-white/40 mb-1 uppercase tracking-tight">{{ fromAccount.name || 'Origen' }}</p>
                   <div class="flex items-baseline gap-2">
                      <span class="text-3xl font-black text-danger tracking-tighter">- {{ formatMoney(tx.amount_sent).split(',')[0] }}</span>
                      <span class="text-sm font-bold text-danger opacity-40">,{{ formatMoney(tx.amount_sent).split(',')[1] }}</span>
                      <span class="text-[0.6rem] font-black text-white/20 uppercase ml-1">{{ fromAccount.currency_code }}</span>
                   </div>
                </div>

                <!-- Tasa de Cambio (Puente) -->
                <div class="flex flex-col items-center gap-4 relative z-10 px-6">
                   <div class="w-px h-12 md:w-16 md:h-px bg-gradient-to-b md:bg-gradient-to-r from-danger/30 via-primary/30 to-success/30"></div>
                   <div class="px-6 py-3 rounded-2xl bg-secondary border border-white/10 shadow-2xl flex flex-col items-center gap-1 group">
                      <span class="text-[0.5rem] font-black text-white/20 uppercase tracking-widest">Tasa Aplicada</span>
                      <span class="text-base font-black text-primary group-hover:scale-110 transition-transform">{{ exchangeRateDetails.usedRate }}</span>
                      <div v-if="operationType === 'purchase'" class="w-1 h-1 rounded-full bg-primary/40 animate-pulse"></div>
                   </div>
                   <div class="w-px h-12 md:w-16 md:h-px bg-gradient-to-b md:bg-gradient-to-r from-danger/30 via-primary/30 to-success/30"></div>
                </div>

                <!-- Destino -->
                <div class="flex-1 w-full p-8 rounded-[2.5rem] bg-black/40 border border-white/5 group hover:border-success/20 transition-all duration-500">
                   <div class="flex items-center gap-3 mb-4">
                      <div class="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center text-xs">
                        <FontAwesomeIcon icon="fa-solid fa-arrow-down" />
                      </div>
                      <span class="text-[0.6rem] font-black text-white/20 uppercase tracking-[0.2em]">Destino de Fondos</span>
                   </div>
                   <p class="text-xs font-bold text-white/40 mb-1 uppercase tracking-tight">{{ toAccount.name || 'Destino' }}</p>
                   <div class="flex items-baseline gap-2">
                      <span class="text-3xl font-black text-success tracking-tighter">+ {{ formatMoney(tx.amount_received).split(',')[0] }}</span>
                      <span class="text-sm font-bold text-success opacity-40">,{{ formatMoney(tx.amount_received).split(',')[1] }}</span>
                      <span class="text-[0.6rem] font-black text-white/20 uppercase ml-1">{{ toAccount.currency_code }}</span>
                   </div>
                </div>
             </div>
          </div>

          <!-- Detalles Financieros Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
             <!-- Panel de Tasas -->
             <div class="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-6">
                <div class="flex items-center gap-3">
                   <FontAwesomeIcon icon="fa-solid fa-percent" class="text-primary/40" />
                   <h3 class="text-[0.65rem] font-black text-white/60 uppercase tracking-[0.2em]">{{ exchangeRateDetails.title }}</h3>
                </div>
                <div class="space-y-4">
                   <div class="flex justify-between items-center group">
                      <span class="text-xs font-bold text-white/40 tracking-tight">{{ exchangeRateDetails.rate1.label }}</span>
                      <span class="font-black text-white group-hover:text-primary transition-colors">{{ exchangeRateDetails.rate1.value }}</span>
                   </div>
                   <div v-if="exchangeRateDetails.rate2" class="flex justify-between items-center group">
                      <span class="text-xs font-bold text-white/40 tracking-tight">{{ exchangeRateDetails.rate2.label }}</span>
                      <span class="font-black text-white group-hover:text-primary transition-colors">{{ exchangeRateDetails.rate2.value }}</span>
                   </div>
                </div>
             </div>

             <!-- Panel de Rentabilidad -->
             <div class="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-6">
                <div class="flex items-center gap-3">
                   <FontAwesomeIcon icon="fa-solid fa-calculator" class="text-primary/40" />
                   <h3 class="text-[0.65rem] font-black text-white/60 uppercase tracking-[0.2em]">Estructura de Margen ({{ commissionCurrency }})</h3>
                </div>
                <div class="space-y-4">
                   <div class="flex justify-between items-center">
                      <span class="text-xs font-bold text-white/40 tracking-tight">Comisión Bruta Retenida</span>
                      <span class="font-black text-success">+ {{ formatMoney(tx.commission_total_amount || 0) }}</span>
                   </div>
                   <div class="flex justify-between items-center">
                      <span class="text-xs font-bold text-white/40 tracking-tight">Costo de Liquidación ({{ provider.name || 'Plataforma' }})</span>
                      <span class="font-black text-danger">- {{ formatMoney(tx.commission_provider_amount || 0) }}</span>
                   </div>
                   <div v-if="parseFloat(tx.commission_admin_amount) > 0" class="flex justify-between items-center">
                      <span class="text-xs font-bold text-white/40 tracking-tight">Costo Admin / Plataforma</span>
                      <span class="font-black text-danger">- {{ formatMoney(tx.commission_admin_amount) }}</span>
                   </div>
                   <div class="pt-4 border-t border-white/5 flex justify-between items-baseline group">
                      <span class="text-[0.55rem] font-black text-white/20 uppercase tracking-widest">Utilidad Neta del Ciclo</span>
                      <span class="text-2xl font-black tracking-tighter transition-all group-hover:scale-105" :class="netProfit >= 0 ? 'text-primary' : 'text-danger'">
                        {{ netProfit }}
                      </span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        <!-- Debug Toggle Area -->
        <div class="p-10 border-t border-white/5 bg-black/20 flex flex-col items-center gap-4">
           <button @click="showDebug = !showDebug" class="text-[0.55rem] font-black text-white/10 uppercase tracking-[0.4em] hover:text-primary transition-colors">
              {{ showDebug ? 'Encapsular Auditoría Técnica' : 'Acceder a Metadatos del Sistema' }}
           </button>
           <div v-if="showDebug" class="w-full animate-fade-in">
              <pre class="w-full bg-black/80 rounded-2xl p-6 text-[0.6rem] font-mono text-success/60 border border-white/5 overflow-auto max-h-[300px]">{{ JSON.stringify(tx, null, 2) }}</pre>
           </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="min-h-[60vh] flex flex-col items-center justify-center text-center gap-6">
       <div class="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center text-danger border border-danger/20">
         <FontAwesomeIcon icon="fa-solid fa-ghost" class="text-3xl" />
       </div>
       <div class="space-y-2">
         <h3 class="text-2xl font-black text-white uppercase tracking-tighter">Voucher no encontrado</h3>
         <p class="text-sm text-white/30 font-bold uppercase tracking-widest">El registro puede haber sido movido o archivado</p>
       </div>
       <button @click="router.back()" class="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all border border-white/5 active:scale-95">
         Reintentar Búsqueda
       </button>
    </div>
  </div>
</template>

<style scoped>
.text-gradient-primary {
  background: linear-gradient(135deg, #f7a600, #ffdf6d);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.animate-premium-in {
  animation: slideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
