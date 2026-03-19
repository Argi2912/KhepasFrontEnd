<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { usePurchase } from '@/composables/transactions/usePurchase'
import { useTransactionStore } from '@/stores/transaction'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import FormWizard from '@/components/shared/FormWizard.vue'

const transactionStore = useTransactionStore()

const {
  currentStep,
  isSubmitting,
  isDivisaDelivered,
  form,
  localCurrencyCode,
  fromAccountOptions,
  platformAccountOptions,
  deliverCurrency,
  baseAmountInVes,
  commissionCharged_VES,
  commissionProvider_VES,
  commissionProvider_USD,
  totalVesCredit,
  totalUsdDebit_Platform,
  platformAccountError,
  generalAmountError,
  goToNextStep,
  handleSubmit,
  formatCurrency,
} = usePurchase()
</script>

<template>
  <div class="max-w-7xl mx-auto py-10 animate-premium-in">
    
    <!-- Título fuera del Wizard para mayor impacto -->
    <div class="mb-10 px-4">
      <h1 class="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
        <span class="w-1.5 h-10 bg-primary rounded-full shadow-[0_0_20px_rgba(247,166,0,0.4)]"></span>
        Registro de <span class="text-gradient-primary">Compra Divisa</span>
      </h1>
      <p class="text-white/30 text-xs font-bold uppercase tracking-[0.2em] mt-2 ml-4">Conversión estratégica de VES a USD vía plataformas</p>
    </div>

    <FormWizard v-model="currentStep">
      
      <!-- Paso 1: Entidades Involucradas -->
      <template #step-0>
        <div class="space-y-8 py-4 animate-fade-in px-4">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
               <FontAwesomeIcon icon="fa-solid fa-users" />
            </div>
            <h2 class="text-lg font-black text-white uppercase tracking-widest">1. Núcleo de la Operación</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <BaseSelect 
              v-model="form.client_id" 
              label="Entidad Cliente" 
              :options="transactionStore.getClients" 
              required 
              placeholder="Seleccionar titular..." 
              class="premium-input-large"
            />
            <BaseSelect 
              v-model="form.broker_id" 
              label="Corredor (Broker)" 
              :options="transactionStore.getBrokers"
              placeholder="Opcional (Socio)" 
            />
            <BaseSelect 
              v-model="form.provider_id" 
              label="Proveedor Externo" 
              :options="transactionStore.getProviders"
              placeholder="Opcional (Fuente)" 
            />
          </div>
          
          <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5 border-dashed text-center">
             <p class="text-[0.6rem] font-black text-white/20 uppercase tracking-[0.3em]">Validación de contrapartes activa</p>
          </div>
        </div>
      </template>

      <!-- Paso 2: Configuración y Cálculos -->
      <template #step-1>
        <div class="space-y-10 py-4 animate-fade-in px-4">
          
          <!-- Cuentas -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 bg-black/40 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 shadow-inner">
            <BaseSelect 
              v-model="form.from_account_id" 
              :label="`Plataforma Recibe (${localCurrencyCode})`"
              :options="fromAccountOptions" 
              required 
            />
            <BaseSelect 
              v-model="form.platform_account_id" 
              label="Plataforma Paga (USD / Divisa)"
              :options="platformAccountOptions" 
              required 
              :error="platformAccountError" 
            />
          </div>

          <!-- Montos y Tasas -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
             <div class="relative group">
                <BaseInput 
                  v-model.number="form.amount_to_deliver" 
                  :label="`Monto a Comprar (${deliverCurrency || 'USD'})`"
                  type="number" 
                  step="0.01" 
                  required 
                  class="premium-input-large"
                />
                <FontAwesomeIcon icon="fa-solid fa-money-bill-transfer" class="absolute right-4 top-10 text-primary/40 group-focus-within:text-primary transition-colors" />
             </div>

             <div class="flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 group hover:border-success/30 transition-all">
                <span class="text-[0.55rem] font-black text-white/20 uppercase tracking-[0.3em]">Tasa Operativa (Costo)</span>
                <div class="flex items-baseline gap-2">
                   <span class="text-2xl font-black transition-colors" :class="form.buy_rate ? 'text-success' : 'text-white/20'">
                     {{ form.buy_rate ? form.buy_rate.toFixed(4) : '0.0000' }}
                   </span>
                   <span class="text-[0.6rem] font-bold text-white/10 uppercase">VES/USD</span>
                </div>
             </div>

             <div class="flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 group hover:border-primary/30 transition-all">
                <span class="text-[0.55rem] font-black text-white/20 uppercase tracking-[0.3em]">Tasa Comercial (Cliente)</span>
                <div class="flex items-baseline gap-2">
                   <span class="text-2xl font-black transition-colors" :class="form.received_rate ? 'text-primary' : 'text-white/20'">
                     {{ form.received_rate ? form.received_rate.toFixed(4) : '0.0000' }}
                   </span>
                   <span class="text-[0.6rem] font-bold text-white/10 uppercase">VES/USD</span>
                </div>
             </div>
          </div>

          <!-- Comisiones -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
            <BaseInput v-model.number="form.commission_charged_pct" label="Margen Empresa (%)" type="number" step="0.01" placeholder="Ej: 2.50" />
            <BaseInput v-model.number="form.commission_provider_pct" label="Cargo Proveedor (%)" type="number" step="0.01" placeholder="Ej: 1.00" />
          </div>

          <!-- Footer Checkbox -->
          <div class="p-6 rounded-[2rem] border transition-all duration-500 flex flex-col items-center text-center gap-4"
               :class="isDivisaDelivered ? 'bg-success/5 border-success/30' : 'bg-warning/5 border-warning/30 shadow-[0_10px_40px_rgba(247,166,0,0.05)] shadow-inner'">
            
            <label class="flex items-center gap-4 cursor-pointer group">
              <input type="checkbox" v-model="isDivisaDelivered" class="w-6 h-6 rounded-lg bg-black border-white/20 text-primary focus:ring-primary focus:ring-offset-0" />
              <span class="text-sm font-black text-white uppercase tracking-widest group-hover:text-primary transition-colors">Confirmar Entrega Física de Divisa</span>
            </label>
            
            <p v-if="!isDivisaDelivered" class="text-[0.65rem] font-bold text-warning/60 animate-pulse uppercase tracking-[0.2em] flex items-center gap-2">
               <FontAwesomeIcon icon="fa-solid fa-triangle-exclamation" /> 
               La orden quedará en cola de entrega pendiente
            </p>
            <p v-else class="text-[0.65rem] font-bold text-success uppercase tracking-[0.2em] flex items-center gap-2">
               <FontAwesomeIcon icon="fa-solid fa-circle-check" /> 
               Liquidación instantánea aprobada
            </p>
          </div>

          <!-- Resumen con Glassmorphism -->
          <div class="relative p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-secondary-light/40 border border-white/10 shadow-2xl overflow-hidden group">
            <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50"></div>
            
            <h3 class="text-xs font-black text-white/30 uppercase tracking-[0.4em] mb-8 relative z-10 border-b border-white/5 pb-4">Proyección de Impacto Contable</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
              <!-- Crédito -->
              <div class="space-y-6">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center text-success">
                    <FontAwesomeIcon icon="fa-solid fa-arrow-up" />
                  </div>
                  <h4 class="text-[0.65rem] font-black text-white/60 uppercase tracking-widest">Entrada neta (VES)</h4>
                </div>
                
                <div class="space-y-3 px-2">
                   <div class="flex justify-between text-xs font-bold text-white/30">
                      <span>Monto Base:</span>
                      <span>{{ formatCurrency(baseAmountInVes, localCurrencyCode) }}</span>
                   </div>
                   <div class="flex justify-between text-xs font-medium text-white/20">
                      <span>FEE Empresa:</span>
                      <span>{{ formatCurrency(commissionCharged_VES, localCurrencyCode) }}</span>
                   </div>
                   <div class="flex justify-between text-[0.6rem] italic text-white/10">
                      <span>FEE Proveedor:</span>
                      <span>{{ formatCurrency(commissionProvider_VES, localCurrencyCode) }}</span>
                   </div>
                   <div class="pt-4 border-t border-white/5 flex flex-col md:flex-row justify-between items-baseline group-hover:scale-[1.02] transition-transform gap-2">
                      <span class="text-[0.55rem] font-black text-success uppercase tracking-widest">Total a Percibir</span>
                      <span class="text-2xl md:text-3xl font-black text-success tracking-tighter">{{ formatCurrency(totalVesCredit, localCurrencyCode) }}</span>
                   </div>
                </div>
              </div>

              <!-- Débito -->
              <div class="space-y-6">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-danger/20 flex items-center justify-center text-danger">
                    <FontAwesomeIcon icon="fa-solid fa-arrow-down" />
                  </div>
                  <h4 class="text-[0.65rem] font-black text-white/60 uppercase tracking-widest">Salida Plat (USD)</h4>
                </div>

                <div class="space-y-3 px-2">
                   <div class="flex justify-between text-xs font-bold text-white/30">
                      <span>Principal:</span>
                      <span>{{ formatCurrency(form.amount_to_deliver, deliverCurrency) }}</span>
                   </div>
                   <div class="flex justify-between text-xs font-medium text-white/20">
                      <span>Com. Red:</span>
                      <span>{{ formatCurrency(commissionProvider_USD, deliverCurrency) }}</span>
                   </div>
                   <div class="pt-4 border-t border-white/5 flex flex-col md:flex-row justify-between items-baseline group-hover:scale-[1.02] transition-transform gap-2">
                       <span class="text-[0.55rem] font-black text-danger uppercase tracking-widest">Débito Estimado</span>
                       <span class="text-2xl md:text-3xl font-black text-danger tracking-tighter">{{ formatCurrency(totalUsdDebit_Platform, deliverCurrency) }}</span>
                   </div>
                </div>
              </div>
            </div>

            <div v-if="generalAmountError" class="mt-8 p-4 bg-danger/10 border border-danger/20 rounded-2xl flex items-center gap-4 animate-bounce">
              <FontAwesomeIcon icon="fa-solid fa-triangle-exclamation" class="text-danger text-xl" />
              <p class="text-xs font-black text-danger uppercase tracking-widest">{{ generalAmountError }}</p>
            </div>
          </div>
        </div>
      </template>

      <!-- Navegación del Wizard -->
      <template #footer>
        <div class="flex justify-between items-center w-full px-4 pt-6">
          <button 
            type="button" 
            @click="currentStep--" 
            :disabled="currentStep === 0" 
            class="px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-0 active:scale-95 text-white/40 hover:text-white"
          >
            Regresar
          </button>
          
          <div class="flex gap-4">
            <button 
              type="button" 
              @click="goToNextStep" 
              v-if="currentStep < 1" 
              class="bg-white/10 hover:bg-white/20 text-white px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 border border-white/10"
            >
              Continuar
            </button>
            <button 
              type="button" 
              @click="handleSubmit" 
              v-if="currentStep === 1"
              :disabled="isSubmitting || generalAmountError" 
              class="bg-primary text-secondary px-12 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-primary-dark hover:shadow-xl active:scale-95 disabled:opacity-50"
            >
              <FontAwesomeIcon v-if="isSubmitting" icon="fa-solid fa-circle-notch" spin class="mr-2" />
              {{ isSubmitting ? 'Consolidando...' : 'Confirmar Operación' }}
            </button>
          </div>
        </div>
      </template>
    </FormWizard>
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
