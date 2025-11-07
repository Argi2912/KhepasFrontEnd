// src/utils/useFormValidation.js
import { ref } from 'vue'

export function useFormValidation() {
  // Almacena los errores de validación, ej: { name: ["El campo nombre es obligatorio."] }
  const errors = ref({})

  /**
   * Procesa una respuesta de error 422 (Unprocessable Entity) de Axios.
   * @param {Object} error El objeto error de la promesa rechazada de Axios.
   * @returns {Boolean} true si se procesó un error 422, false en caso contrario.
   */
  const handleAxiosError = (error) => {
    errors.value = {} // Limpiar errores anteriores

    if (error.response && error.response.status === 422) {
      // El formato de Laravel es { campo: [mensaje1, mensaje2] }
      errors.value = error.response.data.errors
      return true
    }
    return false
  }

  /**
   * Obtiene el primer mensaje de error para un campo dado.
   * @param {string} fieldName El nombre del campo (ej: 'client_id').
   * @returns {string} El primer mensaje de error o una cadena vacía.
   */
  const getError = (fieldName) => {
    // Devuelve el primer elemento del array de errores o un string vacío.
    return errors.value[fieldName] ? errors.value[fieldName][0] : ''
  }

  /**
   * Limpia los errores para un campo específico (útil al escribir).
   * @param {string} fieldName
   */
  const clearError = (fieldName) => {
    if (errors.value[fieldName]) {
      delete errors.value[fieldName]
    }
  }

  return {
    errors,
    handleAxiosError,
    getError,
    clearError,
  }
}
