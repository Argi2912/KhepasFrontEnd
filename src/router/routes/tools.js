import { RouterView } from 'vue-router'

export default [
  {
    path: '/tools',
    component: RouterView,
    meta: {
      requiresAuth: true,
      icon: 'fa-solid fa-toolbox',
      label: 'Herramientas',
    },
    children: [
      {
        path: 'calculator',
        name: 'p2p_calculator',
        component: () => import('@/views/tools/P2PCalculator.vue'),
        meta: {
          label: 'Calculadora P2P',
          icon: 'fa-solid fa-calculator',
        },
      },
      {
        path: 'paypal',
        name: 'paypal_calculator',
        component: () => import('@/views/tools/PayPalCalculator.vue'),
        meta: {
          label: 'Calculadora PayPal',
          icon: 'fa-brands fa-paypal',
        },
      },
    ],
  },
]
