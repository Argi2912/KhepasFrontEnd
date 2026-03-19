<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'
import { useFormValidation } from '@/utils/useFormValidation'

import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/shared/BaseButton.vue'

const props = defineProps({
  show: Boolean,
  accountId: [Number, String, null],
})

const emit = defineEmits(['close', 'saved'])

const { handleAxiosError, getError, clearError } = useFormValidation()

// --- ESTADO LOCAL DE DIVISAS ---
const currencies = ref([])
const currencyOptions = computed(() =>
  currencies.value.map((c) => ({
    id: c.code,
    name: `${c.code} - ${c.name}`,
  })),
)

const initialForm = {
  name: '',
  currency_code: 'USD',
  balance: 0.0,
  details: '',
}
const form = reactive({ ...initialForm })

const isLoading = ref(false)
const isSubmitting = ref(false)

const isEditing = computed(() => !!props.accountId)
const modalTitle = computed(() => (isEditing.value ? 'Editar Cuenta Operativa' : 'Nueva Entidad de Caja'))

// --- ACCIONES ---
const fetchCurrencies = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/currencies?per_page=999')
    currencies.value = response.data.data
    if (!isEditing.value && currencies.value.length > 0) {
      form.currency_code = currencies.value[0].code
    }
  } catch (error) {
    notify.error('Fallo al sincronizar divisas.')
  } finally {
    isLoading.value = false
  }
}

const fetchAccount = async (id) => {
  isLoading.value = true
  try {
    const response = await api.get(`/accounts/${id}`)
    Object.assign(form, response.data)
  } catch (error) {
    notify.error('Fallo al recuperar datos de la cuenta.')
    emit('close')
  } finally {
    isLoading.value = false
  }
}

const handleSubmit = async () => {
  isSubmitting.value = true
  clearError()

  try {
    if (isEditing.value) {
      await api.put(`/accounts/${props.accountId}`, form)
      notify.success('Caja actualizada exitosamente.')
    } else {
      await api.post('/accounts', form)
      notify.success('Entidad creada correctamente.')
    }
    emit('saved')
    emit('close')
  } catch (error) {
    handleAxiosError(error)
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  Object.assign(form, initialForm)
  clearError()
  if (currencies.value.length > 0) {
    form.currency_code = currencies.value[0].code
  }
}

watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      if (props.accountId) {
        fetchAccount(props.accountId)
      } else {
        resetForm()
      }
    } else {
      resetForm()
    }
  },
)

onMounted(() => {
  fetchCurrencies()
})
</script>

<template>
  <BaseModal :show="show" :title="modalTitle" @close="emit('close')">
    <div v-if="isLoading" class="py-20 flex flex-col items-center justify-center gap-4">
       <div class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
       <p class="text-[0.65rem] font-bold uppercase tracking-widest text-primary/40">Recuperando registros...</p>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <BaseInput 
        v-model="form.name" 
        label="Identificador de la Cuenta" 
        name="name" 
        :error="getError('name')" 
        placeholder="Ej: Banesco Corriente o Zelle Operativo" 
        icon="fa-solid fa-file-invoice-dollar" 
        required 
        @input="clearError('name')" 
      />

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BaseSelect 
          v-model="form.currency_code" 
          label="Divisa" 
          name="currency_code" 
          :options="currencyOptions" 
          :error="getError('currency_code')" 
          placeholder="Seleccione..." 
          required 
          @change="clearError('currency_code')" 
        />

        <BaseInput 
          v-model.number="form.balance" 
          label="Saldo de Apertura" 
          name="balance" 
          type="number" 
          step="0.01" 
          :error="getError('balance')" 
          icon="fa-solid fa-coins" 
          placeholder="0.00" 
          :disabled="isEditing" 
          required 
          @input="clearError('balance')" 
        />
      </div>

      <div class="space-y-2 group">
        <label for="details" class="inline-block text-[0.7rem] font-black uppercase tracking-[0.15em] text-white/40 group-focus-within:text-primary transition-colors">
          Detalles Técnicos / Observaciones
        </label>
        <textarea 
          id="details" 
          v-model="form.details" 
          name="details" 
          rows="3" 
          class="w-full bg-white/[0.03] border border-white/5 p-4 text-sm text-white rounded-xl outline-none focus:bg-white/[0.05] focus:border-primary/50 transition-all placeholder:text-white/10" 
          placeholder="Anotaciones extra sobre la cuenta..."
          :class="{ '!border-danger': getError('details') }" 
          @input="clearError('details')"
        ></textarea>
        <p v-if="getError('details')" class="text-[0.65rem] font-bold text-danger uppercase tracking-wider ml-1">{{ getError('details') }}</p>
      </div>
    </form>

    <template #footer>
      <div class="flex flex-col-reverse md:flex-row justify-end gap-3 w-full">
        <BaseButton variant="secondary" outline @click="emit('close')" :disabled="isSubmitting">Cancelar</BaseButton>
        <BaseButton variant="primary" @click="handleSubmit" :disabled="isSubmitting">
          <span v-if="isSubmitting">Procesando...</span>
          <span v-else>{{ isEditing ? 'Guardar Cambios' : 'Registrar Entidad' }}</span>
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>