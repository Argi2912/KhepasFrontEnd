<script setup>
import { ref, watch, onMounted } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import notify from '@/services/notify'
import api from '@/services/api'

const props = defineProps({
    show: Boolean,
    employee: Object
})

const emit = defineEmits(['close', 'saved'])

const isProcessing = ref(false)
const currencies = ref([])

const form = ref({
    name: '',
    identification_doc: '',
    email: '',
    phone: '',
    position: '',
    salary_amount: '',
    currency_code: 'USD',
    payment_frequency: 'biweekly',
    payment_day_1: 15,
    payment_day_2: 30
})

// --- CORRECCIÓN AQUÍ ---
// Usamos 'id' y 'name' para que BaseSelect los lea automáticamente
const frequencies = [
    { id: 'weekly', name: 'Semanal' },
    { id: 'biweekly', name: 'Quincenal' },
    { id: 'monthly', name: 'Mensual' }
]

onMounted(async () => {
    try {
        const { data } = await api.get('/currencies', { params: { per_page: 100 } })
        // --- CORRECCIÓN AQUÍ ---
        // Mapeamos la respuesta de la API a 'id' y 'name'
        currencies.value = data.data.map(c => ({
            id: c.code,          // El valor que se guarda (USD)
            name: `${c.code} - ${c.name}` // El texto que se ve
        }))
    } catch (e) {
        console.error(e)
    }
})

watch(() => props.show, (newVal) => {
    if (newVal) {
        if (props.employee) {
            form.value = { ...props.employee }
        } else {
            form.value = {
                name: '', identification_doc: '', email: '', phone: '',
                position: '', salary_amount: '', currency_code: 'USD',
                payment_frequency: 'biweekly', payment_day_1: 15, payment_day_2: 30
            }
        }
    }
})

const submit = async () => {
    isProcessing.value = true
    try {
        if (props.employee) {
            await api.put(`/employees/${props.employee.id}`, form.value)
            notify.success('Empleado actualizado')
        } else {
            await api.post('/employees', form.value)
            notify.success('Empleado registrado')
        }
        emit('saved')
        emit('close')
    } catch (error) {
        notify.error('Error al guardar')
        console.error(error)
    } finally {
        isProcessing.value = false
    }
}
</script>

<template>
    <BaseModal :show="show" :title="employee ? '✏️ Editar Empleado' : '👷 Nuevo Empleado'" @close="$emit('close')">
        <form @submit.prevent="submit" class="employee-form">

            <h4 class="section-title">Datos Personales</h4>
            <div class="row">
                <BaseInput v-model="form.name" label="Nombre Completo" required />
                <BaseInput v-model="form.identification_doc" label="Cédula / DNI" />
            </div>

            <div class="row">
                <BaseInput v-model="form.email" label="Email" type="email" />
                <BaseInput v-model="form.phone" label="Teléfono" />
            </div>

            <BaseInput v-model="form.position" label="Cargo / Puesto" placeholder="Ej: Cajera" />

            <hr class="divider">

            <h4 class="section-title">Configuración de Pago</h4>
            <div class="row">
                <div class="col">
                    <BaseInput v-model="form.salary_amount" label="Salario Base" type="number" step="0.01" required />
                </div>
                <div class="col">
                    <BaseSelect v-model="form.currency_code" label="Moneda" :options="currencies" required />
                </div>
            </div>

            <div class="row">
                <div class="col">
                    <BaseSelect v-model="form.payment_frequency" label="Frecuencia" :options="frequencies" required />
                </div>

                <div class="payment-days">
                    <BaseInput v-model="form.payment_day_1" label="Día 1" type="number" class="short-input" />
                    <BaseInput v-if="form.payment_frequency === 'biweekly'" v-model="form.payment_day_2" label="Día 2"
                        type="number" class="short-input" />
                </div>
            </div>

        </form>

        <template #footer>
            <div class="actions">
                <button class="btn-cancel" @click="$emit('close')">Cancelar</button>
                <button class="btn-save" @click="submit" :disabled="isProcessing">
                    {{ isProcessing ? 'Guardando...' : 'Guardar' }}
                </button>
            </div>
        </template>
    </BaseModal>
</template>

<style scoped>
.employee-form {
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 10px 0;
}

.row {
    display: flex;
    gap: 15px;
}

.col {
    flex: 1;
}

.section-title {
    font-size: 0.85rem;
    font-weight: bold;
    color: var(--color-primary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 5px;
}

.divider {
    border: 0;
    border-top: 1px dashed #444;
    margin: 5px 0;
}

.payment-days {
    display: flex;
    gap: 10px;
    align-items: flex-end;
}

.short-input {
    width: 70px;
}

.actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.btn-cancel {
    background: #333;
    color: white;
    border: 1px solid #555;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
}

.btn-save {
    background: var(--color-primary);
    color: #000;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
}
</style>