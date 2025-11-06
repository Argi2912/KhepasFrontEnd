<template>
  <div class="input-wrapper">
    <label :for="id" class="input-label">{{ label }}</label>

    <CustomInput
      :id="id"
      type="text"
      :modelValue="searchQuery"
      @input="handleSearchInput"
      :placeholder="placeholder"
      :required="required"
    />

    <div v-if="isDropdownVisible" class="autocomplete-dropdown">
      <div v-if="userStore.loading" class="dropdown-item-loading">Cargando {{ roleName }}s...</div>
      <div v-else-if="filteredUsers.length > 0">
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          class="dropdown-item"
          @click="selectUser(user)"
        >
          {{ user.first_name }} {{ user.last_name }} ({{ user.email }})
        </div>
      </div>

      <div
        v-if="!userStore.loading && filteredUsers.length === 0 && searchQuery.length >= 3"
        class="dropdown-item-create"
        @click="openCreateModal"
      >
        + Agregar nuevo {{ roleName }}...
      </div>
    </div>

    <UserModal
      :is-visible="isModalVisible"
      :user-to-edit="newUserTemplate"
      @close="closeCreateModal"
    />
  </div>
</template>

<script setup>
import { ref, watch, computed, defineProps, defineEmits } from 'vue'
import { useUserStore } from '@/stores/userStore'
import UserModal from '@/components/common/UserModal.vue'
import CustomInput from '@/components/common/CustomInput.vue'
import { useToast } from 'vue-toastification'

const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  placeholder: { type: String, default: 'Buscar por nombre o email...' },
  required: { type: Boolean, default: false },
  roleName: { type: String, required: true },
  modelValue: { type: [String, Number], default: '' },
})

// --- EMITS MODIFICADO ---
const emit = defineEmits(['update:modelValue', 'userSelected'])

const userStore = useUserStore()
const toast = useToast()
const searchQuery = ref('')
const isDropdownVisible = ref(false)
const isModalVisible = ref(false)
const debounceTimer = ref(null)

watch(
  () => props.modelValue,
  (newId) => {
    if (newId) {
      const selectedUser = userStore.users.find((u) => u.id === newId)
      if (selectedUser) {
        searchQuery.value = `${selectedUser.first_name} ${selectedUser.last_name}`
      }
    } else {
      searchQuery.value = ''
    }
  },
  { immediate: true },
)

const handleSearchInput = (event) => {
  const term = event.target.value
  searchQuery.value = term

  if (term.length < 3) {
    isDropdownVisible.value = false
    emit('update:modelValue', '')
    emit('userSelected', null) // --- AÑADIDO ---
    return
  }
  isDropdownVisible.value = true
  clearTimeout(debounceTimer.value)
  debounceTimer.value = setTimeout(() => {
    userStore.fetchUsers({ search: term, role: props.roleName, per_page: 10 })
  }, 400)
}

const filteredUsers = computed(() => {
  return userStore.users
})

const selectUser = (user) => {
  searchQuery.value = `${user.first_name} ${user.last_name} (${user.email})`
  emit('update:modelValue', user.id)
  emit('userSelected', user) // --- AÑADIDO: Emitir el objeto completo ---
  isDropdownVisible.value = false
}

const newUserTemplate = computed(() => ({
  role_name: props.roleName,
  first_name: searchQuery.value.includes('@') ? '' : searchQuery.value,
  email: searchQuery.value.includes('@') ? searchQuery.value : '',
}))

const openCreateModal = () => {
  isModalVisible.value = true
  isDropdownVisible.value = false
}

const closeCreateModal = async () => {
  isModalVisible.value = false
  if (searchQuery.value.length >= 3) {
    await userStore.fetchUsers({ search: searchQuery.value, role: props.roleName, per_page: 10 })
    const justCreatedUser = userStore.users.find(
      (u) =>
        u.email === newUserTemplate.value.email ||
        u.first_name === newUserTemplate.value.first_name,
    )
    if (justCreatedUser) {
      selectUser(justCreatedUser)
    }
  }
}
</script>

<style scoped>
/* Estilos basados en tu layout.css */
.autocomplete-dropdown {
  position: absolute;
  z-index: 100;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}
.dropdown-item,
.dropdown-item-create,
.dropdown-item-loading {
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
  border-bottom: 1px solid var(--color-bg-tertiary);
}
.dropdown-item:hover {
  background-color: var(--color-bg-tertiary);
}
.dropdown-item-create {
  color: var(--color-accent-yellow);
  font-weight: 600;
  border-top: 1px solid var(--color-border);
  border-bottom: none;
}
.dropdown-item-create:hover {
  background-color: var(--color-bg-tertiary);
}
.dropdown-item-loading {
  color: var(--color-text-secondary);
}
.input-wrapper {
  position: relative;
  margin-bottom: 0 !important;
}
:deep(.input-wrapper) {
  margin-bottom: 0 !important;
}
</style>
