import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationsStore = defineStore('notifications', () => {
  // Usar un array para notificaciones persistentes
  const criticalAlerts = ref([])

  function addAlert(message, type = 'warning') {
    const id = Date.now() // ID único
    criticalAlerts.value.push({ id, message, type })
  }

  function removeAlert(id) {
    criticalAlerts.value = criticalAlerts.value.filter((alert) => alert.id !== id)
  }

  return { criticalAlerts, addAlert, removeAlert }
})
