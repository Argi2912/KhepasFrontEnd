<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-card">
      <div class="modal-header">
        <h2 class="modal-title">{{ isEditMode ? 'Editar Divisa' : 'Nueva Divisa' }}</h2>
        <button class="modal-close-btn" @click="closeModal">×</button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="modal-body">
          <CustomInput
            id="name"
            label="Nombre de la Divisa"
            v-model="formData.name"
            placeholder="Ej: Dólar Estadounidense"
            required
          />

          <div class="grid grid-cols-2 gap-4">
            <CustomInput
              id="code"
              label="Código (ISO)"
              v-model="formData.code"
              placeholder="Ej: USD"
              required
            />
            <CustomInput
              id="symbol"
              label="Símbolo"
              v-model="formData.symbol"
              placeholder="Ej: $"
              required
            />
          </div>

          <div class="flex items-center justify-between mt-4">
            <div class="checkbox-wrapper">
              <input
                type="checkbox"
                id="is_active"
                v-model="formData.is_active"
                class="checkbox-style"
              />
              <label for="is_active" class="checkbox-label">¿Está Activa?</label>
            </div>

            <div class="checkbox-wrapper">
              <input
                type="checkbox"
                id="is_base"
                v-model="formData.is_base"
                class="checkbox-style"
              />
              <label for="is_base" class="checkbox-label">¿Es Moneda Base?</label>
            </div>
          </div>
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

const props = defineProps({
  isVisible: Boolean,
  isLoading: Boolean,
  currencyToEdit: Object,
})
const emit = defineEmits(['close', 'save'])

const formData = ref({})
const isEditMode = computed(() => !!props.currencyToEdit?.id)

watch(
  () => props.isVisible,
  (newVal) => {
    if (newVal) {
      if (isEditMode.value) {
        // Modo Edición
        formData.value = { ...props.currencyToEdit }
      } else {
        // Modo Creación
        formData.value = {
          name: '',
          symbol: '',
          code: '',
          is_base: false,
          is_active: true,
        }
      }
    }
  },
)

const closeModal = () => emit('close')
const handleSubmit = () => emit('save', formData.value)
</script>

<style scoped>
/* Estilos de Checkbox (Añadir a tu CSS global o local) */
.checkbox-wrapper {
  display: flex;
  align-items: center;
}
.checkbox-style {
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 0.5rem;
}
.checkbox-label {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}
</style>
