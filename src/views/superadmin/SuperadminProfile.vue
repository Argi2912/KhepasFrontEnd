<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

// --- ESTADO ---
const profile = ref({ name: '', email: '', created_at: '' })
const isLoading = ref(false)
const showEditModal = ref(false)
const isSubmitting = ref(false)

const form = reactive({
  name: '',
  email: '',
  password: '',
})

// --- API ---
const fetchProfile = async () => {
  isLoading.value = true
  try {
    const { data } = await api.get('/superadmin/profile')
    profile.value = data
  } catch (e) {
    notify.error('Error al cargar perfil')
  } finally {
    isLoading.value = false
  }
}

const openEdit = () => {
  form.name = profile.value.name
  form.email = profile.value.email
  form.password = ''
  showEditModal.value = true
}

const saveProfile = async () => {
  isSubmitting.value = true
  try {
    const payload = { name: form.name, email: form.email }
    if (form.password) {
      payload.password = form.password
    }
    await api.put('/superadmin/profile', payload)
    notify.success('Perfil actualizado correctamente')
    showEditModal.value = false
    fetchProfile()
  } catch (e) {
    const msg = e.response?.data?.message || 'Error al actualizar perfil'
    notify.error(msg)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => fetchProfile())
</script>

<template>
  <div class="sa-container">
    <div class="page-header">
      <h1>Mi Perfil</h1>
      <button class="btn-primary" @click="openEdit">
        <FontAwesomeIcon icon="fa-solid fa-pen-to-square" /> Editar
      </button>
    </div>

    <div class="profile-card" v-if="!isLoading">
      <div class="profile-avatar">
        <FontAwesomeIcon icon="fa-solid fa-user-shield" />
      </div>
      <div class="profile-info">
        <div class="info-row">
          <span class="info-label">Nombre</span>
          <span class="info-value">{{ profile.name }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value email">{{ profile.email }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Rol</span>
          <span class="info-value"><span class="role-badge">SUPERADMIN</span></span>
        </div>
        <div class="info-row">
          <span class="info-label">Registrado</span>
          <span class="info-value">{{ new Date(profile.created_at).toLocaleDateString() }}</span>
        </div>
      </div>
    </div>
    <div v-else class="loading-state">Cargando perfil...</div>

    <!-- Modal Editar -->
    <BaseModal :show="showEditModal" title="Editar Mi Perfil" @close="showEditModal = false">
      <form @submit.prevent="saveProfile" class="modal-form">
        <BaseInput label="Nombre" v-model="form.name" icon="fa-solid fa-user" required />
        <BaseInput label="Email" type="email" v-model="form.email" icon="fa-solid fa-envelope" required />
        <h4 class="password-title">Cambiar Contraseña (Opcional)</h4>
        <BaseInput label="Nueva Contraseña" type="password" v-model="form.password" icon="fa-solid fa-lock"
          placeholder="Dejar vacío para no cambiar" />
      </form>
      <template #footer>
        <button type="button" class="btn-cancel" @click="showEditModal = false">Cancelar</button>
        <button type="submit" class="btn-save" :disabled="isSubmitting" @click="saveProfile">
          {{ isSubmitting ? 'Guardando...' : 'Guardar Cambios' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.sa-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  color: var(--color-text-light);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.page-header h1 {
  color: var(--color-primary);
  font-size: 1.8rem;
}

.profile-card {
  background: var(--color-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 30px;
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

.profile-avatar {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f0b90b 0%, #d4a000 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: #1a1a2e;
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.info-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info-label {
  font-size: 0.85rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 1.05rem;
  font-weight: 600;
  color: #fff;
}

.info-value.email {
  color: var(--color-primary);
  font-family: monospace;
}

.role-badge {
  background: rgba(240, 185, 11, 0.2);
  color: #f0b90b;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  border: 1px solid #f0b90b;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #aaa;
}

.password-title {
  margin-top: 20px;
  margin-bottom: 10px;
  font-size: 1rem;
  color: var(--color-primary);
}

.btn-primary {
  background: var(--color-primary);
  color: #000;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-primary:hover {
  background: #d4a000;
}

.btn-cancel {
  background: none;
  border: none;
  color: #aaa;
  padding: 10px 15px;
  cursor: pointer;
}

.btn-save {
  padding: 10px 20px;
  background-color: var(--color-success, #0ecb81);
  color: var(--color-secondary);
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}

.btn-save:hover:not(:disabled) {
  background-color: #0dcf92;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .profile-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .info-row {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
