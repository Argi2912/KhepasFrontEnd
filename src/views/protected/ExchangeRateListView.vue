// src/views/protected/ExchangeRateListView.vue

<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Tasas de Cambio</h1>
      <button class="btn-layout-primary" @click="openModal(null)">Nueva Tasa</button>
    </div>

    <div class="search-bar-wrapper">
      <div class="input-wrapper" style="margin-bottom: 0">
        <label for="filter_date" class="input-label" style="margin-bottom: 0.25rem"
          >Filtrar por Fecha:</label
        >
        <input id="filter_date" type="date" class="input-style" v-model="filters.date" />
      </div>
      <div class="input-wrapper" style="margin-bottom: 0; margin-left: 1rem">
        <label for="filter_currency" class="input-label" style="margin-bottom: 0.25rem"
          >Filtrar por Origen:</label
        >
        <select id="filter_currency" v-model="filters.from_currency_id" class="input-style">
          <option value="">Todas las divisas</option>
          <option v-for="c in currencyStore.activeCurrencies" :key="c.id" :value="c.id">
            {{ c.code }}
          </option>
        </select>
      </div>
    </div>

    <div class="content-table-wrapper">
      <table class="content-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>De (Origen)</th>
            <th>A (Destino)</th>
            <th>Tasa (Rate)</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody v-if="exchangeRateStore.loading">
          <tr>
            <td colspan="5" style="text-align: center">Cargando...</td>
          </tr>
        </tbody>
        <tbody v-else-if="exchangeRateStore.rates.length > 0">
          <tr v-for="r in exchangeRateStore.rates" :key="r.id">
            <td>{{ formatDate(r.date) }}</td>
            <td>
              <span class="role-tag" style="background-color: #363a43">
                {{ r.from_currency?.code || 'N/A' }}
              </span>
            </td>
            <td>
              <span class="role-tag" style="background-color: #363a43">
                {{ r.to_currency?.code || 'N/A' }}
              </span>
            </td>
            <td>{{ r.rate }}</td>
            <td>
              <button class="btn-edit" @click="openModal(r)">Editar</button>
              <button class="btn-delete" @click="handleDelete(r)">Eliminar</button>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="5" style="text-align: center">
              No se encontraron tasas para los filtros seleccionados.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ExchangeRateModal
      :is-visible="isModalVisible"
      :is-loading="exchangeRateStore.loading"
      :rate-to-edit="currentRate"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useExchangeRateStore } from '@/stores/exchangeRateStore'
import { useCurrencyStore } from '@/stores/currencyStore'
import ExchangeRateModal from '@/components/common/ExchangeRateModal.vue'
import Swal from 'sweetalert2'

const exchangeRateStore = useExchangeRateStore()
const currencyStore = useCurrencyStore() // Para los filtros

const filters = ref({
  date: '',
  from_currency_id: '',
})
const isModalVisible = ref(false)
const currentRate = ref(null)
const debounceTimer = ref(null)

// Carga inicial
onMounted(() => {
  exchangeRateStore.fetchExchangeRates({})
  currencyStore.fetchActiveCurrencies() // Para los filtros
})

// Observador para los filtros
watch(
  filters,
  (newFilters) => {
    clearTimeout(debounceTimer.value)
    debounceTimer.value = setTimeout(() => {
      exchangeRateStore.fetchExchangeRates({ page: 1, ...newFilters })
    }, 500)
  },
  { deep: true },
)

const openModal = (rate = null) => {
  currentRate.value = rate
  isModalVisible.value = true
}

const closeModal = () => {
  isModalVisible.value = false
  currentRate.value = null
}

const handleSave = async (rateData) => {
  try {
    if (rateData.id) {
      await exchangeRateStore.updateExchangeRate(rateData)
    } else {
      await exchangeRateStore.addExchangeRate(rateData)
    }
    closeModal()
  } catch (error) {
    // Error manejado por el interceptor
  }
}

const handleDelete = async (rate) => {
  const result = await Swal.fire({
    title: `¿Eliminar Tasa?`,
    text: `Origen: ${rate.from_currency?.code}, Destino: ${rate.to_currency?.code}, Tasa: ${rate.rate}. Esta acción no se puede revertir.`,
    icon: 'warning',
    input: 'text',
    inputPlaceholder: 'Escriba ELIMINAR',
    showCancelButton: true,
    cancelButtonText: 'Cancelar',
    confirmButtonText: 'Sí, eliminar',
    customClass: {
      confirmButton: 'btn-delete',
      cancelButton: 'btn-secondary',
    },
    inputValidator: (value) => (value !== 'ELIMINAR' ? 'Escriba "ELIMINAR" para confirmar.' : null),
    background: 'var(--color-bg-secondary)',
    color: 'var(--color-text-primary)',
  })

  if (result.isConfirmed) {
    try {
      await exchangeRateStore.deleteExchangeRate(rate.id)
      Swal.fire('¡Eliminado!', 'La tasa de cambio ha sido eliminada.', 'success')
    } catch (error) {
      // El error 422 (Tasa en uso) será manejado por el interceptor
      console.error(error)
    }
  }
}

// Helper
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}
</script>
