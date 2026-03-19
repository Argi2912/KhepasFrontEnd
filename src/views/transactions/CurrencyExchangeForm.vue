<script setup>
import { useCurrencyExchange } from '@/composables/transactions/useCurrencyExchange'
import { useTransactionStore } from '@/stores/transaction'

// COMPONENTES
import BaseSelectWithSearchAndCreate from '@/components/ui/BaseSelectWithSearchAndCreate.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import ExchangeCalcPanel from '@/components/transactions/ExchangeCalcPanel.vue'
import ExchangeCommissionPanel from '@/components/transactions/ExchangeCommissionPanel.vue'
import ExchangeSummaryCard from '@/components/transactions/ExchangeSummaryCard.vue'

const transactionStore = useTransactionStore()

const {
  // Estado
  currentStep,
  totalSteps,
  isSubmitting,
  operationType,
  form,
  clientReceivesAmount,

  // Getters / Computed
  selectedInvestor,
  isComplexExchange,
  sourceAccounts,
  destinationAccounts,
  fromAccount,
  toAccount,
  selectedPlatform,
  selectedProvider,
  selectedBroker,
  sourceName,
  sourceCurrency,
  commissionCurrency,
  hasSufficientBalance,
  exchangePercentage,

  // Métodos
  handleDataReload,
  onEditSent,
  onEditReceived,
  onEditRate,
  onEditClientReceives,
  nextStep,
  prevStep,
  handleConfirm,
  getError,
  clearError,
} = useCurrencyExchange()
</script>

<template>
  <div class="max-w-7xl mx-auto py-10 animate-premium-in">
    
    <!-- Pantalla de Carga -->
    <div v-if="transactionStore.isLoadingData" class="min-h-[60vh] flex flex-col items-center justify-center gap-6">
      <div class="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <p class="text-[0.6rem] font-black uppercase text-white/20 tracking-[0.4em]">Sincronizando Motores...</p>
    </div>

    <div v-else class="space-y-10 px-4">
      
      <!-- Header Dinámico Premium -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div>
          <h1 class="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <span class="w-1.5 h-10 bg-primary rounded-full shadow-[0_0_20px_rgba(247,166,0,0.4)]"></span>
            Nueva <span class="text-gradient-primary">Operación</span>
          </h1>
          <p class="text-white/30 text-xs font-bold uppercase tracking-[0.2em] mt-2 ml-4">
             Fase {{ currentStep }} de {{ totalSteps }}: 
             <span class="text-white/60">{{ currentStep === 1 ? 'Configuración Base' : currentStep === 2 ? 'Ingeniería de Cambio' : 'Resumen de Liquidación' }}</span>
          </p>
        </div>

        <div class="bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner backdrop-blur-md">
           <div class="flex gap-2">
             <button 
               v-for="t in [{v:'purchase', l:'Compra'}, {v:'exchange', l:'Intercambio'}, {v:'currency_change', l:'Divisa'}]" 
               :key="t.v"
               @click="operationType = t.v" 
               :class="[
                 'px-6 py-2 text-[0.6rem] font-black uppercase tracking-widest rounded-xl transition-all duration-300', 
                 operationType === t.v 
                   ? 'bg-primary text-secondary shadow-[0_5px_15px_rgba(247,166,0,0.2)]' 
                   : 'text-white/20 hover:text-white/40'
               ]"
             >
               {{ t.l }}
             </button>
           </div>
        </div>
      </div>

      <!-- Barra de Progreso Minimal -->
      <div class="h-1 bg-white/5 rounded-full overflow-hidden">
        <div 
          class="h-full bg-primary shadow-[0_0_10px_rgba(247,166,0,0.5)] transition-all duration-700 ease-out" 
          :style="{ width: (currentStep / totalSteps) * 100 + '%' }"
        ></div>
      </div>

      <!-- Form Body -->
      <div class="premium-card p-4 md:p-10 bg-white/[0.01] border-white/5 shadow-2xl relative overflow-hidden rounded-[2rem] md:rounded-[3rem]">
        <div class="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 blur-3xl rounded-full"></div>
        
        <!-- PASO 1: PARTES Y ENTIDADES -->
        <div v-if="currentStep === 1" class="space-y-10 animate-fade-in relative z-10">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
            
            <!-- Bloque Cliente -->
            <div class="space-y-6">
              <BaseSelectWithSearchAndCreate 
                label="Entidad Cliente *" 
                :options="transactionStore.getClients"
                v-model="form.client_id" 
                required 
                create-endpoint="/clients" 
                :create-fields="{ name: '' }"
                create-label="Cliente" 
                @saved="handleDataReload" 
                :error="getError('client_id')"
                @update:modelValue="clearError('client_id')" 
                class="premium-input-large"
              />

              <div class="space-y-4">
                <label class="text-[0.65rem] font-black text-white/20 uppercase tracking-[0.3em] block ml-1">Origen del Capital</label>
                <div class="flex flex-wrap gap-2 p-1 bg-black/20 rounded-xl border border-white/5 w-fit">
                  <button 
                    @click="form.capital_type = 'own'"
                    :class="['px-4 md:px-6 py-2 md:py-2.5 text-[0.6rem] font-black rounded-lg transition-all', form.capital_type === 'own' ? 'bg-primary/20 text-primary border border-primary/20' : 'text-white/20']"
                  >
                    PROPIO / EMPRESA
                  </button>
                </div>
              </div>
            </div>

            <!-- Bloque Intermediarios -->
            <div class="space-y-6 bg-white/[0.02] p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-white/5">
               <div v-if="operationType === 'exchange'" class="relative">
                  <button v-if="form.platform_id" @click="form.platform_id = null" class="absolute -top-1 right-0 text-[0.55rem] font-black text-primary uppercase hover:underline">Remover</button>
                  <BaseSelectWithSearchAndCreate 
                    label="Plataforma Gestora (Opcional)"
                    :options="transactionStore.getPlatforms" 
                    v-model="form.platform_id" 
                    create-endpoint="/platforms"
                    :create-fields="{ name: '' }" 
                    create-label="Plataforma" 
                    @saved="handleDataReload"
                    :error="getError('platform_id')" 
                    @update:modelValue="clearError('platform_id')" 
                  />
               </div>

               <template v-if="operationType !== 'exchange'">
                  <div class="relative">
                    <button v-if="form.broker_id" @click="form.broker_id = null" class="absolute -top-1 right-0 text-[0.55rem] font-black text-primary uppercase hover:underline">Remover</button>
                    <BaseSelectWithSearchAndCreate 
                      label="Socio / Broker (Opcional)" 
                      :options="transactionStore.getBrokers"
                      v-model="form.broker_id" 
                      create-endpoint="/brokers" 
                      :create-fields="{ name: '' }"
                      create-label="Corredor" 
                      @saved="handleDataReload" 
                      :error="getError('broker_id')" 
                    />
                  </div>

                  <div class="relative pt-2">
                    <button v-if="form.provider_id" @click="form.provider_id = null" class="absolute top-1 right-0 text-[0.55rem] font-black text-primary uppercase hover:underline">Remover</button>
                    <BaseSelectWithSearchAndCreate 
                      label="Proveedor de Liquidez"
                      :options="transactionStore.getProviders" 
                      v-model="form.provider_id" 
                      create-endpoint="/providers"
                      :create-fields="{ name: '' }" 
                      create-label="Proveedor" 
                      @saved="handleDataReload"
                      :error="getError('provider_id')" 
                      @update:modelValue="clearError('provider_id')" 
                    />
                  </div>
               </template>
            </div>
          </div>

          <div class="divider border-white/5"></div>

          <!-- Bloque Cuentas -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
            <BaseSelectWithSearchAndCreate 
              label="Cuenta de Salida (Sale) *" 
              :options="sourceAccounts"
              v-model="form.from_account_id" 
              required 
              create-endpoint="/accounts" 
              :create-fields="{ name: '' }"
              create-label="Cuenta" 
              @saved="handleDataReload" 
              :error="getError('from_account_id')"
              @update:modelValue="clearError('from_account_id')" 
            />
            
            <BaseSelectWithSearchAndCreate 
              label="Cuenta de Entrada (Recibe) *" 
              :options="destinationAccounts"
              v-model="form.to_account_id" 
              required 
              create-endpoint="/accounts" 
              :create-fields="{ name: '' }"
              create-label="Cuenta" 
              @saved="handleDataReload" 
              :error="getError('to_account_id')"
              @update:modelValue="clearError('to_account_id')" 
            />
          </div>
        </div>

        <!-- PASO 2: CÁLCULOS TÉCNICOS -->
        <div v-if="currentStep === 2" class="space-y-12 animate-fade-in relative z-10 py-4">
          <ExchangeCalcPanel
            :operationType="operationType"
            :isComplexExchange="isComplexExchange"
            :sourceCurrency="sourceCurrency"
            :toAccount="toAccount"
            :form="form"
            v-model:clientReceivesAmount="clientReceivesAmount"
            :hasSufficientBalance="hasSufficientBalance"
            :fromAccount="fromAccount"
            :selectedInvestor="selectedInvestor"
            :exchangePercentage="exchangePercentage"
            @onEditReceived="onEditReceived"
            @onEditSent="onEditSent"
            @onEditRate="onEditRate"
            @onEditClientReceives="onEditClientReceives"
          />

          <div class="divider border-white/5 shadow-[0_0_20px_rgba(247,166,0,0.05)]"></div>

          <ExchangeCommissionPanel
            :operationType="operationType"
            :isComplexExchange="isComplexExchange"
            :form="form"
            :commissionCurrency="commissionCurrency"
          />
        </div>

        <!-- PASO 3: RESUMEN FINAL -->
        <div v-if="currentStep === 3" class="animate-fade-in relative z-10 flex flex-col items-center">
          <ExchangeSummaryCard
            :operationType="operationType"
            :form="form"
            :clients="transactionStore.getClients"
            :brokers="transactionStore.getBrokers"
            :selectedPlatform="selectedPlatform"
            :selectedProvider="selectedProvider"
            :sourceName="sourceName"
            :sourceCurrency="sourceCurrency"
            :toAccount="toAccount"
            :commissionCurrency="commissionCurrency"
          />
          
          <div class="mt-8 p-6 rounded-2xl bg-white/[0.02] border border-white/5 max-w-2xl w-full text-center">
             <p class="text-[0.6rem] font-black text-white/20 uppercase tracking-[0.4em]">Verifique los montos de liquidación antes de consolidar</p>
          </div>
        </div>

        <!-- Footer Navegación -->
        <div class="flex justify-between items-center mt-16 pt-8 border-t border-white/5 relative z-10">
          <button 
            v-if="currentStep > 1" 
            @click="prevStep" 
            class="px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all text-white/40 hover:text-white active:scale-95"
          >
            <FontAwesomeIcon icon="fa-solid fa-chevron-left" class="mr-2" /> Atrás
          </button>
          <div v-else></div>

          <div class="flex gap-4">
            <button 
              v-if="currentStep < totalSteps" 
              @click="nextStep" 
              class="bg-white/10 hover:bg-white/20 text-white px-6 md:px-10 py-3 md:py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 border border-white/10"
            >
              Continuar 
              <FontAwesomeIcon icon="fa-solid fa-chevron-right" class="ml-2" />
            </button>
            <button 
              v-if="currentStep === totalSteps" 
              @click="handleConfirm" 
              class="bg-primary text-secondary px-8 md:px-12 py-3 md:py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-primary-dark hover:shadow-xl active:scale-95 disabled:opacity-50"
              :disabled="isSubmitting"
            >
              <FontAwesomeIcon v-if="isSubmitting" icon="fa-solid fa-circle-notch" spin class="mr-2" />
              {{ isSubmitting ? 'Consolidando...' : 'Confirmar Operación' }}
            </button>
          </div>
        </div>
      </div>
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

.premium-card {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
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

.divider {
  height: 1px;
  width: 100%;
  margin: 20px 0;
}
</style>