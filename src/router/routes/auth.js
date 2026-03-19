import LandingPage from '@/views/LandingPage.vue'

export default [
  {
    path: '/',
    name: 'landing',
    component: LandingPage,
    meta: {
      requiresAuth: false,
      layout: 'empty',
    },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue'),
    meta: { layout: 'AuthLayout', requiresAuth: false },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/Register.vue'),
    meta: { layout: 'AuthLayout', requiresAuth: false },
  },
  {
    path: '/payment-success',
    name: 'payment-success',
    component: () => import('@/views/PaymentSuccess.vue'),
    meta: {
      layout: 'AuthLayout',
      requiresAuth: false,
    },
    props: (route) => ({ tenant_id: route.query.tenant_id }),
  },
  {
    path: '/subscription-expired',
    name: 'subscription_expired',
    component: () => import('@/views/SubscriptionExpired.vue'),
    meta: {
      requiresAuth: true,
      layout: 'AuthLayout'
    },
  },
]
