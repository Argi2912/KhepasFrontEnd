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
  clientId: [Number, String, null],
})

const emit = defineEmits(['close', 'saved'])

const { handleAxiosError, getError, clearError } = useFormValidation()

const initialForm = {
  name: '',
  email: '',
  phone: '',
  details: '',
}
const form = reactive({ ...initialForm })

const isLoading = ref(false)
const isSubmitting = ref(false)

const isEditing = computed(() => !!props.clientId)
const modalTitle = computed(() => (isEditing.value ? 'Configurar Perfil de Cliente' : 'Nueva Alta de Cliente'))

const resetForm = () => {
  Object.assign(form, initialForm)
  clearError()
}

const fetchClient = async (id) => {
  if (!id) return
  isLoading.value = true
  try {
    const response = await api.get(`/clients/${id}`)
    Object.assign(form, response.data)
  } catch (error) {
    notify.error('Fallo al recuperar datos del perfil.')
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
      await api.put(`/clients/${props.clientId}`, form)
      notify.success(`Perfil de "${form.name}" actualizado correctamente.`)
    } else {
      await api.post('/clients', form)
      notify.success(`Cliente "${form.name}" registrado en la cartera.`)
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
  () => props.clientId,
  (newId) => {
    resetForm()
    if (newId) fetchClient(newId)
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
       <p class="text-[0.65rem] font-bold uppercase tracking-widest text-primary/40">Sincronizando perfil...</p>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Identidad -->
      <BaseInput 
        v-model="form.name" 
        label="Nombre Completo / Razón Social" 
        name="name" 
        :error="getError('name')" 
        icon="fa-solid fa-id-card" 
        placeholder="Ej: Inversiones Globales C.A." 
        required 
        @input="clearError('name')" 
      />

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BaseInput 
          v-model="form.email" 
          label="Correo Electrónico" 
          name="email" 
          type="email" 
          :error="getError('email')" 
          icon="fa-solid fa-at" 
          placeholder="contacto@empresa.com" 
          @input="clearError('email')" 
        />
        
        <BaseInput 
          v-model="form.phone" 
          label="Teléfono de Contacto" 
          name="phone" 
          :error="getError('phone')" 
          icon="fa-solid fa-mobile-screen" 
          placeholder="+58 412..." 
          @input="clearError('phone')" 
        />
      </div>

      <!-- Notas Premium -->
      <div class="space-y-2 group">
        <label for="details" class="inline-block text-[0.7rem] font-black uppercase tracking-[0.15em] text-white/40 group-focus-within:text-primary transition-colors">
          Observaciones del Cliente
        </label>
        <textarea 
          id="details" 
          v-model="form.details" 
          name="details" 
          rows="3" 
          class="w-full bg-white/[0.03] border border-white/5 p-4 text-sm text-white rounded-xl outline-none focus:bg-white/[0.05] focus:border-primary/50 transition-all placeholder:text-white/10" 
          placeholder="Anotaciones extra sobre el perfil comercial..."
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
          <span v-if="isSubmitting">Guardando...</span>
          <span v-else>{{ isEditing ? 'Actualizar Perfil' : 'Registrar Cliente' }}</span>
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
