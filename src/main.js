import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router' // Importamos el router (aún no creado)

// --- Estilos y Plugins ---
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import 'vue-select/dist/vue-select.css'
import '@/assets/css/global.css'

// --- Font Awesome ---
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { fas } from '@fortawesome/free-solid-svg-icons'

library.add(fas)

const app = createApp(App)

// Registros
app.component('FontAwesomeIcon', FontAwesomeIcon)
app.use(createPinia())
app.use(router)
app.use(Toast, {
  transition: 'Vue-Toastification__bounce',
  maxToasts: 5,
  newestOnTop: true,
})

app.mount('#app')

// Inicializar autenticación después de montar Pinia
import { useAuthStore } from './stores/auth'
const authStore = useAuthStore()
authStore.checkAuth()
