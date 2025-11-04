// src/views/protected/CashListView.vue

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Cajas y Plataformas</h1>
      <button class="btn-layout-primary" @click="openAddModal">Añadir Caja</button>
    </div>

    <div class="search-bar-wrapper">
      <input
        type="text"
        class="search-input"
        placeholder="Buscar por nombre o tipo..."
        v-model="searchQuery"
      />
    </div>

    <div class="content-table-wrapper">
      <table class="content-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Cuenta Contable</th>
            <th>Divisa</th>
            <th>Saldo Actual</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody v-if="cashStore.loading">
          <tr>
            <td colspan="6" style="text-align: center">Cargando...</td>
          </tr>
        </tbody>
        <tbody v-else-if="cashStore.cashes.length > 0">
          <tr v-for="cash in cashStore.cashes" :key="cash.id">
            <td>{{ cash.id }}</td>
            <td>{{ cash.name }}</td>
            <td>
              <span class.="role-tag">{{ cash.account?.name || 'N/A' }}</span>
            </td>
            <td>
              <span class.="role-tag" style="background-color: #555">{{
                cash.currency?.code || 'N/A'
              }}</span>
            </td>
            <td>
              {{ formatCurrency(cash.balance, cash.currency) }}
            </td>
            <td>
              <button class="btn-edit" @click="openEditModal(cash)">Editar</button>
              <button class="btn-delete" @click="confirmDelete(cash)">Eliminar</button>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="6" style="text-align: center">No se encontraron cajas o plataformas.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="cashStore.paginationData?.links" class="pagination-wrapper">
      <ul class="pagination">
        <li
          v-for="link in cashStore.paginationData.links"
          :key="link.label"
          class="pagination-item"
          :class="{ active: link.active, disabled: !link.url }"
        >
          <button @click="changePage(link)" v-html="link.label"></button>
        </li>
      </ul>
    </div>

    <CashModal
      :is-visible="isModalVisible"
      :cash-to-edit="currentCash"
      :is-loading="cashStore.loading"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useCashStore } from '@/stores/cashStore'
import CashModal from '@/components/common/CashModal.vue'
import Swal from 'sweetalert2' // <-- IMPORTAR SWEETALERT2

const cashStore = useCashStore()

const searchQuery = ref('')
const isModalVisible = ref(false)
const currentCash = ref(null)
const debounceTimer = ref(null)

// Carga Inicial
onMounted(() => {
  cashStore.fetchCashes({})
})

// Búsqueda Reactiva (Debounce)
watch(searchQuery, (newQuery) => {
  clearTimeout(debounceTimer.value)
  debounceTimer.value = setTimeout(() => {
    cashStore.fetchCashes({ page: 1, search: newQuery })
  }, 500)
})

// Paginación
const changePage = (link) => {
  if (!link.url) return
  const url = new URL(link.url)
  const page = url.searchParams.get('page')
  cashStore.fetchCashes({ page: page, search: searchQuery.value })
}

// Métodos del Modal
const openAddModal = () => {
  currentCash.value = null
  isModalVisible.value = true
}
const openEditModal = (cash) => {
  currentCash.value = { ...cash }
  isModalVisible.value = true
}
const closeModal = () => {
  isModalVisible.value = false
}
const handleSave = async (cashData) => {
  try {
    if (cashData.id) {
      await cashStore.updateCash(cashData)
    } else {
      await cashStore.addCash(cashData)
    }
    closeModal()
  } catch (error) {
    // No cerrar modal si hay error
  }
}

// --- NUEVA LÓGICA DE ELIMINACIÓN CON SWEETALERT2 Y VALIDACIÓN ---
const confirmDelete = async (cash) => {
  const result = await Swal.fire({
    title: `¿Eliminar la caja "${cash.name}"?`,
    // CORRECCIÓN 6: Usar el formato de divisa dinámica
    text: `Esta acción es irreversible y solo es posible si el saldo es cero (${formatCurrency(cash.balance, cash.currency)}). Para confirmar, escribe "ELIMINAR".`,
    icon: 'warning',
    input: 'text',
    inputPlaceholder: 'Escribe ELIMINAR',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    customClass: {
      confirmButton: 'btn-delete', // Usar la clase de estilo rojo
      cancelButton: 'btn-secondary',
    },
    // Validación de la palabra clave
    inputValidator: (value) => {
      if (value !== 'ELIMINAR') {
        return 'Debes escribir la palabra "ELIMINAR" en mayúsculas para confirmar.'
      }
    },
    // Estilo personalizado para SweetAlert
    background: 'var(--color-bg-secondary)',
    color: 'var(--color-text-primary)',
    confirmButtonColor: 'var(--color-bg-tertiary)',
  })

  if (result.isConfirmed) {
    try {
      await cashStore.deleteCash(cash.id)
      Swal.fire({
        title: '¡Eliminado!',
        text: `La caja "${cash.name}" ha sido eliminada.`,
        icon: 'success',
        background: 'var(--color-bg-secondary)',
        color: 'var(--color-text-primary)',
        confirmButtonColor: 'var(--color-accent-yellow)',
      })
    } catch (error) {
      // Si el backend devuelve 422 (Caja con Saldo), el interceptor ya lo notificó.
      // Aquí solo manejamos la notificación si no es una excepción manejada por el interceptor.
      console.error('Fallo al eliminar caja:', error)
    }
  }
}

// --- CORRECCIÓN 7: Utilidad de Formato Dinámico ---
const formatCurrency = (value, currency) => {
  const number = parseFloat(value)
  if (isNaN(number)) {
    return '$ 0.00' // Fallback
  }

  // Usar el símbolo de la divisa si existe, si no, '$'
  const symbol = currency?.symbol || '$'

  return `${symbol} ${number.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
</script>

<style scoped>
/* Estilos globales en layout.css */
</style>
