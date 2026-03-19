import { ref, computed } from 'vue'

export function useCategories() {
  const expenseCategories = ref([
    'Servicios Basicos',
    'Nomina',
    'Alquiler',
    'Gastos Legales',
    'Suministros',
    'Marketing',
    'Software/Suscripciones',
    'Impuestos',
    'Mantenimiento',
    'Carga de Saldo',
    'Comision Bancaria',
    'Reembolso',
    'Otro'
  ])

  const incomeCategories = ref([
    'Venta de Servicios',
    'Intereses Cobrados',
    'Comisiones',
    'Aporte de Capital',
    'Carga de Saldo',
    'Reembolso',
    'Otro'
  ])

  const internalTransferCategories = ref([
    'Transferencia Interna',
    'Ajuste Contable',
    'Fondo Fijo',
    'Otro'
  ])

  const getCategoriesByType = (type) => {
    switch (type) {
      case 'outcome': return expenseCategories.value
      case 'income': return incomeCategories.value
      case 'internal': return internalTransferCategories.value
      default: return [...expenseCategories.value, ...incomeCategories.value, ...internalTransferCategories.value]
    }
  }

  return {
    expenseCategories,
    incomeCategories,
    internalTransferCategories,
    getCategoriesByType
  }
}
