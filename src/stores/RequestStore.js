import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import RequestService from '../services/RequestService';

export const useRequestStore = defineStore('requestStore', () => {
  const items = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const meta = ref(null); // para paginación u otros metadatos

  const count = computed(() => items.value.length);

  // 🔹 Maneja distintos tipos de respuesta de backend
  function extractPayload(res) {
    const payload = res?.data ?? res;
    const metadata = res?.meta ?? res?.pagination ?? null;
    return { payload, metadata };
  }

  // 🔹 Obtener lista completa
  async function fetchList(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const res = await RequestService.list(params);
      const { payload, metadata } = extractPayload(res);
      items.value = Array.isArray(payload)
        ? payload
        : payload?.data ?? [];
      meta.value = metadata;
      return items.value;
    } catch (err) {
      console.error('Error al listar solicitudes:', err);
      error.value = err;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 🔹 Obtener un elemento por ID
  async function fetchOne(id) {
    loading.value = true;
    error.value = null;
    try {
      const res = await RequestService.get(id);
      const { payload } = extractPayload(res);
      const item = payload?.data ?? payload;
      if (!item) return null;

      // Actualizar si ya existe en la lista
      const idx = items.value.findIndex((i) => i.id === item.id);
      if (idx !== -1) items.value[idx] = item;

      return item;
    } catch (err) {
      console.error('Error al obtener solicitud:', err);
      error.value = err;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 🔹 Crear nuevo registro
  async function create(payload) {
    loading.value = true;
    error.value = null;
    try {
      const res = await RequestService.create(payload);
      const { payload: created } = extractPayload(res);
      const item = created?.data ?? created;
      if (item) items.value.unshift(item);
      return item;
    } catch (err) {
      console.error('Error al crear solicitud:', err);
      error.value = err;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 🔹 Actualizar registro existente
  async function update(id, payload) {
    loading.value = true;
    error.value = null;
    try {
      const res = await RequestService.update(id, payload);
      const { payload: updated } = extractPayload(res);
      const item = updated?.data ?? updated;

      if (item) {
        const idx = items.value.findIndex((i) => i.id === item.id);
        if (idx !== -1) items.value[idx] = item;
      }
      return item;
    } catch (err) {
      console.error('Error al actualizar solicitud:', err);
      error.value = err;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 🔹 Eliminar registro
  async function remove(id) {
    loading.value = true;
    error.value = null;
    try {
      await RequestService.delete(id);
      items.value = items.value.filter((i) => i.id !== id);
      return true;
    } catch (err) {
      console.error('Error al eliminar solicitud:', err);
      error.value = err;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 🔹 Métodos utilitarios
  function setItems(newItems) {
    items.value = newItems;
  }

  function clearError() {
    error.value = null;
  }

  return {
    // Estado
    items,
    loading,
    error,
    meta,

    // Getters
    count,

    // Acciones
    fetchList,
    fetchOne,
    create,
    update,
    remove,
    setItems,
    clearError,
  };
});
