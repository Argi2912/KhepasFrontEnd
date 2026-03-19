import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router' // Importamos el router (aún no creado)

// --- Estilos y Plugins ---
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import 'vue-select/dist/vue-select.css'
import '@/assets/css/global.css'
import './assets/css/responsive.css'

// --- Font Awesome (Selective Imports for Memory Optimization) ---
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { 
  faGaugeHigh, faChartPie, faTableCells, faUserGear, faUserTie, 
  faUsers, faTruckMoving, faHandshakeAngle, faServer, faGear, 
  faBriefcase, faBolt, faPlus, faPen, faTrash, faSave, 
  faCircleNotch, faChevronRight, faChevronLeft, faChevronUp, 
  faChevronDown, faSearch, faUser, faKey, faWallet, 
  faBank, faExchangeAlt, faArrowRight, faArrowLeft, faCheck, 
  faTimes, faEye, faEyeSlash, faSignOutAlt, faChartLine, 
  faHistory, faCog, faInfoCircle, faExclamationTriangle, faAward, 
  faUniversity, faPiggyBank, faFileInvoiceDollar, faPowerOff, 
  faIdCard, faUserSecret, faUsersGear, faHandHoldingDollar, 
  faMoneyBillTransfer, faBuildingColumns, faCalculator, 
  faCalendarCheck, faFileContract, faShieldHalved, faDatabase, 
  faCloudArrowDown 
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp, faTelegram } from '@fortawesome/free-brands-svg-icons'

library.add(
  faGaugeHigh, faChartPie, faTableCells, faUserGear, faUserTie, 
  faUsers, faTruckMoving, faHandshakeAngle, faServer, faGear, 
  faBriefcase, faBolt, faPlus, faPen, faTrash, faSave, 
  faCircleNotch, faChevronRight, faChevronLeft, faChevronUp, 
  faChevronDown, faSearch, faUser, faKey, faWallet, 
  faBank, faExchangeAlt, faArrowRight, faArrowLeft, faCheck, 
  faTimes, faEye, faEyeSlash, faSignOutAlt, faChartLine, 
  faHistory, faCog, faInfoCircle, faExclamationTriangle, faAward, 
  faUniversity, faPiggyBank, faFileInvoiceDollar, faPowerOff, 
  faIdCard, faUserSecret, faUsersGear, faHandHoldingDollar, 
  faMoneyBillTransfer, faBuildingColumns, faCalculator, 
  faCalendarCheck, faFileContract, faShieldHalved, faDatabase, 
  faCloudArrowDown,
  faWhatsapp, faTelegram
)

const app = createApp(App)

// Registros}
app.directive('click-outside', {
  mounted(el, binding) {
    el.__ClickOutsideHandler__ = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.body.addEventListener('click', el.__ClickOutsideHandler__)
  },
  unmounted(el) {
    document.body.removeEventListener('click', el.__ClickOutsideHandler__)
  },
})
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
