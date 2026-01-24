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

const form = reactive({
    amount: '',
    type: 'income',
    description: '',
    category: 'Carga de Saldo',
    transaction_date: new Date().toISOString().split('T')[0],
    target_account_id: null
})

// Títulos dinámicos
const title = computed(() => {
    if (props.resource === 'investors') return 'Gestionar Capital'
    if (props.resource === 'providers') return 'Gestionar Saldo'
    return 'Ajuste de Saldo'
})

const updateCategory = () => {
    if (form.type === 'income') {
        form.category = props.resource === 'investors' ? 'Aporte de Capital' : 'Carga de Saldo'
    } else {
        form.category = 'Retiro de Fondos / Transferencia'
    }
}

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

const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

// Reemplaza SOLO la función handleSubmit en tu BalanceFormModal.vue

const handleSubmit = async () => {
    // 1. Validación de saldo para retiros (Mantenemos tu validación)
    if (form.type === 'expense') {
        if (Number(form.amount) > props.availableBalance) {
            notify.error(`Saldo insuficiente. Disponible: ${formatMoney(props.availableBalance)}`)
            return
        }
    }

    isSubmitting.value = true
    updateCategory()

    try {
        let url = '/transactions/internal'

        // Payload base (Tu código original)
        let payload = {
            account_id: props.entityId,
            user_id: authStore.authUser?.id,
            source_type: getSourceType(),
            type: form.type, // <--- Esto lo modificaremos solo si es necesario
            amount: Math.abs(form.amount), // Aseguramos que siempre vaya positivo
            category: form.category,
            description: form.description || 'Movimiento manual',
            transaction_date: form.transaction_date,
            entity_type: null,
            entity_id: null
        }

        // ============================================================
        // CASO 1: PROVEEDOR -> SUMAR (Recarga)
        // ============================================================
        // Esta parte ya funcionaba bien, la dejamos igual.
        if (props.resource === 'providers' && form.type === 'income') {
            url = `/providers/${props.entityId}/balance`
            payload = {
                amount: form.amount,
                description: form.description || 'Recarga de saldo disponible'
            }
        }

        // ============================================================
        // CASO 2: PROVEEDOR -> RESTAR (Retiro) - 🔥 AQUÍ ESTÁ EL FIX 🔥
        // ============================================================
        else if (props.resource === 'providers' && form.type === 'expense') {
            // TRUCO: Si tú "Restas" al proveedor, para la empresa es un "Ingreso" (Income).
            // Cambiamos el tipo en el payload para que el backend reste el saldo.
            payload.type = 'income';

            // Si el usuario eligió una cuenta destino (ej: Banco), configuramos la entidad destino
            if (form.target_account_id) {
                payload.entity_type = 'App\\Models\\Account';
                payload.entity_id = form.target_account_id;
            }
        }

        // ============================================================
        // CASO 3: RESTO (Inversionistas / Cuentas)
        // ============================================================
        // Mantenemos tu lógica original para todo lo demás
        else if (form.type === 'expense' && form.target_account_id) {
            payload.entity_type = 'App\\Models\\Account'
            payload.entity_id = form.target_account_id
            if (!form.description) payload.description = `Transferencia a mis cuentas`
        }

        await api.post(url, payload)

        notify.success('Operación realizada con éxito')
        emit('saved')
        emit('close')

        // Limpiar campos
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
                            RESTAR (-)
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

                    <BaseInput label="Monto" type="number" step="0.01" v-model="form.amount" required
                        placeholder="0.00" />

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
/* ESTILOS BASE (PC) */
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
    width: 450px;
    /* Un poco más ancho en PC */
    color: white;
    border: 1px solid #333;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    max-height: 90vh;
    /* Evita que se salga si es muy alto */
    overflow-y: auto;
    /* Scroll interno si hace falta */
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
    /* Color de marca */
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

.type-selector {
    display: flex;
    margin-bottom: 20px;
    border-radius: 8px;
    overflow: hidden;
    gap: 5px;
    /* Espacio entre botones */
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

.destination-box {
    background: rgba(192, 57, 43, 0.1);
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #c0392b;
    margin-bottom: 20px;
}

.destination-box label {
    display: block;
    margin-bottom: 8px;
    font-size: 0.9rem;
    color: #ffadad;
    font-weight: bold;
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

/* ==========================================================================
   RESPONSIVIDAD (MÓVIL)
   ========================================================================== */
@media (max-width: 768px) {

    /* Modal Ancho Completo */
    .modal-content {
        width: 95%;
        max-height: 95vh;
        padding: 20px;
        margin: 10px;
    }

    /* Botones Tipo (+/-) Verticales si es muy estrecho */
    .type-selector {
        gap: 10px;
    }

    .type-selector label {
        padding: 12px;
        /* Táctil */
    }

    /* Inputs más grandes */
    .form-select,
    input {
        height: 48px;
        /* Altura touch */
    }

    /* Botones de Acción Apilados */
    .modal-actions {
        flex-direction: column-reverse;
        /* Cancelar abajo */
        gap: 10px;
    }

    .btn-primary,
    .btn-cancel {
        width: 100%;
        justify-content: center;
        padding: 14px;
    }
}
</style>