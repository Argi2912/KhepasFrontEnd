<script setup>
import { ref, watch } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'

// Componentes UI Estándar
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

const props = defineProps({
  show: Boolean,
  investorId: [Number, null],
})

const emit = defineEmits(['close', 'saved'])

const form = ref({
  name: '',
  alias: '',
  email: '',
  phone: '',
  interest_rate: '', // <--- NUEVO
  payout_day: '',    // <--- NUEVO
  is_active: true,
})

const loading = ref(false)
const title = ref('Registrar Inversionista')

watch(
  () => props.investorId,
  async (id) => {
    if (id && props.show) {
      loading.value = true
      try {
        const { data } = await api.get(`/investors/${id}`)
        // Asignamos datos y aseguramos valores por defecto para los nuevos campos
        form.value = {
          ...data,
          is_active: data.is_active == 1,
          interest_rate: data.interest_rate || 0,
          payout_day: data.payout_day || 30
        }
        title.value = 'Editar Inversionista'
      } catch (err) {
        notify.error('Error al cargar datos del inversionista')
        emit('close')
      } finally {
        loading.value = false
      }
    } else if (!id) {
      // Valores iniciales (Reset)
      form.value = {
        name: '',
        alias: '',
        email: '',
        phone: '',
        interest_rate: 0,  // <--- Por defecto 0%
        payout_day: 30,    // <--- Por defecto día 30
        is_active: true
      }
      title.value = 'Registrar Inversionista'
    }
  },
  { immediate: true },
)

const submit = async () => {
  loading.value = true
  try {
    if (props.investorId) {
      await api.put(`/investors/${props.investorId}`, form.value)
      notify.success('Inversionista actualizado')
    } else {
      await api.post('/investors', form.value)
      notify.success('Inversionista registrado')
    }
    emit('saved')
    emit('close')
  } catch (error) {
    const msg = error.response?.data?.message || 'Error al guardar'
    notify.error(msg)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <BaseModal :show="show" :title="title" @close="emit('close')">

    <form @submit.prevent="submit" id="investorForm">

      <BaseInput v-model="form.name" label="Nombre Completo" required placeholder="Ej: Juan Pérez" />

      <div class="form-row">
        <BaseInput v-model="form.alias" label="Alias (Opcional)" placeholder="Ej: Socio Juan" />
        <BaseInput v-model="form.phone" label="Teléfono" placeholder="+58 412..." />
      </div>

      <BaseInput v-model="form.email" label="Email" type="email" placeholder="correo@ejemplo.com" />

      <div class="interest-section">
        <h4><i class="fas fa-chart-line"></i> Configuración de Rendimiento</h4>

        <div class="form-row">
          <BaseInput v-model="form.interest_rate" label="Tasa de Interés (%)" required type="number" step="0.01" min="0"
            placeholder="Ej: 5.00" />

          <BaseInput v-model="form.payout_day" label="Día de Corte Mensual" required type="number" min="1" max="31"
            placeholder="Ej: 30" />
        </div>

        <p class="info-text">
          El sistema sumará automáticamente el <strong>{{ form.interest_rate }}%</strong>
          al saldo total cada día <strong>{{ form.payout_day }}</strong> del mes.
        </p>
      </div>

      <div class="checkbox-group">
        <label>
          <input v-model="form.is_active" type="checkbox" />
          <span class="ml-2">Inversionista Activo</span>
        </label>
      </div>

    </form>

    <template #footer>
      <div class="modal-actions">
        <button type="button" @click="emit('close')" class="btn-secondary" :disabled="loading">
          Cancelar
        </button>
        <button type="submit" form="investorForm" class="btn-primary" :disabled="loading">
          {{ loading ? 'Guardando...' : 'Guardar Datos' }}
        </button>
      </div>
    </template>

  </BaseModal>
</template>

<style scoped>
/* Estilos para el grid de 2 columnas */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* Sección visual para destacar la configuración de intereses */
.interest-section {

  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  margin-bottom: 20px;
  margin-top: 10px;
}

.interest-section h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 0.95rem;
  color: var(--color-primary);
  font-weight: 600;
}

.info-text {
  font-size: 0.85rem;
  color: #6c757d;
  margin: 10px 0 0 0;
  font-style: italic;
  line-height: 1.4;
}

.checkbox-group {
  margin-top: 15px;
  display: flex;
  align-items: center;
}

.ml-2 {
  margin-left: 8px;
  font-weight: 500;
}

/* Botones alineados con tu tema */
.modal-actions {
  display: flex;
  gap: 12px;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-size: 0.95rem;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e2e6ea;
  color: #495057;
}

.btn-secondary:hover {
  background: #dbe2e8;
}
</style>