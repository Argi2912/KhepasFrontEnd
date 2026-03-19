<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import BaseCard from '@/components/shared/BaseCard.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import BaseTable from '@/components/ui/BaseTable.vue'

// --- ESTADO ---
const isLoading = ref(false)
const isDownloading = ref(false)
const selectedDate = ref(new Date().toISOString().split('T')[0])
const data = ref({
    global_summary: [],
    accounts_details: [],
    movements: []
})

const fetchClosing = async () => {
    isLoading.value = true
    try {
        const response = await api.get('/daily-closing', {
            params: { date: selectedDate.value }
        })
        if (response.data && response.data.movements) {
            data.value = response.data
        } else {
            notify.error("Nodo de cierre sin datos estructurados.")
        }
    } catch (error) {
        notify.error('Fallo al sincronizar auditoría de cierre.')
    } finally {
        isLoading.value = false
    }
}

const formatMoney = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(amount || 0) + ` ${currency}`
}

const downloadReport = async (format) => {
    isDownloading.value = true
    try {
        const dateStr = selectedDate.value;
        const response = await api.get('/reports/download', {
            params: {
                report_type: 'internal',
                format: format,
                start_date: dateStr,
                end_date: dateStr
            },
            responseType: 'blob'
        })
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.download = `Cierre_Caja_${dateStr}.${format === 'excel' ? 'xlsx' : 'pdf'}`
        link.click()
        notify.success(`Documentación de cierre exportada.`)
    } catch (error) {
        notify.error('Fallo al generar el reporte de auditoría.')
    } finally {
        isDownloading.value = false
    }
}

watch(selectedDate, () => fetchClosing())
onMounted(() => fetchClosing())
</script>

<template>
  <div class="space-y-10 animate-premium-in pb-12 overflow-hidden">
    
    <!-- Header Premium de Auditoría -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
        <h1 class="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <span class="w-1.5 h-10 bg-primary rounded-full"></span>
          Cierre <span class="text-gradient-primary">Diario</span>
        </h1>
        <p class="text-white/30 text-xs font-bold uppercase tracking-[0.2em] mt-2 ml-4">Consolidado de auditoría y flujo multimoneda</p>
      </div>

      <div class="flex items-center gap-4">
        <div class="flex items-center bg-white/[0.04] p-1.5 rounded-2xl border border-white/5 shadow-inner">
           <input type="date" v-model="selectedDate" class="bg-transparent text-white/60 text-[0.7rem] font-black uppercase tracking-widest px-4 py-2 outline-none cursor-pointer hover:text-white transition-colors" />
           <div class="w-px h-4 bg-white/10 mx-2"></div>
           <button @click="fetchClosing" class="w-9 h-9 rounded-xl hover:bg-white/5 text-white/20 hover:text-primary transition-all flex items-center justify-center">
             <FontAwesomeIcon icon="fa-solid fa-rotate" :spin="isLoading" />
           </button>
        </div>

        <div class="flex items-center gap-2">
            <BaseButton @click="downloadReport('excel')" :disabled="isDownloading" variant="secondary" outline class="!px-4">
                <FontAwesomeIcon icon="fa-solid fa-file-excel" class="mr-2" /> Excel
            </BaseButton>
            <BaseButton @click="downloadReport('pdf')" :disabled="isDownloading" variant="secondary" outline class="!px-4">
                <FontAwesomeIcon icon="fa-solid fa-file-pdf" class="mr-2" /> PDF
            </BaseButton>
        </div>
      </div>
    </div>

    <!-- Resumen Multimoneda v5 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6" v-if="!isLoading">
      <div v-for="stat in data.global_summary" :key="stat.currency" class="premium-card p-6 bg-white/[0.02] group">
        <div class="flex justify-between items-start mb-6">
           <div class="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[0.65rem] font-black tracking-widest uppercase">
              {{ stat.currency === 'BS' ? 'VES' : stat.currency }}
           </div>
           <span class="text-[0.55rem] font-black text-white/20 uppercase tracking-[0.3em]">Auditoría Neta</span>
        </div>

        <div class="space-y-3 mb-6">
           <div class="flex justify-between items-center text-[0.7rem]">
              <span class="font-bold text-white/30 uppercase tracking-tighter">Entradas</span>
              <span class="font-black text-success tracking-tighter">+ {{ formatMoney(stat.total_income) }}</span>
           </div>
           <div class="flex justify-between items-center text-[0.7rem]">
              <span class="font-bold text-white/30 uppercase tracking-tighter">Salidas</span>
              <span class="font-black text-danger tracking-tighter">- {{ formatMoney(stat.total_expense) }}</span>
           </div>
        </div>

        <div class="pt-4 border-t border-white/5 flex flex-col">
           <span class="text-[0.6rem] font-black text-white/20 uppercase tracking-widest mb-1">Balance del Día</span>
           <div class="flex items-baseline gap-1">
             <span class="text-3xl font-black text-white tracking-tighter" :class="stat.net_balance >= 0 ? 'text-white' : 'text-danger'">
                {{ formatMoney(stat.net_balance).split(' ')[0] }}
             </span>
             <span class="text-xs font-black text-white/20 uppercase ml-1">{{ stat.currency }}</span>
           </div>
        </div>
      </div>

      <div v-if="!data.global_summary || data.global_summary.length === 0" class="md:col-span-3 py-16 flex flex-col items-center justify-center bg-white/[0.02] rounded-[2.5rem] border border-dashed border-white/5">
          <FontAwesomeIcon icon="fa-solid fa-box-open" class="text-4xl text-white/5 mb-4" />
          <p class="text-[0.65rem] font-black text-white/20 uppercase tracking-[0.3em]">Nodo de transacciones vacío para esta fecha</p>
      </div>
    </div>

    <!-- Balance por Cuentas v5 -->
    <BaseCard v-if="data.accounts_details.length > 0" title="Consolidación de Arqueo" subtitle="Desglose por nodos financieros y flujos de caja locales.">
       <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="text-[0.65rem] font-black text-white/20 uppercase tracking-[0.2em] border-b border-white/5">
                <th class="py-4 px-2">Nodo de Capital</th>
                <th class="py-4 px-2 text-right">In (+)</th>
                <th class="py-4 px-2 text-right">Out (-)</th>
                <th class="py-4 px-2 text-right">Flujo Real</th>
                <th class="py-4 px-2 text-right">Fondo Final</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr v-for="acc in data.accounts_details" :key="acc.account_id" class="group hover:bg-white/[0.02] transition-colors">
                <td class="py-4 px-2">
                  <span class="text-sm font-black text-white group-hover:text-primary transition-colors tracking-tight">{{ acc.account_name }}</span>
                  <span class="text-[0.6rem] font-bold text-white/20 uppercase tracking-widest block">{{ acc.currency }}</span>
                </td>
                <td class="py-4 px-2 text-right text-sm font-bold text-success/60">+{{ formatMoney(acc.income).split(' ')[0] }}</td>
                <td class="py-4 px-2 text-right text-sm font-bold text-danger/60">-{{ formatMoney(acc.expense).split(' ')[0] }}</td>
                <td class="py-4 px-2 text-right">
                  <span class="text-sm font-black tracking-tighter" :class="acc.net_flow >= 0 ? 'text-success' : 'text-danger'">
                    {{ formatMoney(acc.net_flow).split(' ')[0] }}
                  </span>
                </td>
                <td class="py-4 px-2 text-right">
                  <span class="text-sm font-black text-primary tracking-tighter">{{ formatMoney(acc.final_balance).split(' ')[0] }}</span>
                </td>
              </tr>
            </tbody>
          </table>
       </div>
    </BaseCard>

    <!-- Transacciones Maestras v5 -->
    <BaseCard v-if="data.movements.length > 0" title="Registro Maestro de Movimientos" subtitle="Secuencia cronológica de todas las alteraciones de fondo registradas.">
       <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="text-[0.65rem] font-black text-white/20 uppercase tracking-[0.2em] border-b border-white/5">
                <th class="py-4 px-2">Tiempo</th>
                <th class="py-4 px-2">Taxonomía</th>
                <th class="py-4 px-2">Descripción</th>
                <th class="py-4 px-2">Autor</th>
                <th class="py-4 px-2 text-right">Monto Final</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr v-for="mov in data.movements" :key="mov.id" class="group hover:bg-white/[0.02] transition-colors">
                <td class="py-4 px-2 font-mono text-[0.7rem] text-white/40 tracking-tighter">{{ mov.time }}</td>
                <td class="py-4 px-2">
                  <span 
                    class="px-2 py-0.5 rounded-md text-[0.55rem] font-black uppercase tracking-widest transition-colors duration-300"
                    :class="mov.type === 'info' 
                      ? 'bg-primary/10 border border-primary/20 text-primary/80 shadow-[0_0_10px_rgba(247,166,0,0.1)]' 
                      : 'bg-white/5 border border-white/10 text-white/40'"
                  >
                    {{ mov.category }}
                  </span>
                </td>
                <td class="py-4 px-2">
                  <p class="text-[0.8rem] font-bold text-white/60 truncate max-w-[250px] tracking-tight" :class="{ 'italic text-white/30': mov.type === 'info' }">
                    {{ mov.description }}
                  </p>
                  <p class="text-[0.65rem] font-bold text-primary/80 mt-1 flex items-center gap-1 uppercase tracking-widest">
                    <FontAwesomeIcon icon="fa-solid fa-wallet" class="text-primary/50" /> {{ mov.account }}
                  </p>
                </td>
                <td class="py-4 px-2 text-[0.65rem] font-black text-primary/60 uppercase tracking-widest">{{ mov.person || 'NODO CENTRAL' }}</td>
                <td class="py-4 px-2 text-right">
                  <span 
                    class="text-sm font-black tracking-tighter transition-all duration-300" 
                    :class="{
                      'text-success drop-shadow-[0_0_8px_rgba(14,203,129,0.3)]': mov.type === 'income',
                      'text-danger drop-shadow-[0_0_8px_rgba(246,70,93,0.3)]': mov.type === 'expense',
                      'text-primary/70 font-bold': mov.type === 'info'
                    }"
                  >
                    <template v-if="mov.type === 'income'">+</template>
                    <template v-else-if="mov.type === 'expense'">-</template>
                    <template v-else>• </template>
                    {{ formatMoney(mov.amount).split(' ')[0] }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
       </div>
    </BaseCard>

  </div>
</template>

<style scoped>
.text-gradient-primary {
  background: linear-gradient(135deg, #f7a600, #f0b90b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>