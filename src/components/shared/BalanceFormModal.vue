<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import notify from '@/services/notify'
import BaseInput from '@/components/ui/BaseInput.vue'

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
const myAccounts = ref([])
const currencies = ref([])

const form = reactive({
    amount: '',
    type: 'income',
    description: '',
    category: 'Carga de Saldo',
    transaction_date: new Date().toISOString().split('T')[0],
    target_account_id: null,

    // Campos exclusivos para Proveedores (Deuda)
    percentage: '',
    debt_currency_id: null
})

// --- COMPUTED PROPERTIES ---

const isProvider = computed(() => props.resource === 'providers')

const title = computed(() => {
    if (props.resource === 'investors') return 'Gestionar Capital'
    if (isProvider.value) return 'Registrar Deuda / Financiamiento'
    return 'Ajuste de Saldo'
})

// Calcula cuánto vas a deber (Monto + Porcentaje)
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
        form.category = props.resource === 'investors' ? 'Aporte de Capital' : 'Carga de Saldo'
    } else {
        form.category = 'Retiro de Fondos / Transferencia'
    }
}

const fetchData = async () => {
    try {
        const [accRes, currRes] = await Promise.all([
            api.get('/accounts'),
            api.get('/currencies')
        ])
        myAccounts.value = accRes.data.data || accRes.data
        currencies.value = currRes.data.data || currRes.data
    } catch (error) {
        console.error('Error cargando datos', error)
        notify.error('Error cargando cuentas o monedas')
    }
}

const getSourceType = () => {
    if (props.resource === 'investors') return 'investor'
    if (props.resource === 'providers') return 'provider'
    return 'account'
}

const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

// --- LIMPIEZA DEL FORMULARIO (CORREGIDO) ---
const resetForm = () => {
    form.amount = ''
    form.description = ''
    form.target_account_id = null
    form.percentage = ''
    form.debt_currency_id = null
    form.type = 'income' // Resetear a default
    form.transaction_date = new Date().toISOString().split('T')[0]
}

// --- SUBMIT HANDLE ---

const handleSubmit = async () => {
    isSubmitting.value = true
    updateCategory()

    try {
        // ============================================================
        // CASO PROVEEDOR: Operación Compuesta (Entrada + Deuda)
        // ============================================================
        if (isProvider.value) {
            // Validaciones específicas
            if (!form.target_account_id) throw new Error('Debes seleccionar la cuenta donde entra el dinero.')
            if (!form.debt_currency_id) throw new Error('Debes seleccionar la moneda de la deuda.')
            if (!form.amount || form.amount <= 0) throw new Error('El monto debe ser mayor a 0.')

            const payload = {
                // 1. Datos de la Entrada de Dinero (Activo)
                amount_received: form.amount,
                target_account_id: form.target_account_id,

                // 2. Datos de la Deuda (Pasivo)
                interest_percentage: form.percentage || 0,
                debt_amount: calculatedDebt.value,
                debt_currency_id: form.debt_currency_id,

                // 3. Generales
                description: form.description || 'Financiamiento de proveedor',
                transaction_date: form.transaction_date,
                type: 'income' // Internamente para provider esto crea deuda
            }

            await api.post(`/providers/${props.entityId}/balance`, payload)

            notify.success('Financiamiento registrado con éxito')
            emit('saved')
            emit('close')
            return
        }

        // ============================================================
        // CASO: Inversionistas / Cuentas (Lógica Original)
        // ============================================================

        // Validación de saldo para retiros
        if (form.type === 'expense' && Number(form.amount) > props.availableBalance) {
            throw new Error(`Saldo insuficiente. Disponible: ${formatMoney(props.availableBalance)}`)
        }

        let url = '/transactions/internal'
        let payload = {
            account_id: props.entityId,
            user_id: authStore.authUser?.id,
            source_type: getSourceType(),
            type: form.type,
            amount: Math.abs(form.amount),
            category: form.category,
            description: form.description || 'Movimiento manual',
            transaction_date: form.transaction_date,
            entity_type: null,
            entity_id: null
        }

        if (form.type === 'expense' && form.target_account_id) {
            payload.entity_type = 'App\\Models\\Account'
            payload.entity_id = form.target_account_id
            if (!form.description) payload.description = `Transferencia a mis cuentas`
        }

        await api.post(url, payload)

        notify.success('Operación realizada con éxito')
        emit('saved')
        emit('close')

    } catch (error) {
        console.error(error)
        const msg = error.response?.data?.message || error.message || 'Error al guardar'
        notify.error(msg)
    } finally {
        isSubmitting.value = false
    }
}

// --- WATCHERS ---

// ALERTA: Aquí estaba el error. Ahora solo reseteamos, NO emitimos cierre.
watch(() => props.show, (val) => {
    if (val) {
        resetForm()
        updateCategory()
    }
})

onMounted(() => {
    fetchData()
    updateCategory()
})
</script>

<template>
    <div v-if="show" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <h3>{{ title }}</h3>
                <button @click="$emit('close')" class="close-btn">&times;</button>
            </div>

            <div class="modal-body">
                <div class="info-entity">
                    Entidad: <strong>{{ entityName }}</strong>
                    <div v-if="resource !== 'accounts' && !isProvider" class="available-display">
                        Disponible: {{ formatMoney(availableBalance) }}
                    </div>
                </div>

                <form @submit.prevent="handleSubmit">

                    <div v-if="isProvider">
                        <div class="form-group section-box">
                            <label class="section-label">1. Entrada de Dinero (Recibido)</label>

                            <div class="form-group" style="margin-bottom: 10px;">
                                <label class="input-label">Cuenta Destino (¿Dónde entra el dinero?)</label>
                                <select v-model="form.target_account_id" class="form-select" required>
                                    <option :value="null" disabled>-- Selecciona tu Caja/Cuenta --</option>
                                    <option v-for="acc in myAccounts" :key="acc.id" :value="acc.id">
                                        {{ acc.name }} ({{ acc.currency?.code || 'USD' }})
                                    </option>
                                </select>
                            </div>

                            <BaseInput label="Monto Recibido" type="number" step="0.01" v-model="form.amount" required
                                placeholder="Ej: 100" />
                        </div>

                        <div class="form-group section-box debt-box">
                            <label class="section-label text-red">2. Registro de Deuda (A Pagar)</label>

                            <div class="row-inputs">
                                <div class="col">
                                    <BaseInput label="% Interés" type="number" step="0.01" v-model="form.percentage"
                                        placeholder="0" />
                                </div>
                                <div class="col">
                                    <label class="input-label">Moneda a Deber</label>
                                    <select v-model="form.debt_currency_id" class="form-select" required>
                                        <option :value="null" disabled>-- Moneda --</option>
                                        <option v-for="curr in currencies" :key="curr.id" :value="curr.id">
                                            {{ curr.code }} - {{ curr.name }}
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div class="calculation-result">
                                <span>Total a Deber:</span>
                                <strong>{{ new Intl.NumberFormat('en-US', {
                                    minimumFractionDigits: 2
                                    }).format(calculatedDebt) }}</strong>
                            </div>
                        </div>
                    </div>

                    <div v-else>
                        <div class="type-selector">
                            <label :class="{ active: form.type === 'income', income: true }" @click="updateCategory">
                                <input type="radio" value="income" v-model="form.type">
                                SUMAR (+)
                            </label>
                            <label :class="{ active: form.type === 'expense', expense: true }" @click="updateCategory">
                                <input type="radio" value="expense" v-model="form.type">
                                RESTAR (-)
                            </label>
                        </div>

                        <div v-if="form.type === 'expense'" class="form-group destination-box">
                            <label>¿A dónde va el dinero? (Opcional)</label>
                            <select v-model="form.target_account_id" class="form-select">
                                <option :value="null">-- Solo descontar (Sin destino) --</option>
                                <option v-for="acc in myAccounts" :key="acc.id" :value="acc.id">
                                    Enviar a: {{ acc.name }} ({{ acc.currency?.code || 'USD' }})
                                </option>
                            </select>
                        </div>

                        <BaseInput label="Monto" type="number" step="0.01" v-model="form.amount" required
                            placeholder="0.00" />
                    </div>

                    <BaseInput label="Fecha" type="date" v-model="form.transaction_date" required />

                    <BaseInput label="Nota / Descripción" v-model="form.description"
                        placeholder="Ej: Préstamo recibido, Pago factura..." />

                    <div class="modal-actions">
                        <button type="button" @click="$emit('close')" class="btn-cancel">Cancelar</button>
                        <button type="submit" class="btn-primary" :disabled="isSubmitting">
                            {{ isSubmitting ? 'Procesando...' : 'Aplicar' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* ESTILOS BASE */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(2px);
}

.modal-content {
    background: #1e2023;
    padding: 25px;
    border-radius: 12px;
    width: 480px;
    /* Un poco más ancho para acomodar las dos columnas */
    color: white;
    border: 1px solid #333;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    max-height: 90vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 1px solid #333;
    padding-bottom: 15px;
}

.modal-header h3 {
    margin: 0;
    font-size: 1.2rem;
    color: #fbbf24;
}

.close-btn {
    background: none;
    border: none;
    color: #aaa;
    font-size: 1.8rem;
    cursor: pointer;
    line-height: 1;
}

/* Info Box */
.info-entity {
    margin-bottom: 20px;
    font-size: 0.95rem;
    color: #ccc;
    text-align: center;
    background: #2c2f33;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #3f3f46;
}

.available-display {
    font-size: 1rem;
    color: #27ae60;
    margin-top: 5px;
    font-weight: bold;
}

/* Selector Sumar/Restar */
.type-selector {
    display: flex;
    margin-bottom: 20px;
    border-radius: 8px;
    overflow: hidden;
    gap: 5px;
}

.type-selector label {
    flex: 1;
    text-align: center;
    padding: 15px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: bold;
    opacity: 0.5;
    transition: all 0.2s;
    background: #25282c;
    border: 1px solid #3f3f46;
    border-radius: 6px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.type-selector input {
    display: none;
}

.type-selector label.active {
    opacity: 1;
    color: white;
    transform: scale(1.02);
    border-color: transparent;
}

.type-selector label.income.active {
    background: #27ae60;
    box-shadow: 0 4px 10px rgba(39, 174, 96, 0.3);
}

.type-selector label.expense.active {
    background: #c0392b;
    box-shadow: 0 4px 10px rgba(192, 57, 43, 0.3);
}

/* Cajas de Sección (Proveedor) */
.section-box {
    background: #25282c;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 15px;
    border: 1px solid #3f3f46;
}

.debt-box {
    border-color: #c0392b;
    /* Rojo suave */
    background: rgba(192, 57, 43, 0.05);
}

.section-label {
    display: block;
    font-size: 0.85rem;
    text-transform: uppercase;
    color: #aaa;
    margin-bottom: 12px;
    border-bottom: 1px solid #444;
    padding-bottom: 5px;
    font-weight: bold;
}

.text-red {
    color: #ff8a80;
}

/* Inputs y Selects */
.input-label {
    display: block;
    margin-bottom: 6px;
    font-size: 0.9rem;
    color: #ccc;
}

.form-select {
    width: 100%;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #555;
    background: #121212;
    color: white;
    font-size: 1rem;
}

.row-inputs {
    display: flex;
    gap: 15px;
}

.col {
    flex: 1;
}

/* Resultado del cálculo */
.calculation-result {
    margin-top: 15px;
    text-align: right;
    font-size: 1.1rem;
    color: #ff8a80;
    padding-top: 10px;
    border-top: 1px dashed #555;
}

.destination-box {
    background: rgba(192, 57, 43, 0.1);
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #c0392b;
    margin-bottom: 20px;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 15px;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #333;
}

.btn-primary {
    background: #fcd535;
    color: black;
    padding: 12px 30px;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    transition: 0.2s;
    font-size: 1rem;
}

.btn-primary:hover {
    background: #e5c12e;
    transform: translateY(-1px);
}

.btn-cancel {
    background: transparent;
    border: 1px solid #555;
    color: #ccc;
    padding: 12px 25px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
}

.btn-cancel:hover {
    background: #333;
    color: white;
}

@media (max-width: 768px) {
    .modal-content {
        width: 95%;
        padding: 20px;
    }

    .row-inputs {
        flex-direction: column;
        gap: 10px;
    }
}
</style>