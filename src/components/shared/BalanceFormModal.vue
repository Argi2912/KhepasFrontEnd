<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import notify from '@/services/notify'
import ClientProviderService from '@/services/ClientProviderService'
import api from '@/services/api'

const props = defineProps({
    show: Boolean,
    entityId: [Number, String],
    resource: { type: String, required: true },
    entityName: String
})

const emit = defineEmits(['close', 'saved'])

// Lista de monedas
const currencies = ref([])

const form = ref({
    amount: '',
    currency: '',
})

const isProcessing = ref(false)

// Cargar monedas al iniciar
onMounted(async () => {
    try {
        const response = await api.get('/currencies', { params: { per_page: 100 } })
        currencies.value = response.data.data || []

        if (currencies.value.length > 0) {
            const usd = currencies.value.find(c => c.code === 'USD')
            form.value.currency = usd ? usd.code : currencies.value[0].code
        }
    } catch (error) {
        console.error('Error cargando divisas:', error)
        notify.error('No se pudieron cargar las divisas')
    }
})

const modalTitle = computed(() => {
    const type = props.resource === 'investors' ? 'Capital' : 'Fondos'
    return `💰 Recargar Billetera: ${props.entityName || ''}`
})

watch(() => props.show, (newVal) => {
    if (newVal) {
        // Mantener moneda, limpiar monto
        const currentCurrency = form.value.currency
        form.value = { amount: '', currency: currentCurrency }
    }
})

const submit = async () => {
    if (!form.value.amount || form.value.amount <= 0) {
        notify.error('El monto debe ser mayor a 0')
        return
    }

    isProcessing.value = true
    try {
        const payload = {
            amount: form.value.amount,
            currency: form.value.currency,
            // Descripción automática interna
            description: `Recarga de saldo [${form.value.currency}]`
        }

        await ClientProviderService.addBalance(props.resource, props.entityId, payload)

        notify.success(`Se agregaron ${form.value.amount} ${form.value.currency}`)
        emit('saved')
        emit('close')
    } catch (error) {
        console.error(error)
        notify.error('Error al procesar la recarga')
    } finally {
        isProcessing.value = false
    }
}
</script>

<template>
    <BaseModal :show="show" :title="modalTitle" @close="$emit('close')">

        <form @submit.prevent="submit" class="balance-form">

            <div class="amount-group">
                <div class="input-wrapper amount">
                    <BaseInput v-model="form.amount" label="Monto a Recargar" type="number" step="0.01"
                        placeholder="0.00" required />
                </div>

                <div class="input-wrapper currency">
                    <label class="input-label">Moneda</label>
                    <select v-model="form.currency" class="form-select" required>
                        <option v-if="currencies.length === 0" value="" disabled>Cargando...</option>
                        <option v-for="curr in currencies" :key="curr.code" :value="curr.code">
                            {{ curr.code }}
                        </option>
                    </select>
                </div>
            </div>

        </form>

        <template #footer>
            <div class="modal-actions">
                <button class="btn-cancel" @click="$emit('close')" :disabled="isProcessing">
                    Cancelar
                </button>
                <button class="btn-confirm" @click="submit" :disabled="isProcessing">
                    {{ isProcessing ? 'Procesando...' : 'Recargar Saldo' }}
                </button>
            </div>
        </template>

    </BaseModal>
</template>

<style scoped>
.balance-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
    /* Un poco más de espacio */
    padding: 15px 0;
}

.amount-group {
    display: flex;
    gap: 15px;
    align-items: flex-start;
}

.input-wrapper.amount {
    flex: 2;
}

.input-wrapper.currency {
    flex: 1;
}

.input-label {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
    font-size: 0.9rem;
    color: #333;
}

.form-select {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 6px;
    /* Coincide con BaseInput */
    background-color: white;
    font-size: 1rem;
    height: 42px;
    /* Altura estándar para inputs */
    cursor: pointer;
}

.form-select:focus {
    outline: none;
    border-color: var(--color-primary);
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.btn-cancel {
    background: #f1f1f1;
    color: #555;
    border: 1px solid #ddd;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
}

.btn-confirm {
    background: var(--color-primary);
    color: #fff;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: opacity 0.2s;
}

.btn-confirm:hover {
    opacity: 0.9;
}

.btn-confirm:disabled {
    background: #ccc;
    cursor: not-allowed;
}
</style>