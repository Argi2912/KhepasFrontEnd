// src/router/index.js (CÓDIGO FINAL CON CARGA DINÁMICA ESTRICTA)
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import notify from '@/services/notify'

// 🚨 ELIMINAR TODAS LAS IMPORTACIONES EXPLÍCITAS DE VISTAS DE LA CABECERA.

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      meta: { layout: 'AuthLayout', requiresAuth: false },
    },
    {
      path: '/',
      redirect: { name: 'dashboard' },
      meta: { requiresAuth: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/Dashboard.vue'),
      meta: {
        requiresAuth: true,
        icon: 'fa-solid fa-gauge-high',
        label: 'Dashboard',
        permission: 'view_dashboard',
      },
    },
    {
      path: '/users',
      name: 'users_list',
      component: () => import('@/views/users/TenantUserListView.vue'), // 🚨 NUEVA RUTA
      meta: {
        requiresAuth: true,
        permission: 'manage_users', // Permiso específico para este módulo
        icon: 'fa-solid fa-user-gear',
        label: 'Gestión de Usuarios',
      },
      children: [
        // ...
      ],
    },

    // MÓDULOS DEL TENANT (Carga Dinámica Estricta)
    {
      path: '/clients',
      name: 'clients_list',
      component: () => import('@/views/clients/ClientList.vue'),
      meta: {
        requiresAuth: true,
        permission: 'manage_requests',
        icon: 'fa-solid fa-users',
        label: 'Clientes',
      },
    },
    {
      path: '/providers',
      name: 'providers_list',
      component: () => import('@/views/providers/ProviderList.vue'),
      meta: {
        requiresAuth: true,
        permission: 'manage_requests',
        icon: 'fa-solid fa-truck-moving',
        label: 'Proveedores',
      },
    },
    {
      path: '/accounts',
      name: 'accounts_list',
      component: () => import('@/views/accounts/AccountList.vue'),
      meta: {
        requiresAuth: true,
        permission: 'manage_requests',
        icon: 'fa-solid fa-wallet',
        label: 'Cuentas y Caja',
      },
    },
    {
      path: '/brokers',
      name: 'brokers_list',
      component: () => import('@/views/brokers/BrokerList.vue'),
      meta: {
        requiresAuth: true,
        permission: 'manage_requests',
        icon: 'fa-solid fa-user-tie',
        label: 'Corredores',
      },
    },
    {
      path: '/currencies',
      name: 'currencies_list',
      component: () => import('@/views/currencies/CurrencyListView.vue'), // Carga dinámica
      meta: {
        requiresAuth: true,
        permission: 'manage_rates',
        icon: 'fa-solid fa-money-bill-transfer',
        label: 'Gestión de Divisas',
      },
    },
    {
      path: '/rates',
      name: 'rates_list',
      component: () => import('@/views/rates/ExchangeRateListView.vue'),
      meta: {
        requiresAuth: true,
        permission: 'manage_rates',
        icon: 'fa-solid fa-exchange-alt',
        label: 'Tasas de Cambio',
      },
    },

    // MÓDULO DE TRANSACCIONES
    {
      path: '/transactions',
      name: 'transactions_home',
      component: () => import('@/views/transactions/TransactionHomeView.vue'),
      meta: {
        requiresAuth: true,
        permission: 'manage_requests',
        icon: 'fa-solid fa-file-invoice-dollar',
        label: 'Solicitudes',
      },
      children: [
        {
          path: 'exchange',
          name: 'transaction_exchange_create',
          component: () => import('@/views/transactions/CurrencyExchangeForm.vue'),
          meta: { requiresAuth: true, label: 'Cambio de Divisas', hidden: true },
        },
        {
          path: 'exchange/list',
          name: 'transaction_exchange_list',
          component: () => import('@/views/transactions/CurrencyExchangeListView.vue'),
          meta: { requiresAuth: true, label: 'Listado de Cambios', hidden: true },
        },
        // 🚨 NUEVA RUTA: VISTA DE DETALLE (SHOW)
        {
          path: 'exchange/:id', // Utiliza un parámetro dinámico llamado 'id'
          name: 'transaction_exchange_show', // Nombre de ruta que la lista estaba buscando
          component: () => import('@/views/transactions/CurrencyExchangeDetailView.vue'),
          meta: { requiresAuth: true, label: 'Detalle de Transacción', hidden: true },
        },
        {
          path: 'purchase',
          name: 'transaction_purchase_create',
          component: () => import('@/views/transactions/PurchaseForm.vue'),
          meta: { requiresAuth: true, label: 'Compra de Dólares', hidden: true },
        },
      ],
    },
  ],
})

// --- GUARDIA DE NAVEGACIÓN (Se mantiene la lógica estable) ---
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  if (authStore.token && !authStore.user) {
    try {
      await authStore.fetchUser()
    } catch (e) {
      /* ... */
    }
  }
  if (to.name === 'login' && authStore.isLoggedIn) {
    return next({ name: 'dashboard' })
  }
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return next({ name: 'login' })
  }
  next()
})

export default router
