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

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <BaseInput v-model="form.alias" label="Alias (Opcional)" placeholder="Ej: Socio Juan" />
        <BaseInput v-model="form.phone" label="Teléfono" placeholder="+58 412..." />
      </div>

      <BaseInput v-model="form.email" label="Email" type="email" placeholder="correo@ejemplo.com" />

      <div class="p-4 rounded-lg border border-white/10 mb-5 mt-3">
        <h4 class="text-primary font-semibold text-[0.95rem] mb-4"><i class="fas fa-chart-line mr-2"></i>Configuración de Rendimiento</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <BaseInput v-model="form.interest_rate" label="Tasa de Interés (%)" required type="number" step="0.01" min="0" placeholder="Ej: 5.00" />
          <BaseInput v-model="form.payout_day" label="Día de Corte Mensual" required type="number" min="1" max="31" placeholder="Ej: 30" />
        </div>
        <p class="text-sm text-white/40 mt-3 italic leading-snug">
          El sistema sumará automáticamente el <strong class="text-white/60">{{ form.interest_rate }}%</strong>
          al saldo total cada día <strong class="text-white/60">{{ form.payout_day }}</strong> del mes.
        </p>
      </div>

      <div class="mt-4 flex items-center">
        <label class="flex items-center cursor-pointer">
          <input v-model="form.is_active" type="checkbox" class="w-4 h-4 accent-primary" />
          <span class="ml-2 font-medium text-white/80">Inversionista Activo</span>
        </label>
      </div>
    </form>

    <template #footer>
      <div class="flex gap-3">
        <button type="button" @click="emit('close')" class="py-2.5 px-5 bg-transparent border border-white/20 text-white/70 rounded-lg cursor-pointer hover:bg-white/5 transition-colors" :disabled="loading">Cancelar</button>
        <button type="submit" form="investorForm" class="py-2.5 px-5 bg-primary text-black rounded-lg font-bold cursor-pointer hover:opacity-90 disabled:bg-white/20 disabled:cursor-not-allowed transition-all" :disabled="loading">
          {{ loading ? 'Guardando...' : 'Guardar Datos' }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>