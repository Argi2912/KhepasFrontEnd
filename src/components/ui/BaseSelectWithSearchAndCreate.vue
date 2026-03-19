<script setup>
import { ref, computed, watch, reactive, onBeforeUnmount, nextTick } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import api from '@/services/api'
import notify from '@/services/notify'

const props = defineProps({
  modelValue: [String, Number],
  label: String,
  options: { type: Array, required: true },
  placeholder: String,
  error: String,
  required: Boolean,
  name: String,
  trackBy: { type: String, default: 'id' },
  labelBy: { type: String, default: 'name' },
  createLabel: { type: String, default: 'Crear Nuevo' },
  createEndpoint: { type: String, required: true },
  createFields: { type: Object, required: true },
})

const emit = defineEmits(['update:modelValue', 'change', 'saved'])

const searchTerm = ref('')
const isDropdownOpen = ref(false)
const showCreateModal = ref(false)
const isCreating = ref(false)
const createForm = reactive({ ...props.createFields })
const createErrors = reactive({})
const formId = `create-form-${Math.random().toString(36).slice(2)}`
const wrapperRef = ref(null)
const dropdownRef = ref(null)
const teleStyle = reactive({ left: '0px', top: '0px', width: 'auto' })

const filteredOptions = computed(() => {
  if (!searchTerm.value) return props.options
  const lowerSearch = searchTerm.value.toLowerCase()
  return props.options.filter((option) =>
    (option[props.labelBy] || '').toLowerCase().includes(lowerSearch),
  )
})

const selectedOptionText = computed(() => {
  const selected = props.options.find(
    (opt) => String(opt[props.trackBy]) === String(props.modelValue),
  )
  return selected ? selected[props.labelBy] : ''
})

const selectOption = (value) => {
  emit('update:modelValue', value)
  emit('change', value)
  isDropdownOpen.value = false
}

function updateDropdownPosition() {
  if (!wrapperRef.value) return
  const rect = wrapperRef.value.getBoundingClientRect()
  teleStyle.left = rect.left + window.scrollX + 'px'
  teleStyle.top = rect.bottom + window.scrollY + 'px'
  teleStyle.width = rect.width + 'px'
}

function onDocumentClick(e) {
  const target = e.target
  if (!wrapperRef.value) return
  const insideWrapper = wrapperRef.value.contains(target)
  const insideDropdown = dropdownRef.value ? dropdownRef.value.contains(target) : false
  if (!insideWrapper && !insideDropdown) {
    isDropdownOpen.value = false
  }
}

watch(isDropdownOpen, async (val) => {
  if (val) {
    await nextTick()
    updateDropdownPosition()
    window.addEventListener('resize', updateDropdownPosition)
    window.addEventListener('scroll', updateDropdownPosition, true)
    document.addEventListener('click', onDocumentClick)
  } else {
    window.removeEventListener('resize', updateDropdownPosition)
    window.removeEventListener('scroll', updateDropdownPosition, true)
    document.removeEventListener('click', onDocumentClick)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDropdownPosition)
  window.removeEventListener('scroll', updateDropdownPosition, true)
  document.removeEventListener('click', onDocumentClick)
})

const handleCreation = async () => {
  isCreating.value = true
  Object.keys(createErrors).forEach((key) => delete createErrors[key])

  try {
    const response = await api.post(props.createEndpoint, createForm)
    const newRecord = response.data
    notify.success(`${props.createLabel} creado(a) exitosamente.`)
    emit('saved', newRecord)
    selectOption(newRecord[props.trackBy])
    showCreateModal.value = false
    Object.keys(props.createFields).forEach((key) => (createForm[key] = props.createFields[key]))
  } catch (error) {
    if (error.response?.data?.errors) {
      Object.assign(createErrors, error.response.data.errors)
      notify.error('Error de validación al crear el registro.')
    } else {
      notify.error(error.response?.data?.message || 'Error al crear el registro.')
    }
  } finally {
    isCreating.value = false
  }
}

watch(selectedOptionText, (newText) => {
  if (!isDropdownOpen.value || newText) {
    searchTerm.value = newText
  }
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      const selected = props.options.find((opt) => String(opt[props.trackBy]) === String(newValue))
      if (selected) searchTerm.value = selected[props.labelBy]
    } else {
      searchTerm.value = ''
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="mb-6">
    <label v-if="label" class="block mb-2 text-[0.95rem] text-white/70 font-medium">
      {{ label }}
      <span v-if="required" class="text-danger ml-1">*</span>
    </label>

    <div class="relative" ref="wrapperRef">
      <div 
        :class="['flex items-center border border-white/10 bg-background rounded-lg transition-all cursor-pointer px-3', isDropdownOpen ? 'border-primary ring-1 ring-primary' : '', error ? '!border-danger !ring-1 !ring-danger' : '']" 
        @click="isDropdownOpen = true"
      >
        <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" class="text-primary mr-3 text-base" />
        <input 
          type="text" 
          v-model="searchTerm" 
          :placeholder="placeholder || 'Buscar o seleccionar...'"
          @focus="isDropdownOpen = true" 
          class="grow border-none bg-transparent py-3 text-white min-h-[44px] outline-none" 
          :aria-invalid="!!error" 
          autocomplete="off" 
        />
        <FontAwesomeIcon 
          :icon="isDropdownOpen ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'" 
          class="text-white/30 transition-transform" 
          @click.stop="isDropdownOpen = !isDropdownOpen" 
        />
      </div>

      <teleport to="body">
        <div 
          v-show="isDropdownOpen" 
          ref="dropdownRef" 
          class="absolute bg-[#2b2f36] border border-primary rounded-lg z-[9999] max-h-[300px] overflow-y-auto shadow-[0_4px_15px_rgba(0,0,0,0.5)] mt-1"
          :style="{ left: teleStyle.left, top: teleStyle.top, width: teleStyle.width }"
        >
          <div class="flex items-center gap-2.5 py-3 px-4 border-b border-white/10 cursor-pointer text-success font-bold bg-success/10 sticky top-0 z-10 backdrop-blur-sm hover:bg-success/20 transition-colors" @click="showCreateModal = true">
            <FontAwesomeIcon icon="fa-solid fa-plus-circle" />
            <span>{{ createLabel }}</span>
          </div>

          <div 
            v-for="option in filteredOptions" 
            :key="option[trackBy]" 
            :class="['py-3 px-4 cursor-pointer text-white/80 border-b border-white/5 hover:bg-white/5 transition-colors', String(option[trackBy]) === String(modelValue) ? 'bg-primary text-[#111] font-bold' : '']" 
            @click="selectOption(option[trackBy])"
          >
            {{ option[labelBy] }}
          </div>

          <div v-if="filteredOptions.length === 0 && searchTerm" class="py-4 text-white/40 text-center italic">
            <p>No se encontraron resultados para "{{ searchTerm }}".</p>
          </div>
        </div>
      </teleport>
    </div>

    <p v-if="error" class="mt-1 text-sm text-danger">{{ error }}</p>

    <BaseModal :show="showCreateModal" :title="`Crear Nuevo ${createLabel}`" @close="showCreateModal = false">
      <form :id="formId" @submit.prevent="handleCreation">
        <div v-for="(value, key) in createFields" :key="key">
          <BaseInput 
            :label="key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')" 
            type="text"
            v-model="createForm[key]" 
            :error="createErrors[key] ? createErrors[key][0] : null" 
            required 
          />
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end pt-4 gap-3">
          <button type="button" class="py-2.5 px-5 bg-transparent border border-white/20 text-white/70 rounded-lg cursor-pointer hover:bg-white/5 transition-colors" @click="showCreateModal = false">Cancelar</button>
          <button type="submit" class="py-2.5 px-5 bg-success text-white border-none rounded-lg font-bold cursor-pointer disabled:opacity-50 transition-colors hover:bg-success/80" :disabled="isCreating" :form="formId">
            <FontAwesomeIcon v-if="isCreating" icon="fa-solid fa-spinner" spin />
            {{ isCreating ? 'Creando...' : 'Guardar' }}
          </button>
        </div>
      </template>
    </BaseModal>
  </div>
</template>