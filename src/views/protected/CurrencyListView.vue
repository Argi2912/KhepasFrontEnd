// src/views/protected/CurrencyListView.vue

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Divisas</h1>
      <button class="btn-layout-primary" @click="openModal(null)">Nueva Divisa</button>
    </div>

    <div class="search-bar-wrapper">
      <input
        type="text"
        class="search-input"
        placeholder="Buscar por nombre, código o símbolo..."
        v-model="searchQuery"
      />
    </div>

    <div class="content-table-wrapper">
      <table class="content-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Código</th>
            <th>Símbolo</th>
            <th>Estatus</th>
            <th>Moneda Base</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody v-if="currencyStore.loading">
          <tr>
            <td colspan="6" style="text-align: center">Cargando...</td>
          </tr>
        </tbody>
        <tbody v-else-if="currencyStore.currencies.length > 0">
          <tr v-for="c in currencyStore.currencies" :key="c.id">
            <td>{{ c.name }}</td>
            <td>{{ c.code }}</td>
            <td>{{ c.symbol }}</td>
            <td>
              <span
                class="role-tag"
                :style="{ backgroundColor: c.is_active ? '#0ecb81' : '#d63031' }"
              >
                {{ c.is_active ? 'Activa' : 'Inactiva' }}
              </span>
            </td>
            <td>
              <span
                v-if="c.is_base"
                class="role-tag"
                style="background-color: var(--color-accent-yellow); color: #1c2127"
              >
                Base
              </span>
            </td>
            <td>
              <button class="btn-edit" @click="openModal(c)">Editar</button>
              <button class="btn-delete" @click="handleDelete(c)" :disabled="c.is_base">
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="6" style="text-align: center">No se encontraron divisas.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <CurrencyModal
      :is-visible="isModalVisible"
      :is-loading="currencyStore.loading"
      :currency-to-edit="currentCurrency"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useCurrencyStore } from '@/stores/currencyStore'
import CurrencyModal from '@/components/common/CurrencyModal.vue'
import Swal from 'sweetalert2'

const currencyStore = useCurrencyStore()
const searchQuery = ref('')
const isModalVisible = ref(false)
const currentCurrency = ref(null)
const debounceTimer = ref(null)

onMounted(() => {
  currencyStore.fetchCurrencies({})
})

watch(searchQuery, (newQuery) => {
  clearTimeout(debounceTimer.value)
  debounceTimer.value = setTimeout(() => {
    currencyStore.fetchCurrencies({ page: 1, search: newQuery })
  }, 500)
})

const openModal = (currency = null) => {
  currentCurrency.value = currency
  isModalVisible.value = true
}

const closeModal = () => {
  isModalVisible.value = false
  currentCurrency.value = null
}

const handleSave = async (currencyData) => {
  try {
    if (currencyData.id) {
      await currencyStore.updateCurrency(currencyData)
    } else {
      await currencyStore.addCurrency(currencyData)
    }
    closeModal()
  } catch (error) {
    // Error manejado por el interceptor
  }
}

const handleDelete = async (currency) => {
  // Verificación de seguridad adicional (aunque el botón esté deshabilitado)
  if (currency.is_base) {
    Swal.fire({
      title: 'Acción No Permitida',
      text: 'No se puede eliminar la divisa base del sistema.',
      icon: 'error',
      background: 'var(--color-bg-secondary)',
      color: 'var(--color-text-primary)',
      confirmButtonColor: 'var(--color-accent-yellow)',
    })
    return
  }

  const result = await Swal.fire({
    title: `¿Eliminar Divisa: ${currency.name}?`,
    text: 'Esta acción no se puede revertir. Si la divisa está en uso (tasas de cambio), el sistema rechazará la eliminación.',
    icon: 'warning',
    input: 'text',
    inputPlaceholder: 'Escriba ELIMINAR para confirmar',
    showCancelButton: true,
    cancelButtonText: 'Cancelar',
    confirmButtonText: 'Sí, eliminar',
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
    confirmButtonColor: 'var(--color-bg-tertiary)', // Asumo que tienes un color rojo
  })

  if (result.isConfirmed) {
    try {
      await currencyStore.deleteCurrency(currency.id)
      Swal.fire({
        title: '¡Eliminado!',
        text: `La divisa "${currency.name}" ha sido eliminada.`,
        icon: 'success',
        background: 'var(--color-bg-secondary)',
        color: 'var(--color-text-primary)',
        confirmButtonColor: 'var(--color-accent-yellow)',
      })
    } catch (error) {
      // Si el backend devuelve 422 (Divisa en uso),
      // el interceptor (axios) ya debería mostrar el error.
      console.error('Error al eliminar divisa:', error)
    }
  }
}
</script>
