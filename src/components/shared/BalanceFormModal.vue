<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import notify from '@/services/notify'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const props = defineProps({
    show: Boolean,
    resource: { type: String, default: 'accounts' },
    entityId: [Number, String],
    entityName: String,
    availableBalance: { type: Number, default: 0 }
})

const emit = defineEmits(['close', 'saved'])
const authStore = useAuthStore()
const isSubmitting = ref(false)
const isLoading = ref(false)
const myAccounts = ref([])
const currencies = ref([])

const form = reactive({
    amount: '',
    type: 'income',
    description: '',
    category: 'Carga de Saldo',
    transaction_date: new Date().toISOString().split('T')[0],
    target_account_id: null,
    percentage: '',
    debt_currency_id: null
})

// --- COMPUTED PROPERTIES ---
const isProvider = computed(() => props.resource === 'providers')
const isInvestor = computed(() => props.resource === 'investors')

const modalTitle = computed(() => {
    if (isInvestor.value) return 'Gestión de Capital Social'
    if (isProvider.value) return 'Registro de Apoyo Financiero'
    return 'Ajuste de Tesorería'
})

const calculatedDebt = computed(() => {
    if (!form.amount) return 0
    const amount = parseFloat(form.amount) || 0
    const pct = parseFloat(form.percentage) || 0
    return amount + (amount * (pct / 100))
})

// --- METHODS ---
const updateCategory = () => {
    if (isProvider.value) {
        form.category = 'Financiamiento / Deuda'
        return
    }
    if (form.type === 'income') {
        form.category = isInvestor.value ? 'Inyección de Capital' : 'Incremento de Saldo'
    } else {
        form.category = 'Egreso / Liquidación'
    }
}

const fetchData = async () => {
    isLoading.value = true
    try {
        const [accRes, currRes] = await Promise.all([
            api.get('/accounts?per_page=999'),
            api.get('/currencies?per_page=999')
        ])
        myAccounts.value = accRes.data.data
        currencies.value = currRes.data.data
    } catch (error) {
        notify.error('Fallo al sincronizar cuentas y divisas.')
    } finally {
        isLoading.value = false
    }
}

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(amount || 0)
}

const resetForm = () => {
    Object.assign(form, {
        amount: '',
        description: '',
        target_account_id: null,
        percentage: '',
        debt_currency_id: null,
        type: 'income',
        transaction_date: new Date().toISOString().split('T')[0]
    })
    updateCategory()
}

const handleSubmit = async () => {
    isSubmitting.value = true
    updateCategory()

    try {
        if (isProvider.value) {
            if (!form.target_account_id) throw new Error('Debe especificar la cuenta de recepción.')
            if (!form.debt_currency_id) throw new Error('Debe definir la moneda de la obligación.')
            if (!form.amount || form.amount <= 0) throw new Error('El monto debe ser superior a cero.')

            const payload = {
                amount_received: form.amount,
                target_account_id: form.target_account_id,
                interest_percentage: form.percentage || 0,
                debt_amount: calculatedDebt.value,
                debt_currency_id: form.debt_currency_id,
                description: form.description || 'Financiamiento operativo',
                transaction_date: form.transaction_date,
                type: 'income'
            }

            await api.post(`/providers/${props.entityId}/balance`, payload)
            notify.success('Obligación financiera registrada.')
            emit('saved')
            emit('close')
            return
        }

        // Lógica para Inversionistas / Otros
        if (form.type === 'expense' && Number(form.amount) > props.availableBalance) {
            throw new Error(`Fondos insuficientes. Límite: ${formatCurrency(props.availableBalance)}`)
        }

        const payload = {
            account_id: props.entityId,
            user_id: authStore.authUser?.id,
            source_type: isInvestor.value ? 'investor' : 'account',
            type: form.type,
            amount: Math.abs(form.amount),
            category: form.category,
            description: form.description || 'Ajuste manual de tesorería',
            transaction_date: form.transaction_date,
            entity_type: (form.type === 'expense' && form.target_account_id) ? 'App\\Models\\Account' : null,
            entity_id: (form.type === 'expense' && form.target_account_id) ? form.target_account_id : null
        }

        await api.post('/transactions/internal', payload)
        notify.success('Operación de tesorería completada.')
        emit('saved')
        emit('close')

    } catch (error) {
        notify.error(error.response?.data?.message || error.message || 'Fallo en la operación.')
    } finally {
        isSubmitting.value = false
    }
}

watch(() => props.show, (val) => {
    if (val) {
        resetForm()
        fetchData()
    }
})
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
          <!-- Selector de Operación Premium -->
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
/* Transiciones suaves para el selector de tipo */
button { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
</style>