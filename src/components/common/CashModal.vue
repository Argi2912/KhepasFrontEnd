<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-card">
      <div class="modal-header">
        <h2 class="modal-title">
          {{ isEditMode ? 'Editar Caja/Plataforma' : 'Añadir Nueva Caja' }}
        </h2>
        <button class="modal-close-btn" @click="closeModal">×</button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="modal-body">
          <CustomInput
            id="name"
            label="Nombre de la Caja o Plataforma"
            v-model="formData.name"
            placeholder="Ej: Binance USDT, Efectivo Oficina"
            required
          />

          <!-- 1. NUEVO DROPDOWN DE DIVISA -->
          <div class="input-wrapper">
            <label for="currency_id" class="input-label">Divisa (Moneda)</label>
            <select id="currency_id" v-model="formData.currency_id" class="input-style" required>
              <option disabled value="">
                {{ currencyStore.loading ? 'Cargando divisas...' : 'Seleccione una divisa...' }}
              </option>
              <option
                v-for="currency in currencyStore.activeCurrencies"
                :key="currency.id"
                :value="currency.id"
              >
                {{ currency.name }} ({{ currency.code }})
              </option>
            </select>
          </div>

          <!-- Dropdown de Cuenta Contable -->
          <div class="input-wrapper">
            <label for="account_id" class="input-label">Cuenta Contable (Interna)</label>
            <select id="account_id" v-model="formData.account_id" class="input-style" required>
              <option disabled value="">
                {{ accountStore.loading ? 'Cargando cuentas...' : 'Seleccione una cuenta...' }}
              </option>
              <option
                v-for="account in accountStore.cashAccounts"
                :key="account.id"
                :value="account.id"
              >
                {{ account.name }}
              </option>
            </select>
          </div>

          <CustomInput
            id="balance"
            label="Saldo Inicial"
            type="number"
            step="0.01"
            v-model="formData.balance"
            :disabled="isEditMode"
            :required="!isEditMode"
          />
          <p v-if="isEditMode" class="form-help-text">
            El saldo inicial no se puede editar. Use "Transacciones" para ajustar el balance.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="closeModal">Cancelar</button>
          <button type="submit" class.="btn-layout-primary" :disabled="isLoading">
            {{ isLoading ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, defineProps, defineEmits } from 'vue'
import CustomInput from '@/components/common/CustomInput.vue'
import { useAccountStore } from '@/stores/accountStore'
import { useCurrencyStore } from '@/stores/currencyStore' // 2. IMPORTAR STORE DE DIVISAS

const props = defineProps({
  isVisible: Boolean,
  cashToEdit: Object,
  isLoading: Boolean,
})

const emit = defineEmits(['close', 'save'])
const accountStore = useAccountStore()
const currencyStore = useCurrencyStore() // 3. INICIALIZAR STORE
const formData = ref({})
const isEditMode = computed(() => !!props.cashToEdit?.id)

// Cargar cuentas y divisas al abrir
watch(
  () => props.isVisible,
  (newVal) => {
    if (newVal) {
      accountStore.fetchCashAccounts()
      currencyStore.fetchActiveCurrencies() // 4. LLAMAR AL STORE

      if (isEditMode.value) {
        // Modo Edición
        formData.value = {
          id: props.cashToEdit.id,
          name: props.cashToEdit.name,
          account_id: props.cashToEdit.account_id,
          currency_id: props.cashToEdit.currency_id, // 5. AÑADIR AL FORM
          balance: props.cashToEdit.balance,
        }
      } else {
        // Modo Creación
        formData.value = {
          name: '',
          account_id: '',
          currency_id: '', // 5. AÑADIR AL FORM
          balance: 0,
        }
      }
    }
  },
)

// ... (closeModal y handleSubmit se mantienen) ...
const closeModal = () => emit('close')
const handleSubmit = () => {
  if (isEditMode.value) {
    const { balance, ...dataToSave } = formData.value
    emit('save', dataToSave)
  } else {
    emit('save', formData.value)
  }
}
</script>

<style scoped>
/* Estilos tomados de layout.css */
.form-help-text {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin-top: -0.5rem;
}
</style>
