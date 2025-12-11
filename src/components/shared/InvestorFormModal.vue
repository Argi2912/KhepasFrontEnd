<script setup>
import { ref, watch } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'

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
        form.value = { ...data, is_active: data.is_active == 1 }
        title.value = 'Editar Inversionista'
      } catch (err) {
        notify.error('Error al cargar datos del inversionista')
        emit('close')
      } finally {
        loading.value = false
      }
    } else if (!id) {
      form.value = { name: '', alias: '', email: '', phone: '', is_active: true }
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
  <teleport to="body">
    <div v-if="show" class="modal-backdrop" @click.self="emit('close')">
      <div class="modal">
        <h2>{{ title }}</h2>

        <form @submit.prevent="submit">
          <div class="form-group">
            <label>Nombre Completo *</label>
            <input v-model="form.name" required type="text" />
          </div>

          <div class="form-group">
            <label>Alias (opcional)</label>
            <input v-model="form.alias" type="text" />
          </div>

          <div class="form-group">
            <label>Email</label>
            <input v-model="form.email" type="email" />
          </div>

          <div class="form-group">
            <label>Teléfono</label>
            <input v-model="form.phone" type="text" />
          </div>

          <div class="form-group checkbox">
            <label>
              <input v-model="form.is_active" type="checkbox" />
              Activo
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" @click="emit('close')" class="btn-secondary">Cancelar</button>
            <button type="submit" :disabled="loading" class="btn-primary">
              {{ loading ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--color-secondary);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

h2 {
  margin-top: 0;
  color: var(--color-primary);
}

.form-group {
  margin-bottom: 16px;
}

label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 30px;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
}

.btn-secondary {
  background: #f1f1f1;
  border: 1px solid #ccc;
}
</style>
