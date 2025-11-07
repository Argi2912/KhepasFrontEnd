// Usamos la biblioteca que instalamos: vue-toastification
import { useToast } from 'vue-toastification'

const toast = useToast()

const options = {
  position: 'top-right',
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false,
}

export default {
  success(message) {
    toast.success(message, options)
  },
  error(message) {
    toast.error(message, options)
  },
  info(message) {
    toast.info(message, options)
  },
  warning(message) {
    toast.warning(message, options)
  },
}
