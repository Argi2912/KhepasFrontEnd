<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-card">
      <div class="modal-header">
        <h2 class="modal-title">{{ isEditMode ? 'Editar Tasa' : 'Nueva Tasa de Cambio' }}</h2>
        <button class="modal-close-btn" @click="closeModal">×</button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="modal-body">
          <div class="grid grid-cols-2 gap-4">
            <div class="input-wrapper">
              <label for="from_currency" class="input-label">De (Divisa Origen)</label>
              <select
                id="from_currency"
                v-model="formData.from_currency_id"
                class="input-style"
                required
              >
                <option disabled value="">
                  {{ currencyStore.loading ? 'Cargando...' : 'Seleccione...' }}
                </option>
                <option v-for="c in currencyStore.activeCurrencies" :key="c.id" :value="c.id">
                  {{ c.name }} ({{ c.code }})
                </option>
              </select>
            </div>

            <div class="input-wrapper">
              <label for="to_currency" class="input-label">A (Divisa Destino)</label>
              <select
                id="to_currency"
                v-model="formData.to_currency_id"
                class="input-style"
                required
              >
                <option disabled value="">
                  {{ currencyStore.loading ? 'Cargando...' : 'Seleccione...' }}
                </option>
                <option v-for="c in currencyStore.activeCurrencies" :key="c.id" :value="c.id">
                  {{ c.name }} ({{ c.code }})
                </option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <CustomInput
              id="rate"
              label="Tasa (1 Origen = X Destino)"
              type="number"
              v-model="formData.rate"
              placeholder="Ej: 38.5"
              step="0.0001"
              required
            />
            <CustomInput
              id="date"
              label="Fecha de la Tasa"
              type="date"
              v-model="formData.date"
              required
            />
          </div>

          <p class="text-sm text-gray-400 mt-2">
            Ejemplo: 1 USD (Origen) = 38.5 VEF (Destino). La tasa es 38.5.
          </p>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="closeModal">Cancelar</button>
          <button type="submit" class="btn-layout-primary" :disabled="isLoading">
            {{ isLoading ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, defineProps, defineEmits } from 'vue'
import CustomInput from '@/components/common/CustomInput.vue' // Ajusta la ruta
import { useCurrencyStore } from '@/stores/currencyStore'

const props = defineProps({
  isVisible: Boolean,
  isLoading: Boolean,
  rateToEdit: Object,
})
const emit = defineEmits(['close', 'save'])

const currencyStore = useCurrencyStore() // Store de divisas
const formData = ref({})
const isEditMode = computed(() => !!props.rateToEdit?.id)

watch(
  () => props.isVisible,
  (newVal) => {
    if (newVal) {
      // Cargar las divisas para los dropdowns
      currencyStore.fetchActiveCurrencies()

      if (isEditMode.value) {
        // Modo Edición
        formData.value = { ...props.rateToEdit }
      } else {
        // Modo Creación
        formData.value = {
          from_currency_id: '',
          to_currency_id: '',
          rate: '',
          date: new Date().toISOString().slice(0, 10), // Fecha de hoy
        }
      }
    }
  },
)

const closeModal = () => emit('close')
const handleSubmit = () => {
  // Validación simple
  if (formData.value.from_currency_id === formData.value.to_currency_id) {
    alert('Las divisas de origen y destino no pueden ser iguales.') // Reemplazar con Toast
    return
  }
  emit('save', formData.value)
}
</script>
