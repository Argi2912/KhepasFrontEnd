<script setup>
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useInternalTransaction } from '@/composables/transactions/useInternalTransaction'

const {
  form,
  entityTypes,
  categoryOptions,
  entityOptions,
  isSubmitting,
  errors,
  handleSubmit,
  transactionStore,
  router
} = useInternalTransaction()
</script>

<template>
  <div class="max-w-3xl mx-auto py-10 px-4 animate-premium-in">
    <div class="mb-10">
      <h1 class="text-3xl font-black text-white tracking-tight flex items-center gap-3">
        <span class="w-1.5 h-10 bg-primary rounded-full"></span>
        Movimiento de <span class="text-gradient-primary">Caja Interna</span>
      </h1>
      <p class="text-white/30 text-xs font-bold uppercase tracking-[0.2em] mt-2 ml-4">Registro de ingresos, egresos y flujos operativos</p>
    </div>

    <div class="premium-card p-8 bg-white/[0.02] border-white/5 shadow-2xl relative overflow-hidden">
      <div class="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 blur-3xl rounded-full"></div>
      
      <form @submit.prevent="handleSubmit" class="relative z-10 space-y-8">
        
        <!-- Selector de Tipo (Ingreso/Egreso) -->
        <div class="flex p-1 bg-black/40 rounded-2xl border border-white/5">
          <label 
            class="flex-1 py-4 text-center cursor-pointer rounded-xl font-black text-xs tracking-widest transition-all duration-300 flex items-center justify-center gap-2"
            :class="form.type === 'income' ? 'bg-success text-white shadow-lg shadow-success/20' : 'text-white/20 hover:text-white/40'"
          >
            <input type="radio" value="income" v-model="form.type" class="hidden" />
            <FontAwesomeIcon icon="fa-solid fa-arrow-trend-up" /> INGRESO / APORTE
          </label>
          <label 
            class="flex-1 py-4 text-center cursor-pointer rounded-xl font-black text-xs tracking-widest transition-all duration-300 flex items-center justify-center gap-2"
            :class="form.type === 'expense' ? 'bg-danger text-white shadow-lg shadow-danger/20' : 'text-white/20 hover:text-white/40'"
          >
            <input type="radio" value="expense" v-model="form.type" class="hidden" />
            <FontAwesomeIcon icon="fa-solid fa-arrow-trend-down" /> EGRESO / GASTO
          </label>
        </div>
        
        <!-- Estado del Pago (Efectivo vs Deuda) -->
        <div v-if="form.type === 'expense'" class="animate-fade-in">
          <label class="text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/30 mb-3 block ml-4">Estado del Pago</label>
          <div class="flex p-1 bg-black/20 rounded-2xl border border-white/5 gap-2">
            <button 
              type="button"
              @click="form.payment_status = 'paid'"
              class="flex-1 py-3 rounded-xl font-bold text-[0.65rem] uppercase tracking-widest transition-all"
              :class="form.payment_status === 'paid' ? 'bg-white/10 text-white border border-white/10 shadow-lg' : 'text-white/20 hover:text-white/40'"
            >
              🟢 Pago Inmediato
            </button>
            <button 
              type="button"
              @click="form.payment_status = 'pending'"
              class="flex-1 py-3 rounded-xl font-bold text-[0.65rem] uppercase tracking-widest transition-all"
              :class="form.payment_status === 'pending' ? 'bg-warning/20 text-warning border border-warning/20 shadow-lg' : 'text-white/20 hover:text-white/40'"
            >
              🟡 Registrar Deuda
            </button>
          </div>
          <p class="text-[0.6rem] text-white/20 mt-2 ml-4 italic">
            {{ form.payment_status === 'paid' ? 'El dinero se descontará de la caja seleccionada.' : 'Se generará un pasivo (Cuenta por Pagar) en el Libro Mayor.' }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="space-y-6">
            <BaseSelect 
              :label="form.payment_status === 'paid' ? 'Cuenta Afectada (Caja/Banco)' : 'Cuenta Referencial (Opcional)'" 
              :options="transactionStore.getAccounts"
              v-model="form.account_id" 
              :required="form.payment_status === 'paid'" 
              :error="errors.account_id" 
            />

            <div class="relative">
              <BaseInput 
                label="Monto de la Operación" 
                type="number" 
                step="0.01" 
                v-model="form.amount" 
                required 
                :error="errors.amount" 
                class="premium-input-large"
              />
              <span class="absolute right-4 top-10 text-white/20 font-black text-xs">USD</span>
            </div>
          </div>

          <div class="space-y-6">
            <BaseSelect 
              label="Tipo de Beneficiario / Pagador" 
              :options="entityTypes" 
              v-model="form.entity_type" 
              required
              placeholder="Seleccione grupo..." 
            />

            <div v-if="form.entity_type && form.entity_type !== 'manual'" class="animate-fade-in">
              <BaseSelect 
                label="Seleccione la Persona/Entidad" 
                :options="entityOptions" 
                v-model="form.entity_id" 
                required
                :disabled="entityOptions.length === 0"
                :placeholder="entityOptions.length === 0 ? 'Cargando datos...' : 'Busque en la lista...'" 
              />
              <p v-if="entityOptions.length === 0" class="text-[0.6rem] font-bold text-warning/60 mt-2 uppercase tracking-widest">
                ⚠️ Sincronizando registros con el servidor...
              </p>
            </div>

            <div v-if="form.entity_type === 'manual'" class="grid grid-cols-1 gap-4 animate-fade-in">
              <BaseInput 
                label="Nombre de la Persona (Manual)" 
                placeholder="Escriba el nombre..."
                v-model="form.person_name" 
                required 
                :error="errors.person_name" 
              />
              <BaseInput 
                label="Referencia / Titular" 
                placeholder="Titular..." 
                v-model="form.dueño" 
              />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
          <BaseSelect 
            label="Categoría Operativa" 
            :options="categoryOptions" 
            v-model="form.category" 
            required
            :error="errors.category" 
            placeholder="Seleccione categoría..." 
          />
          <BaseInput 
            label="Descripción / Notas Internas" 
            v-model="form.description" 
            placeholder="Detalle adicional del movimiento..."
          />
        </div>

        <div class="flex justify-end items-center gap-6 pt-10">
          <button 
            type="button" 
            @click="router.back()" 
            class="text-xs font-black text-white/20 uppercase tracking-[0.2em] hover:text-white transition-colors"
          >
            Descartar
          </button>
          
          <button 
            type="submit" 
            class="px-10 py-4 bg-primary text-secondary font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            :disabled="isSubmitting"
          >
            <FontAwesomeIcon v-if="isSubmitting" icon="fa-solid fa-circle-notch" spin class="mr-2" />
            {{ isSubmitting ? 'Procesando...' : 'Registrar Movimiento' }}
            <FontAwesomeIcon icon="fa-solid fa-chevron-right" class="ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </form>
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
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 2.5rem;
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
</style>