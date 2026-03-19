<script setup>
import { ref, watch, onMounted } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import notify from '@/services/notify'
import api from '@/services/api'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({
    show: Boolean,
    employee: Object
})

const emit = defineEmits(['close', 'saved'])

const isProcessing = ref(false)
const isLoading = ref(false)
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

const frequencies = [
    { id: 'weekly', name: 'Ciclo Semanal' },
    { id: 'biweekly', name: 'Ciclo Quincenal' },
    { id: 'monthly', name: 'Ciclo Mensual' }
]

const fetchCurrencies = async () => {
    isLoading.value = true
    try {
        const { data } = await api.get('/currencies?per_page=99')
        currencies.value = data.data.map(c => ({
            id: c.code,
            name: `${c.code} - ${c.name}`
        }))
    } catch (e) {
        notify.error('Fallo al sincronizar divisas.')
    } finally {
        isLoading.value = false
    }
}

watch(() => props.show, (newVal) => {
    if (newVal) {
        fetchCurrencies()
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
            notify.success(`Perfil de "${form.value.name}" actualizado.`)
        } else {
            await api.post('/employees', form.value)
            notify.success(`Colaborador "${form.value.name}" registrado exitosamente.`)
        }
        emit('saved')
        emit('close')
    } catch (error) {
        notify.error('Error al procesar el registro laboral.')
    } finally {
        isProcessing.value = false
    }
}
</script>

<template>
    <BaseModal :show="show" :title="employee ? 'Configurar Perfil Laboral' : 'Alta de Nuevo Colaborador'" @close="$emit('close')">
        <div v-if="isLoading" class="py-20 flex flex-col items-center justify-center gap-4">
           <div class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
           <p class="text-[0.65rem] font-black uppercase tracking-widest text-primary/40">Sincronizando base de datos laboral...</p>
        </div>

        <form v-else @submit.prevent="submit" class="space-y-10">
            
            <!-- Sección: Identidad -->
            <div class="space-y-6">
                <div class="flex items-center gap-3 text-primary/60 border-b border-white/5 pb-3">
                    <div class="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                       <FontAwesomeIcon icon="fa-solid fa-address-card" class="text-xs" />
                    </div>
                    <h4 class="text-[0.7rem] font-black uppercase tracking-[0.25em]">Información de Identidad</h4>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <BaseInput 
                        v-model="form.name" 
                        label="Nombre Completo" 
                        placeholder="Ej: María Rodríguez"
                        icon="fa-solid fa-user-tie"
                        required 
                    />
                    <BaseInput 
                        v-model="form.identification_doc" 
                        label="Documento de Identificación" 
                        placeholder="V-28.123.456"
                        icon="fa-solid fa-id-badge"
                    />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <BaseInput 
                        v-model="form.email" 
                        label="Contacto Digital" 
                        type="email" 
                        placeholder="empleado@khepas.com"
                        icon="fa-solid fa-at"
                    />
                    <BaseInput 
                        v-model="form.phone" 
                        label="Contacto Móvil" 
                        placeholder="+58 412..."
                        icon="fa-solid fa-phone-flip"
                    />
                </div>

                <BaseInput 
                    v-model="form.position" 
                    label="Cargo o Función Organizacional" 
                    placeholder="Ej: Administrador de Operaciones Financieras" 
                    icon="fa-solid fa-briefcase"
                />
            </div>

            <!-- Sección: Nómina -->
            <div class="space-y-6 pt-6 border-t border-white/10">
                <div class="flex items-center gap-3 text-info/60 border-b border-white/5 pb-3">
                    <div class="w-8 h-8 rounded-xl bg-info/10 flex items-center justify-center text-info border border-info/10">
                       <FontAwesomeIcon icon="fa-solid fa-sack-dollar" class="text-xs" />
                    </div>
                    <h4 class="text-[0.7rem] font-black uppercase tracking-[0.25em]">Configuración Salarial</h4>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <BaseInput 
                        v-model="form.salary_amount" 
                        label="Compensación Base" 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00"
                        icon="fa-solid fa-coins"
                        required 
                    />
                    <BaseSelect 
                        v-model="form.currency_code" 
                        label="Divisa de Pago" 
                        :options="currencies" 
                        required 
                    />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <BaseSelect 
                        v-model="form.payment_frequency" 
                        label="Frecuencia de Ciclo" 
                        :options="frequencies" 
                        required 
                    />

                    <div class="grid grid-cols-2 gap-4">
                        <BaseInput 
                            v-model="form.payment_day_1" 
                            label="Día de Corte 1" 
                            type="number" 
                            min="1" 
                            max="31"
                            placeholder="15"
                        />
                        <div v-if="form.payment_frequency === 'biweekly'" class="animate-fade-in">
                            <BaseInput 
                                v-model="form.payment_day_2" 
                                label="Día de Corte 2" 
                                type="number" 
                                min="1" 
                                max="31"
                                placeholder="30"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </form>

        <template #footer>
            <div v-if="!isLoading" class="flex flex-col-reverse md:flex-row justify-end gap-3 w-full">
                <BaseButton variant="secondary" outline @click="$emit('close')" :disabled="isProcessing">Cancelar</BaseButton>
                <BaseButton variant="primary" @click="submit" :disabled="isProcessing">
                    <span v-if="isProcessing">Sincronizando...</span>
                    <span v-else>{{ employee ? 'Guardar Cambios' : 'Registrar Colaborador' }}</span>
                </BaseButton>
            </div>
        </template>
    </BaseModal>
</template>