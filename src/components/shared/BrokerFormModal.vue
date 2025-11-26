<script setup>
import { ref, reactive, computed, watch } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'

// Componentes UI reutilizables
import BaseModal from '@/components/shared/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

// Props y Emits
const props = defineProps({
  show: { type: Boolean, required: true },
  brokerId: { type: [Number, String], default: null }, // Si viene ID, es Edición
})

const emit = defineEmits(['close', 'saved'])

// --- ESTADO ---
const isSubmitting = ref(false)
const isLoadingData = ref(false)

const form = reactive({
  name: '',
  email: '',
  document_id: '',
  default_commission_rate: '',
})

// Computada para saber el modo
const isEditing = computed(() => !!props.brokerId)
const modalTitle = computed(() =>
  isEditing.value ? 'Editar Corredor' : 'Registrar Nuevo Corredor',
)

// --- LÓGICA DE CARGA (EDICIÓN) ---
watch(
  () => props.show,
  async (newVal) => {
    if (newVal) {
      if (isEditing.value) {
        // Modo Edición: Cargar datos
        await fetchBrokerData()
      } else {
        // Modo Crear: Limpiar formulario
        resetForm()
      }
    }
  },
)

const fetchBrokerData = async () => {
  isLoadingData.value = true
  try {
    const { data } = await api.get(`/brokers/${props.brokerId}`)
    // Llenamos el formulario con los datos recibidos
    form.name = data.name
    form.email = data.email || ''
    form.document_id = data.document_id || ''
    form.default_commission_rate = data.default_commission_rate || 0
  } catch (error) {
    notify.error('Error al cargar datos del corredor.')
    emit('close') // Cerrar si falla la carga
  } finally {
    isLoadingData.value = false
  }
}

const resetForm = () => {
  form.name = ''
  form.email = ''
  form.document_id = ''
  form.default_commission_rate = ''
}

// --- GUARDAR (SUBMIT) ---
const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    if (isEditing.value) {
      // ACTUALIZAR
      await api.put(`/brokers/${props.brokerId}`, form)
      notify.success('Corredor actualizado correctamente.')
    } else {
      // CREAR
      await api.post('/brokers', form)
      notify.success('Corredor creado exitosamente.')
    }

    emit('saved') // Avisar al padre para recargar la lista
    emit('close') // Cerrar modal
  } catch (error) {
    // Manejo básico de errores de validación del backend
    if (error.response?.status === 422) {
      notify.warning('Verifica los datos ingresados.')
    } else {
      notify.error('Error al guardar el corredor.')
    }
    console.error(error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <BaseModal :show="show" :title="modalTitle" @close="emit('close')">
    <div v-if="isLoadingData" class="loading-state">
      <p>Cargando información...</p>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="broker-form">
      <BaseInput
        label="Nombre del Corredor / Empresa *"
        v-model="form.name"
        placeholder="Ej: Juan Pérez o Inversiones XYZ"
        required
      />

      <div class="grid-2">
        <BaseInput
          label="Documento ID (Opcional)"
          v-model="form.document_id"
          placeholder="V-12345678"
        />

        <BaseInput
          label="Correo Electrónico"
          type="email"
          v-model="form.email"
          placeholder="contacto@ejemplo.com"
        />
      </div>

      <div class="commission-section">
        <BaseInput
          label="Tasa de Comisión Base (%)"
          type="number"
          step="0.01"
          v-model="form.default_commission_rate"
          placeholder="0.00"
          hint="Esta comisión se sugerirá automáticamente en las operaciones."
        />
      </div>

      <div class="modal-actions">
        <button type="button" class="btn-cancel" @click="emit('close')">Cancelar</button>
        <button type="submit" class="btn-save" :disabled="isSubmitting">
          {{ isSubmitting ? 'Guardando...' : 'Guardar Datos' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<style scoped>
.broker-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.loading-state {
  text-align: center;
  padding: 30px;
  color: #888;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}

.btn-cancel {
  background: transparent;
  border: 1px solid #555;
  color: #ccc;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}
.btn-cancel:hover {
  background: #333;
}

.btn-save {
  background: var(--color-primary);
  color: #000; /* Texto oscuro para contraste con amarillo */
  border: none;
  padding: 10px 25px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}
.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
