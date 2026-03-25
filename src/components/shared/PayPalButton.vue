<script setup>
import { onMounted, ref } from 'vue'
import notify from '@/services/notify'

const props = defineProps({
  amount: {
    type: [String, Number],
    required: true
  },
  planId: {
    type: String,
    required: true
  },
  tenantId: {
    type: [String, Number],
    default: null
  },
  description: {
    type: String,
    default: 'Suscripción TuConpay'
  }
})

const emit = defineEmits(['success', 'error', 'cancel'])
const paypalContainer = ref(null)
const isLoaded = ref(false)

onMounted(() => {
  renderPayPalButtons()
})

const renderPayPalButtons = () => {
  if (!window.paypal) {
    console.error('PayPal SDK no cargado. Verifica index.html o la conexión.')
    notify.error('Error al cargar la pasarela de pago.')
    return
  }

  window.paypal.Buttons({
    style: {
      layout: 'vertical',
      color: 'gold',
      shape: 'rect',
      label: 'pay'
    },
    createOrder: (_, actions) => {
      // Aquí llamamos al backend para crear la orden
      // Asumimos un endpoint POST /api/subscription/paypal/create-order
      // Si no existe, podemos usar actions.order.create como fallback temporal para sandbox
      return actions.order.create({
        purchase_units: [{
          description: props.description,
          amount: {
            currency_code: 'USD',
            value: props.amount
          }
        }]
      })
    },
    onApprove: async (_, actions) => {
      try {
        // Capturar la orden
        const details = await actions.order.capture()
        emit('success', details)
      } catch (error) {
        console.error('Error en captura:', error)
        notify.error('Hubo un problema al procesar el pago.')
        emit('error', error)
      }
    },
    onCancel: () => {
      emit('cancel')
    },
    onError: (err) => {
      console.error('PayPal Error:', err)
      emit('error', err)
    }
  }).render(paypalContainer.value)
  
  isLoaded.value = true
}
</script>

<template>
  <div class="paypal-button-wrapper">
    <div v-show="!isLoaded" class="flex justify-center p-4">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
    </div>
    <div ref="paypalContainer"></div>
  </div>
</template>

<style scoped>
.paypal-button-wrapper {
  width: 100%;
  min-height: 150px;
}
</style>
