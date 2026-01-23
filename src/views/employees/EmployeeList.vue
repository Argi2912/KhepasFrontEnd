<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'
import alert from '@/services/alert'
import BaseTable from '@/components/ui/BaseTable.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import Pagination from '@/components/ui/Pagination.vue'
import BaseCard from '@/components/shared/BaseCard.vue'
import EmployeeFormModal from './EmployeeFormModal.vue'

// Estado
const employees = ref([])
const pagination = ref({})
const isLoading = ref(false)
const filters = ref({})
const isProcessing = ref(false)

// Modals
const showFormModal = ref(false)
const selectedEmployee = ref(null)

const headers = [
    { key: 'name', label: 'Empleado' },
    { key: 'position', label: 'Cargo' },
    { key: 'salary', label: 'Salario' },
    { key: 'frequency', label: 'Frecuencia' },
    { key: 'pending_balance', label: '🔴 Saldo Pendiente' },
    { key: 'status', label: 'Estado' },
]

// Cargar datos
const fetchEmployees = async (page = 1) => {
    isLoading.value = true
    try {
        const params = { page, ...filters.value }
        const { data } = await api.get('/employees', { params })
        employees.value = data.data
        pagination.value = data.meta || {}
    } catch (error) {
        notify.error('Error cargando empleados')
    } finally {
        isLoading.value = false
    }
}

// Acciones CRUD
const openCreate = () => {
    selectedEmployee.value = null
    showFormModal.value = true
}

const openEdit = (emp) => {
    selectedEmployee.value = emp
    showFormModal.value = true
}

const deleteEmployee = async (emp) => {
    const confirm = await alert.confirm(`¿Eliminar a ${emp.name}?`)
    if (confirm) {
        try {
            await api.delete(`/employees/${emp.id}`)
            notify.success('Eliminado correctamente')
            fetchEmployees()
        } catch (e) {
            notify.error('No se pudo eliminar')
        }
    }
}

// ---> FUNCIÓN DE NÓMINA INTELIGENTE <---
// Si se pasa 'emp', procesa solo ese. Si no, procesa todos.
const processPayroll = async (emp = null) => {
    const isSingle = !!emp
    const msg = isSingle
        ? `¿Generar nómina individual para ${emp.name}?`
        : '¿Generar deuda de nómina para TODOS los empleados activos?'

    const confirm = await alert.confirm(msg)

    if (confirm) {
        isProcessing.value = true
        try {
            // Si es individual enviamos { employee_id: 123 }, si no enviamos vacío
            const payload = isSingle ? { employee_id: emp.id } : {}

            const { data } = await api.post('/employees/process-payroll', payload)

            notify.success(data.message)
            fetchEmployees()
        } catch (error) {
            console.error(error)
            notify.error('Error al procesar la nómina')
        } finally {
            isProcessing.value = false
        }
    }
}

// Watchers e Init
watch(filters, () => fetchEmployees(1), { deep: true })
onMounted(() => fetchEmployees())

</script>

<template>
    <div class="employee-view">
        <div class="header-actions">
            <h1>Gestión de Nómina</h1>

            <div class="buttons-group">
                <button @click="processPayroll()" :disabled="isProcessing" class="btn-secondary">
                    <span v-if="isProcessing">Procesando...</span>
                    <span v-else>⚡ Procesar Nómina General</span>
                </button>

                <button @click="openCreate" class="btn-primary">
                    + Nuevo Empleado
                </button>
            </div>
        </div>

        <FilterBar @update:filters="filters = $event" placeholder="Buscar empleado..." />

        <BaseCard>
            <BaseTable :headers="headers" :data="employees" :loading="isLoading">
                <tr v-for="emp in employees" :key="emp.id">
                    <td>
                        <div class="emp-info">
                            <strong>{{ emp.name }}</strong>
                            <span class="sub-text">{{ emp.email }}</span>
                        </div>
                    </td>
                    <td>{{ emp.position || '-' }}</td>
                    <td>
                        <span class="salary-tag">
                            {{ Number(emp.salary_amount).toLocaleString() }} {{ emp.currency_code }}
                        </span>
                    </td>
                    <td>
                        <span v-if="emp.payment_frequency === 'biweekly'">Quincenal ({{ emp.payment_day_1 }}/{{
                            emp.payment_day_2 }})</span>
                        <span v-else-if="emp.payment_frequency === 'weekly'">Semanal</span>
                        <span v-else>Mensual ({{ emp.payment_day_1 }})</span>
                    </td>

                    <td class="balance-cell">
                        <span v-if="emp.pending_balance && emp.pending_balance !== '0.00'" class="debt-text">
                            {{ emp.pending_balance }}
                        </span>

                        <span v-else class="ok-text">
                            Al día
                        </span>
                    </td>

                    <td>
                        <span :class="['status-badge', emp.is_active ? 'active' : 'inactive']">
                            {{ emp.is_active ? 'Activo' : 'Inactivo' }}
                        </span>
                    </td>

                    <td class="actions">
                        <button class="btn-icon payroll" title="Generar Nómina Individual" @click="processPayroll(emp)">
                            📅
                        </button>

                        <button class="btn-icon edit" @click="openEdit(emp)">✏️</button>
                        <button class="btn-icon delete" @click="deleteEmployee(emp)">🗑️</button>
                    </td>
                </tr>
            </BaseTable>

            <template #footer>
                <Pagination :pagination="pagination" @change-page="fetchEmployees" />
            </template>
        </BaseCard>

        <EmployeeFormModal :show="showFormModal" :employee="selectedEmployee" @close="showFormModal = false"
            @saved="fetchEmployees" />

    </div>
</template>

<style scoped>
.header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.buttons-group {
    display: flex;
    gap: 10px;
}

.btn-primary {
    background: var(--color-primary);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
}

.btn-secondary {
    background: #424242;
    color: white;
    border: 1px solid #666;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.3s ease;
}

.btn-secondary:hover {
    background: #616161;
    border-color: #888;
}

.btn-secondary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    background: #2c2c2c;
}

/* --- ESTILOS TABLA --- */
.emp-info {
    display: flex;
    flex-direction: column;
}

.sub-text {
    font-size: 0.8rem;
    color: #666;
}

.salary-tag {
    background: #e3f2fd;
    color: #1565c0;
    padding: 3px 8px;
    border-radius: 4px;
    font-weight: bold;
    font-size: 0.9rem;
}

.balance-cell {
    font-weight: bold;
}

.debt-text {
    color: #d32f2f;
}

.ok-text {
    color: #388e3c;
    font-size: 0.85rem;
    font-style: italic;
}

.status-badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    text-transform: uppercase;
}

.status-badge.active {
    background: #e8f5e9;
    color: #2e7d32;
}

.status-badge.inactive {
    background: #ffebee;
    color: #c62828;
}

.actions {
    display: flex;
    gap: 5px;
}

.btn-icon {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.1rem;
    padding: 5px;
    transition: transform 0.1s;
}

.btn-icon:hover {
    transform: scale(1.1);
}

.payroll:hover {
    transform: scale(1.2);
    /* Un poco más grande para destacar */
}
</style>