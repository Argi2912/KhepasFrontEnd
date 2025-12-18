import api from './api';

export const InvestorService = {
    // Obtener la lista para el reporte (con cálculos de interés)
    getReport() {
        return api.get('/statistics/investors');
    },

    // Obtener todos los inversionistas (CRUD estándar)
    getAll() {
        return api.get('/investors');
    },

    // Agregar saldo manual si es necesario
    addBalance(id, data) {
        return api.post(`/investors/${id}/balance`, data);
    }
};