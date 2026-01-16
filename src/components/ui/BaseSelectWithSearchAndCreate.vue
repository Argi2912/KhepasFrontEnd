<script setup>
import { ref, computed, watch, reactive, onBeforeUnmount, nextTick } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import api from '@/services/api'
import notify from '@/services/notify'

const props = defineProps({
  // Props de Select
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
  createEndpoint: { type: String, required: true },
  createFields: { type: Object, required: true },
})

// 1. CORRECCIÓN: Emitir 'saved' para que coincida con tus formularios
const emit = defineEmits(['update:modelValue', 'change', 'saved'])

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
  // No limpiamos searchTerm aquí para mantener el nombre visible
}

function updateDropdownPosition() {
  if (!wrapperRef.value) return
  const rect = wrapperRef.value.getBoundingClientRect()

  // Usamos coordenadas absolutas al documento (scrollX/Y) para el teleport
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

    // 2. CORRECCIÓN: Emitir 'saved' aquí
    emit('saved', newRecord)

    // Seleccionar automáticamente
    selectOption(newRecord[props.trackBy])

    // Cerrar y resetear
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
  // Solo actualizamos el texto si no estamos buscando (o si hay un valor seleccionado válido)
  if (!isDropdownOpen.value || newText) {
    searchTerm.value = newText
  }
})

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
        <input type="text" v-model="searchTerm" :placeholder="placeholder || 'Buscar o seleccionar...'"
          @focus="isDropdownOpen = true" class="search-input" :aria-invalid="!!error" autocomplete="off" />
        <FontAwesomeIcon :icon="isDropdownOpen ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"
          class="dropdown-icon" @click.stop="isDropdownOpen = !isDropdownOpen" />
      </div>

      <teleport to="body">
        <div v-show="isDropdownOpen" ref="dropdownRef" class="dropdown-options"
          :style="{ left: teleStyle.left, top: teleStyle.top, width: teleStyle.width }">
          <div class="create-quick-add" @click="showCreateModal = true">
            <FontAwesomeIcon icon="fa-solid fa-plus-circle" />
            <span>{{ createLabel }}</span>
          </div>

          <div v-for="option in filteredOptions" :key="option[trackBy]" :class="[
            'option-item',
            {
              selected: String(option[trackBy]) === String(modelValue),
            },
          ]" @click="selectOption(option[trackBy])">
            {{ option[labelBy] }}
          </div>

          <div v-if="filteredOptions.length === 0 && searchTerm" class="no-results">
            <p>No se encontraron resultados para "{{ searchTerm }}".</p>
          </div>
        </div>
      </teleport>
    </div>

    <p v-if="error" class="error-message">{{ error }}</p>

    <BaseModal :show="showCreateModal" :title="`Crear Nuevo ${createLabel}`" @close="showCreateModal = false">
      <form :id="formId" @submit.prevent="handleCreation">
        <div v-for="(value, key) in createFields" :key="key">
          <BaseInput :label="key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')" type="text"
            v-model="createForm[key]" :error="createErrors[key] ? createErrors[key][0] : null" required />
        </div>
      </form>

      <template #footer>
        <div class="modal-footer">
          <button type="button" class="btn btn-cancel" @click="showCreateModal = false">Cancelar</button>
          <button type="submit" class="btn btn-save" :disabled="isCreating" :form="formId">
            <FontAwesomeIcon v-if="isCreating" icon="fa-solid fa-spinner" spin />
            {{ isCreating ? 'Creando...' : 'Guardar' }}
          </button>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
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
  transition: border-color 0.2s, box-shadow 0.2s;
  cursor: pointer;
  padding: 0 12px;
}

.input-wrapper.open {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
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

.search-input:focus {
  outline: none;
}

.dropdown-icon {
  color: #555;
  transition: transform 0.2s;
}

/* Dropdown Flotante */
.dropdown-options {
  position: absolute;
  /* Teleport maneja las coordenadas absolutas relativas al body */
  background-color: #2b2f36;
  /* Color sólido */
  border: 1px solid var(--color-primary);
  border-radius: 6px;
  z-index: 9999;
  /* Z-index manejable */
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  margin-top: 5px;
}

.option-item {
  padding: 12px 15px;
  cursor: pointer;
  color: var(--color-text-light);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.option-item:hover {
  background-color: #3a3f47;
}

.option-item.selected {
  background-color: var(--color-primary);
  color: #111;
  font-weight: bold;
}

.no-results {
  padding: 15px;
  color: #999;
  text-align: center;
  font-style: italic;
}

/* Botón Crear al principio */
.create-quick-add {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  color: var(--color-success);
  font-weight: bold;
  background-color: rgba(14, 203, 129, 0.1);
  transition: background-color 0.2s;
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(5px);
  /* Efecto moderno */
}

.create-quick-add:hover {
  background-color: rgba(14, 203, 129, 0.2);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 15px;
  gap: 10px;
}

.btn-save {
  padding: 10px 20px;
  background-color: var(--color-success);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}

.btn-cancel {
  padding: 10px 20px;
  background: transparent;
  border: 1px solid #666;
  color: #ccc;
  border-radius: 6px;
  cursor: pointer;
}
</style>