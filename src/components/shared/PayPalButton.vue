<script setup>
import { onMounted, ref } from 'vue'
import notify from '@/services/notify'
import api from '@/services/api'

const props = defineProps({
  amount: {
    type: [String, Number],
    required: true,
  },
  planId: {
    type: String,
    required: true,
  },
  tenantId: {
    type: [String, Number],
    default: null,
  },
  description: {
    type: String,
    default: 'Suscripción TuConpay',
  },
  token: {
    type: String,
    required: false,
  },
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

  window.paypal
    .Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'pay',
      },
      createOrder: async (_, actions) => {
        try {
          const response = await api.post('/subscription/paypal/create-order', {
            plan: props.planId,
          })

          return response.data.id
        } catch (error) {
          console.error('Error creando orden en backend', error)
          notify.error('No se pudo inicializar el pago.')
          throw error
        }
      },
      onApprove: async (data) => {
        try {
          const response = await api.post(
            '/subscription/paypal/capture-order',
            {
              orderID: data.orderID,
              plan: props.planId,
            },
            {
              // Forzamos el envío del token de autorización
              headers: props.token ? { Authorization: `Bearer ${props.token}` } : {},
            },
          )

          if (response.data.status === 'success') {
            emit('success', data)
          } else {
            throw new Error(response.data.message || 'Error del servidor')
          }
        } catch (error) {
          console.error('Error capturando orden en backend:', error)
          notify.error('El pago fue aprobado, pero hubo un error al activar la cuenta.')
          emit('error', error)
        }
      },
      onCancel: () => {
        emit('cancel')
      },
      onError: (err) => {
        console.error('PayPal Error:', err)
        emit('error', err)
      },
    })
    .render(paypalContainer.value)

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
