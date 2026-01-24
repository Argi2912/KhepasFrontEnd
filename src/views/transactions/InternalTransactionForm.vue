<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useTransactionStore } from '@/stores/transaction'
import { useAuthStore } from '@/stores/auth'
import { useFormValidation } from '@/utils/useFormValidation'
import { useRouter } from 'vue-router'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import api from '@/services/api'
import notify from '@/services/notify'

const router = useRouter()
const authStore = useAuthStore()
const transactionStore = useTransactionStore()
const { errors, handleAxiosError } = useFormValidation()

const isSubmitting = ref(false)

// Listas de datos
const lists = reactive({
  employees: [],
  clients: [],
  providers: [],
  brokers: [],
  platforms: [],
  investors: [] // <--- AGREGADO: Lista de Inversionistas
})

// Opciones para el primer selector
const entityTypes = [
  { id: 'App\\Models\\Employee', name: 'Gestión de Nóminas (Empleados)' },
  { id: 'App\\Models\\Client', name: 'Clientes' },
  { id: 'App\\Models\\Provider', name: 'Proveedores' },
  { id: 'App\\Models\\Broker', name: 'Corredores' },
  { id: 'App\\Models\\Platform', name: 'Plataformas' },
  { id: 'App\\Models\\Investor', name: 'Inversionistas' }, // <--- AGREGADO: Opción Inversionistas
  { id: 'manual', name: 'Otro / Manual' }
]

const form = reactive({
  account_id: '',
  user_id: authStore.authUser?.id,
  type: 'expense', // expense | income
  category: '',

  // Lógica dinámica
  entity_type: '',
  entity_id: '',

  // Campos de texto
  dueño: '',
  person_name: '',

  amount: '',
  description: '',
  transaction_date: new Date().toISOString().split('T')[0],
})

// =========================================================================
// CARGA DE DATOS
// =========================================================================
onMounted(async () => {
  await transactionStore.fetchAllSupportData()

  // 1. Clientes
  try {
    const { data } = await api.get('/clients?per_page=100')
    lists.clients = data.data.map(x => ({ id: x.id, name: x.name || x.alias }))
  } catch (e) { console.error(e) }

  // 2. Proveedores
  try {
    const { data } = await api.get('/providers?per_page=100')
    lists.providers = data.data.map(x => ({ id: x.id, name: x.name || x.alias }))
  } catch (e) { console.error(e) }

  // 3. Corredores
  try {
    const { data } = await api.get('/brokers?per_page=100')
    lists.brokers = data.data.map(x => ({ id: x.id, name: x.name || x.alias }))
  } catch (e) { console.error(e) }

  // 4. Plataformas
  try {
    const response = await api.get('/platforms?per_page=100')
    const records = Array.isArray(response.data) ? response.data : (response.data.data || [])
    lists.platforms = records.map(x => ({ id: x.id, name: x.name }))
  } catch (e) { console.error(e) }

  // 5. Empleados
  try {
    const { data } = await api.get('/employees?per_page=100')
    lists.employees = data.data.map(x => ({ id: x.id, name: x.name }))
  } catch (e) { console.warn("No se pudo cargar Empleados") }

  // 6. Inversionistas (AGREGADO)
  try {
    const { data } = await api.get('/investors?per_page=100')
    lists.investors = data.data.map(x => ({ id: x.id, name: x.name || x.alias }))
  } catch (e) { console.error("Error cargando Inversionistas", e) }
})

// =========================================================================
// LÓGICA REACTIVA
// =========================================================================
const entityOptions = computed(() => {
  switch (form.entity_type) {
    case 'App\\Models\\Employee': return lists.employees
    case 'App\\Models\\Client': return lists.clients
    case 'App\\Models\\Provider': return lists.providers
    case 'App\\Models\\Broker': return lists.brokers
    case 'App\\Models\\Platform': return lists.platforms
    case 'App\\Models\\Investor': return lists.investors // <--- AGREGADO: Case Inversionistas
    default: return []
  }
})

watch(() => form.entity_type, () => {
  form.entity_id = ''
  form.person_name = ''
})

watch(() => form.entity_id, (newId) => {
  if (!newId || form.entity_type === 'manual') return
  const selected = entityOptions.value.find(item => item.id === newId)
  if (selected) {
    form.person_name = selected.name
    const typeName = entityTypes.find(t => t.id === form.entity_type)?.name
    form.dueño = typeName || 'Registrado'
  }
})

// =========================================================================
// 🔥 FUNCIÓN DE ENVÍO SIN ALERTA AMARILLA 🔥
// =========================================================================
const handleSubmit = async () => {
  isSubmitting.value = true

  // Limpiamos errores previos en la UI (el texto rojo antiguo)
  Object.keys(errors).forEach(key => errors[key] = '')

  try {
    // 1. Preparar Payload
    const payload = {
      ...form,
      source_type: 'account'
    }

    if (payload.entity_type === 'manual') {
      payload.entity_type = null
      payload.entity_id = null
    }

    // 2. Enviar Petición
    await api.post('/transactions/internal', payload)

    // 3. Éxito
    notify.success('Transacción registrada exitosamente')
    router.back()

  } catch (error) {
    console.error("Error al guardar:", error)

    // 🔥 AQUÍ ESTÁ EL CAMBIO PARA BORRAR LA ALERTA AMARILLA 🔥
    // Verificamos si es el error de saldo o cualquier error que venga con "message" desde el backend
    if (error.response && error.response.data && error.response.data.message) {

      // Asignamos el mensaje directamente al campo amount para que salga rojo
      errors.amount = error.response.data.message

      // ¡IMPORTANTE! Aquí hacemos return. NO llamamos a handleAxiosError.
      // Al no llamarlo, la alerta amarilla nunca se genera.
      return
    }

    // Solo si NO es un error de saldo (ej. error 500, o de red), llamamos al genérico
    handleAxiosError(error)

  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="internal-container">
    <h1>Movimiento de Caja (Interno)</h1>

    <div class="card">
      <form @submit.prevent="handleSubmit">

        <div class="type-selector">
          <label :class="{ active: form.type === 'income', income: true }">
            <input type="radio" value="income" v-model="form.type" />
            INGRESO / APORTE
          </label>
          <label :class="{ active: form.type === 'expense', expense: true }">
            <input type="radio" value="expense" v-model="form.type" />
            EGRESO / GASTO
          </label>
        </div>

        <div class="form-grid">
          <BaseSelect label="Cuenta Afectada (Caja/Banco)" :options="transactionStore.getAccounts"
            v-model="form.account_id" required :error="errors.account_id" />

          <BaseInput label="Monto" type="number" step="0.01" v-model="form.amount" required :error="errors.amount" />

          <BaseSelect label="Tipo de Beneficiario / Pagador" :options="entityTypes" v-model="form.entity_type" required
            placeholder="Seleccione grupo (Ej: Cliente, Proveedor...)" />

          <div v-if="form.entity_type && form.entity_type !== 'manual'">
            <BaseSelect label="Seleccione la Persona/Entidad" :options="entityOptions" v-model="form.entity_id" required
              :disabled="entityOptions.length === 0"
              :placeholder="entityOptions.length === 0 ? 'No hay registros cargados' : 'Busque en la lista...'" />
            <small v-if="entityOptions.length === 0" class="warning-text">
              ⚠️ No se cargaron datos para esta opción.
            </small>
          </div>

          <div v-if="form.entity_type === 'manual'" class="manual-fields">
            <BaseInput label="Nombre de la Persona (Manual)" placeholder="Escriba el nombre..."
              v-model="form.person_name" required :error="errors.person_name" />
            <BaseInput label="Referencia / Titular" placeholder="Titular..." v-model="form.dueño" />
          </div>
        </div>

        <BaseInput label="Categoría (Ej: Nómina, Servicios, Alquiler)" v-model="form.category" required
          :error="errors.category" class="mt-4" />

        <BaseInput label="Descripción / Notas" v-model="form.description" class="mt-4" />

        <div class="actions">
          <button type="button" @click="router.back()" class="btn-cancel">Cancelar</button>
          <button type="submit" class="btn-save" :disabled="isSubmitting">
            {{ isSubmitting ? 'Guardando...' : 'Registrar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.internal-container {
  max-width: 600px;
  margin: 20px auto;
}

.card {
  background: var(--color-secondary);
  padding: 30px;
  border-radius: 10px;
}

.type-selector {
  display: flex;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

.type-selector label {
  flex: 1;
  text-align: center;
  padding: 15px;
  cursor: pointer;
  font-weight: bold;
  opacity: 0.7;
}

.type-selector input {
  display: none;
}

.type-selector label.active {
  opacity: 1;
  color: white;
}

.type-selector label.income.active {
  background-color: #28a745;
}

.type-selector label.expense.active {
  background-color: #dc3545;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 20px;
}

.btn-save {
  background: var(--color-primary);
  color: white;
  padding: 10px 25px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.btn-cancel {
  background: transparent;
  border: 1px solid #ccc;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}
</style>