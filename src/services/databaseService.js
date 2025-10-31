// src/services/databaseService.js

import api from './api';



export default {
  /**
   * Obtiene una lista paginada de clientes.
   * @param {object} params - Parámetros de consulta (page, per_page, search, status)
   */
  getClients(params) {
    return api.get('/reports/clients', { params });
  },

  /**
   * Obtiene una lista paginada de proveedores.
   * @param {object} params - Parámetros de consulta
   */
  getProviders(params) {
    return api.get('/reports/providers', { params });
  },

  /**
   * Obtiene una lista paginada de corredores.
   * @param {object} params - Parámetros de consulta
   */
  getBrokers(params) {
    return api.get('/reports/brokers', { params });
  },

  /**
   * Obtiene una lista paginada de administradores.
   * @param {object} params - Parámetros de consulta
   */
  getAdmins(params) {
    return api.get('/reports/admins', { params });
  },

  /**
   * Obtiene una lista paginada del historial de solicitudes.
   * @param {object} params - Parámetros de consulta
   */
  getRequests(params) {
    return api.get('/reports/requests', { params });
  },
};