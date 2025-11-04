<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Transacciones</h1>

      <div class="flex items-center gap-4">
        <button class="btn-layout-secondary" @click="openModal('exchange')">
          Intercambiar Divisa
        </button>
        <button class="btn-layout-primary" @click="openModal('register')">
          Registrar Movimiento
        </button>
      </div>
    </div>
    <div class="search-bar-wrapper">
      <input
        type="text"
        class="search-input"
        placeholder="Buscar por descripción o referencia..."
        v-model="searchQuery"
      />
    </div>

    <div class="content-table-wrapper">
      <table class="content-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Referencia</th>
            <th>Descripción</th>
            <th>Monto</th>
            <th>Estatus</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody v-if="transactionStore.loading">
          <tr>
            <td colspan="6" style="text-align: center">Cargando...</td>
          </tr>
        </tbody>
        <tbody v-else-if="transactionStore.transactions.length > 0">
          <tr v-for="t in transactionStore.transactions" :key="t.id">
            <td>{{ formatDate(t.date) }}</td>
            <td>{{ t.reference_code }}</td>
            <td>{{ t.description }}</td>
            <td>{{ formatCurrency(getAmount(t.details)) }}</td>
            <td>
              <span class="role-tag" :style="{ backgroundColor: getStatusColor(t.status) }">
                {{ translateStatus(t.status) }}
              </span>
            </td>
            <td>
              <button class="btn-edit" @click="openModal('view', t)">Ver Detalles</button>

              <button
                v-if="t.status === 'PENDING'"
                class="btn-layout-primary"
                style="margin-left: 0.5rem"
                @click="openModal('settle', t)"
              >
                Saldar
              </button>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="6" style="text-align: center">No se encontraron transacciones.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <DirectTransactionModal
      :is-visible="isModalVisible"
      :mode="modalMode"
      :transaction-data="currentTransaction"
      :is-loading="transactionStore.loading"
      @close="closeModal"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useTransactionStore } from '@/stores/transactionStore'
import { useCashStore } from '@/stores/cashStore'
import { useAccountStore } from '@/stores/accountStore'
// Asegúrate que el nombre del componente modal coincida con el importado
import DirectTransactionModal from '@/components/transactions/DirectTransactionModal.vue'
import Swal from 'sweetalert2'

const transactionStore = useTransactionStore()
const cashStore = useCashStore()
const accountStore = useAccountStore()

const searchQuery = ref('')
const isModalVisible = ref(false)
const modalMode = ref('register') // 'register', 'settle', 'view', 'exchange'
const currentTransaction = ref(null)
const debounceTimer = ref(null)

// Carga inicial
onMounted(() => {
  transactionStore.fetchTransactions({})
  // Precargar cajas y cuentas para el modal
  cashStore.fetchCashes({})
  accountStore.fetchAllAccountsForDropdowns()
})

// Búsqueda con debounce
watch(searchQuery, (newQuery) => {
  clearTimeout(debounceTimer.value)
  debounceTimer.value = setTimeout(() => {
    transactionStore.fetchTransactions({ page: 1, search: newQuery })
  }, 500)
})

const openModal = (mode, transaction = null) => {
  modalMode.value = mode
  currentTransaction.value = transaction
  isModalVisible.value = true
}

const closeModal = () => {
  isModalVisible.value = false
  currentTransaction.value = null
  // Recargar listas necesarias (opcional)
  cashStore.fetchCashes({})
}

// --- UTILIDADES PARA LA TABLA ---

const getAmount = (details) => {
  return details?.[0]?.amount || 0
}

const formatCurrency = (value, symbol = '$') => {
  const number = parseFloat(value)
  if (isNaN(number)) return `${symbol} 0.00`
  return `${symbol} ${number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString.replace(/-/g, '/'))
  return date.toLocaleDateString()
}

const getStatusColor = (status) => {
  if (status === 'COMPLETED') return '#0ecb81' // Verde
  if (status === 'PENDING') return '#f0b90b' // Amarillo
  return '#d63031' // Rojo (CANCELED)
}

const translateStatus = (status) => {
  const statuses = {
    PENDING: 'Pendiente',
    COMPLETED: 'Completada',
    CANCELED: 'Cancelada',
    DRAFT: 'Borrador',
  }
  return statuses[status] || status
}
</script>

<style scoped>
/* Estilos tomados de layout.css (ya que no se importan globalmente) */
.flex {
  display: flex;
}
.items-center {
  align-items: center;
}
.gap-4 {
  gap: 1rem;
}

/* FIX: Definición del botón secundario que faltaba */
.btn-layout-secondary {
  padding: 0.6rem 1.1rem;
  font-size: 0.9rem;
  font-weight: 700;
  background-color: transparent;
  /* Variables CSS de layout.css (asumimos que están en :root) */
  color: var(--color-accent-yellow);
  border: 1px solid var(--color-accent-yellow);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
}
.btn-layout-secondary:hover:not(:disabled) {
  background-color: rgba(240, 185, 11, 0.1); /* Tinte amarillo */
  transform: translateY(-1px);
}
.btn-layout-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
