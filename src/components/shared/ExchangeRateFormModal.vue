<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue' // 🚨 Importar onMounted

import api from '@/services/api'
import notify from '@/services/notify'
import { useFormValidation } from '@/utils/useFormValidation'

import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

const props = defineProps({
  show: Boolean,
})

const emit = defineEmits(['close', 'saved'])

const { errors, handleAxiosError, getError, clearError } = useFormValidation()

// --- ESTADO LOCAL DE DIVISAS ---
const currencies = ref([]) // Lista cruda de objetos Currency
const currencyOptions = computed(() =>
  currencies.value.map((c) => ({
    id: c.code,
    name: `${c.code} - ${c.name}`,
  })),
)
// ------------------------------

const initialForm = {
  from_currency: 'USD',
  to_currency: 'VES',
  rate: 0.0,
}
const form = reactive({ ...initialForm })

const isSubmitting = ref(false)
const isLoadingCurrencies = ref(false) // Nuevo estado de carga

// --- ACCIONES ---

/**
 * Carga la lista de divisas desde el backend.
 */
const fetchCurrencies = async () => {
  isLoadingCurrencies.value = true
  try {
    // Buscar todas las divisas para los selectores
    const response = await api.get('/currencies?per_page=999')
    currencies.value = response.data.data

    // Intentar establecer defaults, asumiendo que USD y VES existen
    if (currencies.value.some((c) => c.code === 'USD')) {
      form.from_currency = 'USD'
    } else if (currencies.value.length > 0) {
      form.from_currency = currencies.value[0].code
    }

    if (currencies.value.some((c) => c.code === 'VES')) {
      form.to_currency = 'VES'
    } else if (currencies.value.length > 1) {
      // Elegir una diferente a la de origen
      form.to_currency =
        currencies.value.find((c) => c.code !== form.from_currency)?.code || form.from_currency
    }
  } catch (error) {
    notify.error('Error al cargar la lista de divisas.')
    console.error(error)
  } finally {
    isLoadingCurrencies.value = false
  }
}

/**
 * Envía el formulario.
 */
const handleSubmit = async () => {
  isSubmitting.value = true
  clearError()

  // Validación rápida: Origen y Destino no deben ser iguales
  if (form.from_currency === form.to_currency) {
    handleAxiosError({
      response: {
        data: {
          errors: {
            from_currency: ['La divisa de origen no puede ser igual a la de destino.'],
            to_currency: ['La divisa de destino no puede ser igual a la de origen.'],
          },
        },
      },
    })
    isSubmitting.value = false
    return
  }

  try {
    await api.post('/rates', form)
    notify.success(`Tasa ${form.from_currency} a ${form.to_currency} registrada exitosamente.`)
    emit('saved')
    emit('close')
  } catch (error) {
    handleAxiosError(error)
  } finally {
    isSubmitting.value = false
  }
}

// Resetear el formulario al cerrar
watch(
  () => props.show,
  (newValue) => {
    if (!newValue) {
      Object.assign(form, initialForm)
      clearError()
    }
  },
)

onMounted(() => {
  fetchCurrencies()
})
</script>

<template>
  <BaseModal
    :show="show"
    title="Registrar Nueva Tasa de Cambio"
    @close="emit('close')"
    :is-loading="isLoadingCurrencies"
  >
    <p class="subtitle">
      Aquí se registran las tasas de conversión entre las divisas activas. Se creará automáticamente
      la tasa inversa.
    </p>

    <form @submit.prevent="handleSubmit">
      <div class="form-grid">
        <BaseSelect
          v-model="form.from_currency"
          label="Divisa Origen (De)"
          name="from_currency"
          :options="currencyOptions"
          :error="getError('from_currency')"
          placeholder="Ej: USD"
          required
          @change="clearError('from_currency')"
          :disabled="isLoadingCurrencies"
        />

        <BaseSelect
          v-model="form.to_currency"
          label="Divisa Destino (A)"
          name="to_currency"
          :options="currencyOptions"
          :error="getError('to_currency')"
          placeholder="Ej: VES"
          required
          @change="clearError('to_currency')"
          :disabled="isLoadingCurrencies"
        />
      </div>

      <BaseInput
        v-model.number="form.rate"
        label="Tasa de Cambio (Valor de 1 unidad de Origen)"
        name="rate"
        type="number"
        step="0.0001"
        :error="getError('rate')"
        icon="fa-solid fa-calculator"
        placeholder="Ej: 40.50 (1 USD = 40.50 VES)"
        required
        @input="clearError('rate')"
      />
    </form>

    <template #footer>
      <button @click="emit('close')" type="button" class="btn-cancel-modal">Cancelar</button>
      <button
        @click="handleSubmit"
        type="button"
        class="btn-submit-modal"
        :disabled="isSubmitting || isLoadingCurrencies"
      >
        <span v-if="isSubmitting">Registrando...</span>
        <span v-else>Guardar Tasa</span>
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}
.subtitle {
  opacity: 0.8;
  margin-bottom: 20px;
}
/* Estilos para los botones del footer (Reutilizados del modal base) */
.btn-cancel-modal {
  background: none;
  border: none;
  color: #aaa;
  padding: 10px 15px;
  cursor: pointer;
}
.btn-submit-modal {
  background-color: var(--color-primary);
  color: var(--color-secondary);
  padding: 10px 15px;
  border-radius: 6px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-submit-modal:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
