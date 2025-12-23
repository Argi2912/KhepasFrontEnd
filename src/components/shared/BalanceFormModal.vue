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
    availableBalance: { type: Number, default: 0 } // <--- NUEVO: Recibimos el saldo real para validar
})

const emit = defineEmits(['close', 'saved'])
const authStore = useAuthStore()
const isSubmitting = ref(false)
const myAccounts = ref([])

const form = reactive({
    amount: '',
    type: 'income',
    description: '',
    category: 'Carga de Saldo', // Valor por defecto
    transaction_date: new Date().toISOString().split('T')[0],
    target_account_id: null
})

// Títulos dinámicos
const title = computed(() => {
    if (props.resource === 'investors') return 'Gestionar Capital Inversionista'
    if (props.resource === 'providers') return 'Gestionar Saldo Proveedor'
    return 'Ajuste de Saldo'
})

// Categoría automática (Ya no la pedimos al usuario)
const updateCategory = () => {
    if (form.type === 'income') {
        form.category = props.resource === 'investors' ? 'Aporte de Capital' : 'Carga de Saldo'
    } else {
        form.category = 'Retiro de Fondos / Transferencia'
    }
}

// Cargar bancos
const fetchMyAccounts = async () => {
    try {
        const { data } = await api.get('/accounts')
        myAccounts.value = data.data || data
    } catch (error) {
        console.error('Error cargando cuentas', error)
    }
}

const getSourceType = () => {
    if (props.resource === 'investors') return 'investor'
    if (props.resource === 'providers') return 'provider'
    return 'account'
}

// Formateador de moneda para el mensaje de error
const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

const handleSubmit = async () => {
    // 1. VALIDACIÓN DE SALDO (Solo al restar)
    if (form.type === 'expense') {
        if (Number(form.amount) > props.availableBalance) {
            notify.error(`Saldo insuficiente. Disponible: ${formatMoney(props.availableBalance)}`)
            return // Detenemos el proceso
        }
    }

    isSubmitting.value = true

    // Aseguramos que la categoría tenga valor aunque el input esté oculto
    updateCategory()

    try {
        const payload = {
            account_id: props.entityId,
            user_id: authStore.authUser?.id,
            source_type: getSourceType(),
            type: form.type,
            amount: form.amount,
            category: form.category, // Se envía automático
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

        await api.post('/transactions/internal', payload)

        notify.success('Transacción registrada correctamente')
        emit('saved')
        emit('close')

        // Reset
        form.amount = ''
        form.description = ''
        form.target_account_id = null

    } catch (error) {
        console.error(error)
        const msg = error.response?.data?.message || 'Error al guardar'
        notify.error(msg)
    } finally {
        isSubmitting.value = false
    }
}

// Resetear form al abrir
watch(() => props.show, (val) => {
    if (val) {
        form.amount = ''
        form.description = ''
        form.target_account_id = null
        form.type = 'income'
        updateCategory()
    }
})

onMounted(() => {
    fetchMyAccounts()
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
                    <div v-if="resource !== 'accounts'" class="available-display">
                        Disponible: {{ formatMoney(availableBalance) }}
                    </div>
                </div>

                <form @submit.prevent="handleSubmit">

                    <div class="type-selector">
                        <label :class="{ active: form.type === 'income', income: true }" @click="updateCategory">
                            <input type="radio" value="income" v-model="form.type">
                            SUMAR (+)
                        </label>
                        <label :class="{ active: form.type === 'expense', expense: true }" @click="updateCategory">
                            <input type="radio" value="expense" v-model="form.type">
                            RESTAR / TRANSFERIR (-)
                        </label>
                    </div>

                    <div v-if="form.type === 'expense'" class="form-group destination-box">
                        <label>¿A dónde va el dinero? (Opcional)</label>
                        <select v-model="form.target_account_id" class="form-select">
                            <option :value="null">-- Solo descontar (Sin destino) --</option>
                            <option v-for="acc in myAccounts" :key="acc.id" :value="acc.id">
                                Enviar a: {{ acc.name }} ({{ acc.currency_code }})
                            </option>
                        </select>
                    </div>

                    <BaseInput label="Monto" type="number" step="0.01" v-model="form.amount" required />

                    <BaseInput label="Fecha" type="date" v-model="form.transaction_date" required />
                    <BaseInput label="Nota / Descripción" v-model="form.description"
                        placeholder="Ej: Pago de factura, Retiro..." />

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
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: #1e2023;
    padding: 25px;
    border-radius: 12px;
    width: 420px;
    color: white;
    border: 1px solid #333;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 1px solid #333;
    padding-bottom: 10px;
}

.close-btn {
    background: none;
    border: none;
    color: #aaa;
    font-size: 1.5rem;
    cursor: pointer;
}

/* Info Box */
.info-entity {
    margin-bottom: 15px;
    font-size: 0.95rem;
    color: #ccc;
    text-align: center;
    background: #2c2f33;
    padding: 10px;
    border-radius: 6px;
}

.available-display {
    font-size: 0.85rem;
    color: #27ae60;
    margin-top: 5px;
    font-weight: bold;
}

.type-selector {
    display: flex;
    margin-bottom: 20px;
    border: 1px solid #444;
    border-radius: 6px;
    overflow: hidden;
}

.type-selector label {
    flex: 1;
    text-align: center;
    padding: 12px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: bold;
    opacity: 0.6;
    transition: 0.2s;
    background: #25282c;
}

.type-selector input {
    display: none;
}

.type-selector label.active {
    opacity: 1;
    color: white;
}

.type-selector label.income.active {
    background: #27ae60;
}

.type-selector label.expense.active {
    background: #c0392b;
}

.destination-box {
    background: rgba(192, 57, 43, 0.1);
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #c0392b;
    margin-bottom: 15px;
}

.destination-box label {
    display: block;
    margin-bottom: 5px;
    font-size: 0.9rem;
    color: #ffadad;
    font-weight: bold;
}

.form-select {
    width: 100%;
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #555;
    background: #121212;
    color: white;
    font-size: 0.95rem;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 25px;
}

.btn-primary {
    background: #fcd535;
    color: black;
    padding: 10px 25px;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    transition: 0.2s;
}

.btn-primary:hover {
    background: #e5c12e;
    transform: translateY(-1px);
}

.btn-cancel {
    background: transparent;
    border: 1px solid #555;
    color: #ccc;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
}

.btn-cancel:hover {
    background: #333;
}
</style>