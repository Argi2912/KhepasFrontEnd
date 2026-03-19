<script setup>
import { ref, reactive, computed, watch } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'
import { useFormValidation } from '@/utils/useFormValidation'

import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/shared/BaseButton.vue'

const props = defineProps({
  show: Boolean,
  providerId: [Number, String, null],
})

const emit = defineEmits(['close', 'saved'])

const { handleAxiosError, getError, clearError } = useFormValidation()

const initialForm = {
  name: '',
  email: '',
  phone: '',
  contact_person: '',
  details: '',
  is_commission_informative: false
}
const form = reactive({ ...initialForm })

const isLoading = ref(false)
const isSubmitting = ref(false)

const isEditing = computed(() => !!props.providerId)
const modalTitle = computed(() => (isEditing.value ? 'Configurar Alianza Comercial' : 'Registro de Nuevo Proveedor'))

const resetForm = () => {
  Object.assign(form, initialForm)
  clearError()
}

const fetchProvider = async (id) => {
  if (!id) return
  isLoading.value = true
  try {
    const response = await api.get(`/providers/${id}`)
    const data = response.data
    data.is_commission_informative = !!data.is_commission_informative
    Object.assign(form, data)
  } catch (error) {
    notify.error('Fallo al recuperar datos del proveedor.')
    emit('close')
  } finally {
    isLoading.value = false
  }
}

const handleSubmit = async () => {
  isSubmitting.value = true
  clearError()
  try {
    if (isEditing.value) {
      await api.put(`/providers/${props.providerId}`, form)
      notify.success(`Proveedor "${form.name}" actualizado.`)
    } else {
      await api.post('/providers', form)
      notify.success(`Proveedor "${form.name}" integrado exitosamente.`)
    }
    emit('saved')
    emit('close')
  } catch (error) {
    handleAxiosError(error)
  } finally {
    isSubmitting.value = false
  }
}

watch(
  () => props.providerId,
  (newId) => {
    resetForm()
    if (newId) fetchProvider(newId)
  },
  { immediate: true },
)

watch(
  () => props.show,
  (newVal) => {
    if (!newVal) resetForm()
  },
)
</script>

<template>
  <BaseModal :show="show" :title="modalTitle" @close="emit('close')">
    <div v-if="isLoading" class="py-20 flex flex-col items-center justify-center gap-4">
       <div class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
       <p class="text-[0.65rem] font-bold uppercase tracking-widest text-primary/40">Sincronizando registros comerciales...</p>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Datos Principales -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BaseInput 
          v-model="form.name" 
          label="Nombre / Razón Social" 
          name="name" 
          :error="getError('name')" 
          icon="fa-solid fa-building" 
          placeholder="Nombre de la empresa" 
          required 
          @input="clearError('name')" 
        />
        <BaseInput 
          v-model="form.contact_person" 
          label="Persona de Contacto" 
          name="contact_person" 
          :error="getError('contact_person')" 
          icon="fa-solid fa-user-tie" 
          placeholder="Ej: Lic. Antonio Pérez" 
          @input="clearError('contact_person')" 
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BaseInput 
          v-model="form.email" 
          label="Correo Electrónico" 
          name="email" 
          type="email" 
          :error="getError('email')" 
          icon="fa-solid fa-at" 
          placeholder="proveedor@empresa.com" 
          @input="clearError('email')" 
        />
        <BaseInput 
          v-model="form.phone" 
          label="Teléfono de Operaciones" 
          name="phone" 
          :error="getError('phone')" 
          icon="fa-solid fa-headset" 
          placeholder="+58 212..." 
          @input="clearError('phone')" 
        />
      </div>

      <!-- Configuración Financiera -->
      <div class="premium-card p-5 bg-white/[0.01] border-white/5 flex items-center justify-between group/toggle">
        <div class="flex flex-col pr-6">
          <label class="font-black text-[0.7rem] uppercase tracking-widest text-primary/60 mb-1 group-hover/toggle:text-primary transition-colors">Comisión Informativa</label>
          <span class="text-[0.7rem] font-bold text-white/30 leading-snug">
            Si se activa, la comisión restará ganancia bruta pero <span class="text-white/60 underline decoration-primary/30">no generará deuda real</span> por pagar.
          </span>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="form.is_commission_informative" class="sr-only peer">
          <div class="w-12 h-6 bg-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/20 after:border-white/5 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary/20 peer-checked:after:bg-primary"></div>
        </label>
      </div>

      <!-- Observaciones -->
      <div class="space-y-2 group">
        <label for="details" class="inline-block text-[0.7rem] font-black uppercase tracking-[0.15em] text-white/40 group-focus-within:text-primary transition-colors">
          Términos Comerciales / Notas
        </label>
        <textarea 
          id="details" 
          v-model="form.details" 
          name="details" 
          rows="3" 
          class="w-full bg-white/[0.03] border border-white/5 p-4 text-sm text-white rounded-xl outline-none focus:bg-white/[0.05] focus:border-primary/50 transition-all placeholder:text-white/10" 
          placeholder="Condiciones de pago, horarios, etc..."
          :class="{ '!border-danger': getError('details') }" 
          @input="clearError('details')"
        ></textarea>
        <p v-if="getError('details')" class="text-[0.65rem] font-bold text-danger uppercase tracking-wider ml-1">{{ getError('details') }}</p>
      </div>
    </form>

    <template #footer>
      <div class="flex flex-col-reverse md:flex-row justify-end gap-3 w-full">
        <BaseButton variant="secondary" outline @click="emit('close')" :disabled="isSubmitting">Cancelar</BaseButton>
        <BaseButton variant="primary" @click="handleSubmit" :disabled="isSubmitting">
          <span v-if="isSubmitting">Sincronizando...</span>
          <span v-else>{{ isEditing ? 'Guardar Cambios' : 'Integrar Proveedor' }}</span>
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>