<script setup>
import { ref, watch, computed } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import notify from '@/services/notify'
import ClientProviderService from '@/services/ClientProviderService'

// Props que recibe del padre
const props = defineProps({
    show: Boolean,
    entityId: [Number, String],
    resource: { type: String, required: true }, // 'providers' o 'investors'
    entityName: String
})

const emit = defineEmits(['close', 'saved'])

const form = ref({
    amount: '',
    description: ''
})

const isProcessing = ref(false)

// Título dinámico para el modal (porque BaseModal usa prop 'title', no slot)
const modalTitle = computed(() => `💰 Agregar Fondos: ${props.entityName || ''}`)

// Limpiar formulario al abrir
watch(() => props.show, (newVal) => {
    if (newVal) {
        form.value = { amount: '', description: '' }
    }
})

const submit = async () => {
    if (!form.value.amount || form.value.amount <= 0) {
        notify.error('El monto debe ser mayor a 0')
        return
    }

    isProcessing.value = true
    try {
        await ClientProviderService.addBalance(props.resource, props.entityId, form.value)
        notify.success('Fondos agregados correctamente')
        emit('saved')
        emit('close')
    } catch (error) {
        console.error(error)
    } finally {
        isProcessing.value = false
    }
}
</script>

<template>
    <BaseModal :show="show" :title="modalTitle" @close="$emit('close')">

        <form @submit.prevent="submit" class="balance-form">
            <BaseInput v-model="form.amount" label="Monto a Ingresar" type="number" step="0.01" placeholder="0.00"
                required />

            <BaseInput v-model="form.description" label="Motivo / Descripción"
                placeholder="Ej: Saldo inicial, Pago adelantado..." />
        </form>

        <template #footer>
            <div class="modal-actions">
                <button class="btn-cancel" @click="$emit('close')" :disabled="isProcessing">
                    Cancelar
                </button>
                <button class="btn-confirm" @click="submit" :disabled="isProcessing">
                    {{ isProcessing ? 'Procesando...' : 'Confirmar Recarga' }}
                </button>
            </div>
        </template>

    </BaseModal>
</template>

<style scoped>
.balance-form {
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 10px 0;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    width: 100%;
}

.btn-cancel {
    background: #e0e0e0;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    color: #333;
}

.btn-confirm {
    background: var(--color-primary);
    color: #fff;
    /* Ajusta si tu primary es muy claro */
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
}

.btn-confirm:hover {
    opacity: 0.9;
}
</style>