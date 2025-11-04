import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import apiClient from '@/utils/http.js' // Importado para inicializar interceptores
import { useAuthStore } from '@/stores/authStore'

import '@/assets/css/auth.css'
import '@/assets/css/layout.css' // Estilos para el Dashboard/Layout

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Configuración de Vue-Toastification
app.use(Toast, {
  position: 'top-right',
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  hideProgressBar: true,
  icon: true,
})

// Inicialización del Estado de Autenticación
// Esto asegura que si el token existe, el usuario sea cargado antes de que el router evalúe las rutas protegidas.
router.isReady().then(() => {
  const authStore = useAuthStore()
  authStore.fetchUser()

  app.mount('#app')
})
