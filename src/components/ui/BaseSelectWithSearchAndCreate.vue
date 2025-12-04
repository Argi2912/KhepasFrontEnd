<script setup>
import { ref, computed, watch, reactive, onBeforeUnmount, nextTick } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import BaseInput from './BaseInput.vue' // Reutilizamos BaseInput para el campo de búsqueda
import BaseModal from './BaseModal.vue' // Reutilizamos BaseModal para la creación
import api from '@/services/api'
import notify from '@/services/notify'

const props = defineProps({
  // Props de Select (de la store)
  modelValue: [String, Number],
  label: String,
  options: { type: Array, required: true },
  placeholder: String,
  error: String,
  required: Boolean,
  name: String,
  trackBy: { type: String, default: 'id' },
  labelBy: { type: String, default: 'name' },

  // Props de Creación Rápida
  createLabel: { type: String, default: 'Crear Nuevo' },
  // URL para el POST de creación (Ej: '/clients')
  createEndpoint: { type: String, required: true },
  // Campos del formulario de creación (Ej: { name: '', email: '' })
  createFields: { type: Object, required: true },
})

const emit = defineEmits(['update:modelValue', 'change', 'record-created'])

// --- ESTADO LOCAL ---
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

// --- COMPUTED Y LÓGICA DE FILTRADO ---
const filteredOptions = computed(() => {
  if (!searchTerm.value) {
    return props.options
  }
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

// --- MANEJADORES DE EVENTOS ---
const selectOption = (value) => {
  emit('update:modelValue', value)
  emit('change', value)
  isDropdownOpen.value = false
  searchTerm.value = '' // Limpiar búsqueda al seleccionar
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
  // Limpiar errores previos
  Object.keys(createErrors).forEach((key) => delete createErrors[key])

  try {
    const response = await api.post(props.createEndpoint, createForm)
    const newRecord = response.data
    notify.success(`${props.createLabel} creado(a) exitosamente.`)

    // 1. Notificar al padre que se ha creado un nuevo registro
    emit('record-created', newRecord)

    // 2. Seleccionar automáticamente el nuevo registro
    selectOption(newRecord[props.trackBy])

    // 3. Cerrar y resetear
    showCreateModal.value = false
    Object.keys(props.createFields).forEach((key) => (createForm[key] = props.createFields[key]))
  } catch (error) {
    if (error.response?.data?.errors) {
      Object.assign(createErrors, error.response.data.errors)
      notify.error('Error de validación al crear el registro.')
    } else {
      notify.error(error.response?.data?.message || 'Error al crear el registro.')
    }
    console.error('Error de creación:', error)
  } finally {
    isCreating.value = false
  }
}

// Observar el valor del modelo para actualizar el campo de búsqueda visual
watch(selectedOptionText, (newText) => {
  searchTerm.value = newText
})

// Inicializar el searchTerm con el valor actual al montar
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      const selected = props.options.find((opt) => String(opt[props.trackBy]) === String(newValue))
      if (selected) {
        searchTerm.value = selected[props.labelBy]
      }
    } else {
      searchTerm.value = ''
    }
  },
  { immediate: true },
)
</script>

<template>
  <div :class="['form-group', { 'has-error': error }]">
    <label v-if="label">
      {{ label }}
      <span v-if="required" class="required-star">*</span>
    </label>

    <div class="custom-select-wrapper" ref="wrapperRef">
      <div :class="['input-wrapper', { open: isDropdownOpen }]" @click="isDropdownOpen = true">
        <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" class="input-icon" />
        <input
          type="text"
          v-model="searchTerm"
          :placeholder="placeholder || 'Buscar o seleccionar...'"
          @focus="isDropdownOpen = true"
          class="search-input"
          :aria-invalid="!!error"
          autocomplete="off"
        />
        <FontAwesomeIcon
          :icon="isDropdownOpen ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"
          class="dropdown-icon"
          @click.stop="isDropdownOpen = !isDropdownOpen"
        />
      </div>

      <teleport to="body">
        <div
          v-show="isDropdownOpen"
          ref="dropdownRef"
          class="dropdown-options"
          :style="{ left: teleStyle.left, top: teleStyle.top, width: teleStyle.width }"
        >
          <div
            v-for="option in filteredOptions"
            :key="option[trackBy]"
            :class="[
              'option-item',
              {
                selected: String(option[trackBy]) === String(modelValue),
              },
            ]"
            @click="selectOption(option[trackBy])"
          >
            {{ option[labelBy] }}
          </div>

          <div v-if="filteredOptions.length === 0 && searchTerm">
            <p class="no-results">No se encontraron resultados para "{{ searchTerm }}".</p>
          </div>

          <div class="create-quick-add" @click="showCreateModal = true">
            <FontAwesomeIcon icon="fa-solid fa-plus-circle" />
            <span>{{ createLabel }}</span>
          </div>
        </div>
      </teleport>
    </div>

    <p v-if="error" class="error-message">{{ error }}</p>
    <BaseModal
      :show="showCreateModal"
      :title="`Crear Nuevo ${createLabel}`"
      @close="showCreateModal = false"
    >
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
        <button type="submit" class="btn btn-primary" :disabled="isCreating" :form="formId">
          <FontAwesomeIcon v-if="isCreating" icon="fa-solid fa-spinner" spin />
          {{ isCreating ? 'Creando...' : 'Guardar' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
/* Estilos similares a BaseSelect, pero adaptados para el campo de búsqueda */

.form-group {
  margin-bottom: 25px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.95rem;
  color: #ccc;
  font-weight: 500;
}

.required-star {
  color: var(--color-danger);
  margin-left: 5px;
}

.error-message {
  margin-top: 4px;
  font-size: 0.85rem;
  color: var(--color-danger);
}

.custom-select-wrapper {
  position: relative;
}

.input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
  border-radius: 6px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  cursor: pointer;
  padding: 0 12px;
}

.input-wrapper.open {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.input-icon {
  color: var(--color-primary);
  margin-right: 12px;
  font-size: 1rem;
}

.search-input {
  flex-grow: 1;
  border: none;
  background: transparent;
  padding: 12px 0;
  color: var(--color-text-light);
  min-height: 44px;
}

.dropdown-icon {
  color: #555;
  transition: transform 0.2s;
}

.dropdown-options {
  position: absolute;
  /* top/left/width se calculan en línea desde teleStyle */
  background-color: var(--color-secondary);
  border: 1px solid var(--color-primary);
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  z-index: 2147483647; /* máximo para evitar clipping por stacking contexts */
  max-height: 350px; /* Más altura para mayor visibilidad */
  overflow-y: auto;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
}

.option-item {
  padding: 10px 15px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.option-item:hover {
  background-color: #333;
}

.option-item.selected {
  background-color: var(--color-primary-dark);
  color: #fff;
}

.no-results {
  padding: 10px 15px;
  color: #999;
  font-style: italic;
}

.create-quick-add {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  border-top: 1px solid #444;
  cursor: pointer;
  color: var(--color-success);
  font-weight: 600;
  background-color: #2a3d3a;
  transition: background-color 0.2s;
}
.create-quick-add:hover {
  background-color: #38504e;
}

/* Estilos para el Modal de creación */
.modal-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
