// src/stores/databaseStore.js

import { defineStore } from 'pinia';
import { ref, markRaw } from 'vue'; // <--- AÑADIR markRaw
import databaseService from '../services/databaseService';

export const useDatabaseStore = defineStore('database', () => {
  // --- STATE ---
  const data = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  // --- ACTIONS ---
  async function fetchData(type, params) {
    isLoading.value = true;
    error.value = null;
    data.value = null;

    try {
      let response;
      switch (type) {
        // ... (Tu switch case es correcto) ...
        case 'clients':
          response = await databaseService.getClients(params);
          break;
        case 'providers':
          response = await databaseService.getProviders(params);
          break;
        case 'brokers':
          response = await databaseService.getBrokers(params);
          break;
        case 'admins':
          response = await databaseService.getAdmins(params);
          break;
        case 'requests':
          response = await databaseService.getRequests(params);
          break;
        default:
          throw new Error('Tipo de datos no válido');
      }
      
      // --- LÍNEA CLAVE: Usar markRaw ---
      // Asignamos la respuesta paginada, pero le decimos a Vue que no observe los datos internamente.
      data.value = markRaw(response.data); 
      
    } catch (err) {
      error.value = err.response ? err.response.data.message : err.message;
    } finally {
      isLoading.value = false;
    }
  }

  function clearData() {
    data.value = null;
    error.value = null;
  }

  return {
    data,
    isLoading,
    error,
    fetchData,
    clearData,
  };
});