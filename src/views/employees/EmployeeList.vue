<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import BaseTable from '@/components/ui/BaseTable.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import Pagination from '@/components/ui/Pagination.vue'
import BaseCard from '@/components/shared/BaseCard.vue'
import EmployeeFormModal from './EmployeeFormModal.vue'
import { useEmployeeList } from '@/composables/employees/useEmployeeList'

const {
  employees,
  pagination,
  isLoading,
  filters,
  isProcessing,
  showFormModal,
  selectedEmployee,
  totalEmployees,
  totalPayrollUSD,
  totalPending,
  fetchEmployees,
  openCreate,
  openEdit,
  deleteEmployee,
  processPayroll,
  formatNumber
} = useEmployeeList()

const headers = [
    { key: 'name', label: 'Colaborador / Identidad' },
    { key: 'position', label: 'Cargo / Función' },
    { key: 'salary', label: 'Compensación' },
    { key: 'frequency', label: 'Ciclo de Pago' },
    { key: 'pending_balance', label: 'Deuda Acumulada' },
    { key: 'status', label: 'Estado' },
    { key: 'actions', label: '' },
]
</script>

<template>
    <div class="space-y-10 animate-premium-in pb-12">
        
        <!-- Header Premium -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <h1 class="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                    <span class="w-1.5 h-10 bg-primary rounded-full"></span>
                    Gestión de <span class="text-gradient-primary">Nómina</span>
                </h1>
                <p class="text-white/30 text-xs font-bold uppercase tracking-[0.2em] mt-2 ml-4">Administración estratégica del capital humano</p>
            </div>

            <div class="flex flex-wrap gap-3">
                <button 
                  @click="processPayroll()" 
                  :disabled="isProcessing" 
                  class="bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 px-6 py-3.5 rounded-2xl font-black transition-all flex items-center gap-3 group disabled:opacity-50 active:scale-95 shadow-lg"
                >
                    <FontAwesomeIcon 
                      v-if="!isProcessing" 
                      icon="fa-solid fa-bolt" 
                      class="text-warning group-hover:scale-125 transition-transform duration-500" 
                    />
                    <FontAwesomeIcon v-else icon="fa-solid fa-circle-notch" spin />
                    <span class="text-sm">{{ isProcessing ? 'Sincronizando...' : 'Ejecutar Nómina General' }}</span>
                </button>

                <button 
                  @click="openCreate" 
                  class="bg-primary hover:bg-primary-dark text-secondary px-6 py-3.5 rounded-2xl font-black transition-all shadow-[0_10px_30px_rgba(247,166,0,0.2)] flex items-center gap-3 group active:scale-95"
                >
                    <FontAwesomeIcon icon="fa-solid fa-person-circle-plus" class="text-lg group-hover:rotate-12 transition-transform duration-500" />
                    <span class="text-sm">Nuevo Ingreso</span>
                </button>
            </div>
        </div>

        <!-- Panel de KPI v5 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <!-- Card: Plantilla -->
          <div class="premium-card p-6 bg-white/[0.02]">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-12 h-12 rounded-2xl bg-info/10 flex items-center justify-center text-info border border-info/10 shadow-inner">
                <FontAwesomeIcon icon="fa-solid fa-user-group" class="text-xl" />
              </div>
              <div class="flex flex-col">
                <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/30 leading-none mb-1">Talento Humano</span>
                <span class="text-xs font-bold text-info/60">Plantilla total activa</span>
              </div>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-4xl font-black text-white tracking-tighter">{{ totalEmployees }}</span>
              <span class="text-xs font-bold text-white/20 uppercase tracking-widest">Colaboradores</span>
            </div>
          </div>

          <!-- Card: Payroll Monthly -->
          <div class="premium-card p-6 bg-white/[0.02]">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10 shadow-inner">
                <FontAwesomeIcon icon="fa-solid fa-money-check-dollar" class="text-xl" />
              </div>
              <div class="flex flex-col">
                <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/30 leading-none mb-1">Compromiso Mensual</span>
                <span class="text-xs font-bold text-primary/60">Costo operativo de nómina</span>
              </div>
            </div>
            <div class="flex items-baseline gap-1">
              <span class="text-xs font-black text-primary/60 mr-1">$</span>
              <span class="text-4xl font-black text-white tracking-tighter">{{ formatNumber(totalPayrollUSD).split(',')[0] }}</span>
              <span class="text-lg font-bold text-white/20 tracking-tighter">.{{ formatNumber(totalPayrollUSD).split(',')[1] }}</span>
            </div>
          </div>

          <!-- Card: Deuda Pendiente -->
          <div class="premium-card p-6 border-danger/5 bg-danger/[0.01]">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center text-danger border border-danger/10 shadow-inner">
                 <FontAwesomeIcon icon="fa-solid fa-hand-holding-medical" class="text-xl" />
              </div>
              <div class="flex flex-col">
                <span class="text-[0.6rem] font-black uppercase tracking-widest text-white/30 leading-none mb-1">Pasivo Laboral</span>
                <span class="text-xs font-bold text-danger/60">Saldo total pendiente</span>
              </div>
            </div>
            <div class="flex items-baseline gap-1">
              <span class="text-xs font-black text-danger/60 mr-1">$</span>
              <span class="text-4xl font-black text-white tracking-tighter">{{ formatNumber(totalPending).split(',')[0] }}</span>
              <span class="text-lg font-bold text-white/20 tracking-tighter">.{{ formatNumber(totalPending).split(',')[1] }}</span>
            </div>
          </div>
        </div>

        <FilterBar @update:filters="filters = $event" placeholder="Buscar colaborador por nombre, cargo o identificación..." />

        <BaseCard title="Plantilla de Colaboradores" subtitle="Directorio técnico para el procesamiento de pagos y auditoría de haberes.">
            <BaseTable :headers="headers" :data="employees" :is-loading="isLoading">
                <tr v-for="emp in employees" :key="emp.id" class="group hover:bg-white/[0.01] transition-colors">
                    
                    <!-- Empleado -->
                    <td class="font-bold text-white py-5 group-hover:text-primary transition-colors">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-[0.8rem] font-black text-white/40 border border-white/10 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-all duration-500">
                          {{ emp.name.charAt(0).toUpperCase() }}
                        </div>
                        <div class="flex flex-col">
                          <span class="text-sm tracking-tight leading-tight">{{ emp.name }}</span>
                          <span class="text-[0.6rem] font-black text-white/20 uppercase tracking-[0.2em] mt-0.5">{{ emp.email || 'SIN CONTACTO' }}</span>
                        </div>
                      </div>
                    </td>
                    
                    <!-- Cargo -->
                    <td>
                        <span class="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-[0.6rem] font-black uppercase tracking-[0.15em] text-white/40 group-hover:text-white/60 transition-colors">
                            {{ emp.position || 'OPERACIONES' }}
                        </span>
                    </td>

                    <!-- Salario -->
                    <td>
                        <div class="flex flex-col gap-0.5">
                            <span class="text-sm font-black text-white tracking-tight">
                              {{ formatNumber(emp.salary_amount) }}
                            </span>
                            <span class="text-[0.6rem] font-black uppercase tracking-widest text-info/60">{{ emp.currency_code }} / base</span>
                        </div>
                    </td>

                    <!-- Frecuencia -->
                    <td>
                        <div class="flex flex-col">
                            <span class="text-xs font-bold text-white/70">{{ emp.payment_frequency === 'biweekly' ? 'Quincenal' : (emp.payment_frequency === 'weekly' ? 'Semanal' : 'Mensual') }}</span>
                            <span class="text-[0.6rem] font-black text-white/20 uppercase tracking-tighter mt-0.5">
                                {{ emp.payment_frequency === 'biweekly' ? `Días ${emp.payment_day_1} y ${emp.payment_day_2}` : `Corte: Día ${emp.payment_day_1}` }}
                            </span>
                        </div>
                    </td>

                    <!-- Saldo Pendiente -->
                    <td>
                        <div v-if="emp.pending_balance && emp.pending_balance !== '0.00'" class="flex flex-col">
                            <span class="text-sm font-black text-danger tracking-tighter shadow-danger/20 drop-shadow-sm">
                                {{ formatNumber(emp.pending_balance) }}
                            </span>
                            <span class="text-[0.6rem] font-black uppercase tracking-[0.2em] text-danger/40">Adeudado</span>
                        </div>
                        <div v-else class="flex items-center gap-2">
                           <span class="w-1.5 h-1.5 rounded-full bg-success/40"></span>
                           <span class="text-[0.65rem] font-black text-success/40 uppercase tracking-widest">Al día</span>
                        </div>
                    </td>

                    <!-- Estado -->
                    <td>
                        <span 
                          class="px-3 py-1.5 rounded-xl text-[0.6rem] font-black uppercase tracking-[0.2em] transition-all border"
                          :class="emp.is_active 
                            ? 'bg-success/5 text-success border-success/20 shadow-[0_0_15px_rgba(46,204,113,0.05)]' 
                            : 'bg-white/5 text-white/20 border-white/5 opacity-50'"
                        >
                            {{ emp.is_active ? 'Activo' : 'Baja' }}
                        </span>
                    </td>

                    <!-- Acciones -->
                    <td>
                        <div class="flex justify-end gap-2 opacity-10 group-hover:opacity-100 transition-all duration-300">
                            <button 
                              class="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-all hover:bg-primary hover:text-secondary hover:shadow-lg active:scale-90" 
                              title="Generar Haber" 
                              @click="processPayroll(emp)"
                            >
                                <FontAwesomeIcon icon="fa-solid fa-file-invoice" />
                            </button>

                            <button 
                              class="w-9 h-9 rounded-xl bg-info/10 text-info flex items-center justify-center transition-all hover:bg-info hover:text-white hover:shadow-lg active:scale-90"
                              @click="openEdit(emp)"
                              title="Configurar Perfil"
                            >
                                <FontAwesomeIcon icon="fa-solid fa-user-gear" />
                            </button>

                            <button 
                              class="w-9 h-9 rounded-xl bg-danger/10 text-danger flex items-center justify-center transition-all hover:bg-danger hover:text-white hover:shadow-lg active:scale-90"
                              @click="deleteEmployee(emp)"
                              title="Eliminar"
                            >
                                <FontAwesomeIcon icon="fa-solid fa-user-xmark" />
                            </button>
                        </div>
                    </td>
                </tr>
            </BaseTable>

            <template #footer>
                <div class="flex justify-between items-center px-4 py-2">
                   <div class="text-[0.65rem] font-black text-white/10 uppercase tracking-widest hidden md:block">
                     Mostrando {{ employees.length }} de {{ pagination.total || '...' }} resultados
                   </div>
                   <Pagination :pagination="pagination" @change-page="fetchEmployees" />
                </div>
            </template>
        </BaseCard>

        <EmployeeFormModal :show="showFormModal" :employee="selectedEmployee" @close="showFormModal = false"
            @saved="fetchEmployees" />

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
  border-radius: 2rem;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-premium-in {
  animation: slideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>