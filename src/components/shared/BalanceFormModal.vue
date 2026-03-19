<script setup>
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useBalance } from '@/composables/shared/useBalance'

const props = defineProps({
    show: Boolean,
    resource: { type: String, default: 'accounts' },
    entityId: [Number, String],
    entityName: String,
    availableBalance: { type: Number, default: 0 }
})

const emit = defineEmits(['close', 'saved'])

const {
  form,
  isSubmitting,
  isLoading,
  myAccounts,
  currencies,
  calculatedDebt,
  isProvider,
  isInvestor,
  formatCurrency,
  handleSubmit,
  updateCategory
} = useBalance(props, emit)

const modalTitle = isInvestor.value ? 'Gestión de Capital Social' : (isProvider.value ? 'Registro de Apoyo Financiero' : 'Ajuste de Tesorería')
</script>

<template>
  <BaseModal :show="show" :title="modalTitle" @close="emit('close')">
    <div v-if="isLoading" class="py-20 flex flex-col items-center justify-center gap-4">
       <div class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
       <p class="text-[0.65rem] font-bold uppercase tracking-widest text-primary/40">Sincronizando estados financieros...</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Identidad Visual -->
      <div class="premium-card p-5 bg-white/[0.02] flex items-center gap-4 border-white/5">
        <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
           <span v-if="isProvider">🚛</span>
           <span v-else-if="isInvestor">💼</span>
           <span v-else>🏦</span>
        </div>
        <div class="flex flex-col">
          <span class="text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/30 mb-0.5">Operando sobre</span>
          <span class="text-base font-black text-white tracking-tight">{{ entityName }}</span>
          <div v-if="!isProvider" class="flex items-center gap-2 mt-1">
             <span class="w-2 h-2 rounded-full bg-success animate-pulse"></span>
             <span class="text-[0.65rem] font-bold text-success/80">Disponible: {{ formatCurrency(availableBalance) }}</span>
          </div>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        
        <!-- Caso Específico: Proveedor (Financiamiento) -->
        <div v-if="isProvider" class="space-y-6">
          <div class="p-6 rounded-[1.5rem] bg-white/[0.02] border border-white/5 space-y-4">
            <h4 class="text-[0.6rem] font-black uppercase tracking-[0.3em] text-primary/60 border-b border-white/5 pb-2">1. Captación de Fondos</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div class="flex flex-col gap-2">
                 <label class="text-[0.65rem] font-black uppercase tracking-widest text-white/30 ml-1">Cuenta de Recepción</label>
                 <select v-model="form.target_account_id" class="w-full bg-white/[0.03] border border-white/5 p-3.5 text-sm text-white rounded-xl outline-none focus:border-primary/50 transition-all appearance-none">
                    <option :value="null" disabled>Seleccionar cuenta...</option>
                    <option v-for="acc in myAccounts" :key="acc.id" :value="acc.id">
                        {{ acc.name }} ({{ acc.currency_code }})
                    </option>
                 </select>
               </div>
               <BaseInput label="Monto Recibido" type="number" step="0.01" v-model="form.amount" required placeholder="0.00" />
            </div>
          </div>

          <div class="p-6 rounded-[1.5rem] bg-danger/[0.02] border border-danger/10 space-y-4 relative overflow-hidden">
            <div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
               <span class="text-4xl">🧾</span>
            </div>
            <h4 class="text-[0.6rem] font-black uppercase tracking-[0.3em] text-danger/60 border-b border-white/5 pb-2">2. Configuración de Obligación</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
               <BaseInput label="% Interés Aplicado" type="number" step="0.01" v-model="form.percentage" placeholder="0.00" />
               <div class="flex flex-col gap-2">
                 <label class="text-[0.65rem] font-black uppercase tracking-widest text-white/30 ml-1">Moneda del Compromiso</label>
                 <select v-model="form.debt_currency_id" class="w-full bg-white/[0.03] border border-white/5 p-3.5 text-sm text-white rounded-xl outline-none focus:border-danger/50 transition-all appearance-none">
                    <option :value="null" disabled>Seleccionar...</option>
                    <option v-for="curr in currencies" :key="curr.id" :value="curr.id">
                        {{ curr.code }} - {{ curr.name }}
                    </option>
                 </select>
               </div>
            </div>
            <div class="pt-4 mt-2 border-t border-dashed border-white/10 flex justify-between items-end">
               <span class="text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/20">Total a Liquidar:</span>
               <div class="flex items-baseline gap-1 text-danger font-black">
                  <span class="text-lg tracking-tighter">{{ formatCurrency(calculatedDebt).split(',')[0].replace('$', '') }}</span>
                  <span class="text-xs opacity-50">,{{ formatCurrency(calculatedDebt).split(',')[1] }}</span>
               </div>
            </div>
          </div>
        </div>

        <!-- Caso General: Inversionistas / Tesorería -->
        <div v-else class="space-y-6">
          <div class="flex p-1.5 bg-white/[0.03] border border-white/5 rounded-2xl gap-2">
             <button 
               type="button" 
               @click="form.type = 'income'; updateCategory()"
               :class="[
                 'flex-1 py-3 px-4 rounded-xl text-[0.65rem] font-black uppercase tracking-[0.2em] transition-all',
                 form.type === 'income' ? 'bg-success text-secondary shadow-lg scale-[1.02]' : 'bg-transparent text-white/30 hover:text-white/60'
               ]"
             >
               + Inyección
             </button>
             <button 
               type="button" 
               @click="form.type = 'expense'; updateCategory()"
               :class="[
                 'flex-1 py-3 px-4 rounded-xl text-[0.65rem] font-black uppercase tracking-[0.2em] transition-all',
                 form.type === 'expense' ? 'bg-danger text-white shadow-lg scale-[1.02]' : 'bg-transparent text-white/30 hover:text-white/60'
               ]"
             >
               - Retiro
             </button>
          </div>

          <div v-if="form.type === 'expense'" class="p-5 rounded-2xl bg-danger/[0.03] border border-danger/10 animate-fade-in group">
            <label class="block text-[0.65rem] font-black uppercase tracking-widest text-danger/40 mb-3 ml-1 group-focus-within:text-danger/60">Destino de los fondos (Opcional)</label>
            <select v-model="form.target_account_id" class="w-full bg-white/[0.03] border border-danger/20 p-3.5 text-sm text-white rounded-xl outline-none focus:border-danger transition-all appearance-none">
                <option :value="null">Mantener fuera del sistema (Liquidación)</option>
                <option v-for="acc in myAccounts" :key="acc.id" :value="acc.id">
                    Transferir a: {{ acc.name }} ({{ acc.currency_code }})
                </option>
            </select>
          </div>

          <BaseInput :label="`Monto a ${form.type === 'income' ? 'Sumar' : 'Descontar'}`" type="number" step="0.01" v-model="form.amount" required placeholder="0.00" />
        </div>

        <!-- Campos Comunes -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
           <BaseInput label="Fecha de Operación" type="date" v-model="form.transaction_date" required />
           <BaseInput label="Código de Referencia / Nota" v-model="form.description" placeholder="Ej: REF #12345" />
        </div>
      </form>
    </div>

    <template #footer>
      <div v-if="!isLoading" class="flex flex-col-reverse md:flex-row justify-end gap-3 w-full">
        <BaseButton variant="secondary" outline @click="emit('close')" :disabled="isSubmitting">Cancelar</BaseButton>
        <BaseButton 
          :variant="isProvider ? 'primary' : (form.type === 'income' ? 'success' : 'danger')" 
          @click="handleSubmit" 
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting">Procesando...</span>
          <span v-else>Confirmar Operación</span>
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
button { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.premium-card { border-radius: 2.5rem; }
</style>