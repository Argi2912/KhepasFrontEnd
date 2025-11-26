import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import notify from '@/services/notify'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // --- 1. Rutas Públicas ---
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      meta: { layout: 'AuthLayout', requiresAuth: false },
    },

    // --- 2. Dashboard (Raíz) ---
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

    // --- 3. Gestión de Usuarios y Seguridad ---
    {
      path: '/users',
      name: 'users_list',
      component: () => import('@/views/users/TenantUserListView.vue'),
      meta: {
        requiresAuth: true,
        permission: 'manage_users',
        icon: 'fa-solid fa-user-gear',
        label: 'Gestión de Usuarios',
      },
    },

    // --- 4. Catálogos del Sistema ---
    {
      path: '/clients',
      name: 'clients_list',
      component: () => import('@/views/clients/ClientList.vue'),
      meta: {
        requiresAuth: true,
        permission: 'manage_clients',
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
        permission: 'manage_clients',
        icon: 'fa-solid fa-truck-moving',
        label: 'Proveedores',
      },
    },
    {
      path: '/brokers',
      name: 'brokers_list',
      component: () => import('@/views/brokers/BrokerList.vue'),
      meta: {
        requiresAuth: true,
        permission: 'manage_users',
        icon: 'fa-solid fa-user-tie',
        label: 'Corredores',
      },
    },
    {
      path: '/admi-platforms',
      name: 'platforms_list',
      component: () => import('@/views/admi/PlatformList.vue'),
      meta: {
        requiresAuth: true,
        permission: 'manage_platforms',
        icon: 'fa-solid fa-server',
        label: 'Plataformas/Administradores',
      },
    },

    // --- 5. Configuración Financiera ---
    {
      path: '/accounts',
      name: 'accounts_list',
      component: () => import('@/views/accounts/AccountList.vue'),
      meta: {
        requiresAuth: true,
        permission: 'manage_exchanges',
        icon: 'fa-solid fa-wallet',
        label: 'Cuentas Bancarias',
      },
    },
    {
      path: '/currencies',
      name: 'currencies_list',
      component: () => import('@/views/currencies/CurrencyListView.vue'),
      meta: {
        requiresAuth: true,
        permission: 'manage_exchanges',
        icon: 'fa-solid fa-coins',
        label: 'Divisas',
      },
    },
    // --- 6. MÓDULO OPERATIVO (SEPARADO Y VISIBLE) ---

    // A. OPERACIONES DE DIVISAS
    {
      path: '/exchanges',
      name: 'transaction_exchange_list',
      component: () => import('@/views/transactions/CurrencyExchangeListView.vue'),
      meta: {
        requiresAuth: true,
        icon: 'fa-solid fa-money-bill-transfer',
        label: 'Operaciones Divisas',
        permission: 'manage_exchanges',
      },
    },
    // (Rutas hijas ocultas de Divisas)
    {
      path: '/exchanges/create',
      name: 'transaction_exchange_create',
      component: () => import('@/views/transactions/CurrencyExchangeForm.vue'),
      meta: {
        requiresAuth: true,
        label: 'Nueva Operación',
        hidden: true,
        permission: 'manage_exchanges',
      },
    },
    {
      path: '/exchanges/:id',
      name: 'transaction_exchange_show',
      component: () => import('@/views/transactions/CurrencyExchangeDetailView.vue'),
      meta: {
        requiresAuth: true,
        label: 'Detalle de Transacción',
        hidden: true,
        permission: 'manage_exchanges',
      },
    },

    // B. CAJA Y GASTOS INTERNOS
    {
      path: '/internal',
      name: 'transaction_internal_list',
      component: () => import('@/views/transactions/InternalTransactionListView.vue'),
      meta: {
        requiresAuth: true,
        icon: 'fa-solid fa-cash-register',
        label: 'Caja y Gastos',
        permission: 'view_dashboard', // Permiso básico
      },
    },
    // (Rutas hijas ocultas de Caja)
    {
      path: '/internal/create',
      name: 'transaction_internal_create',
      component: () => import('@/views/transactions/InternalTransactionForm.vue'),
      meta: {
        requiresAuth: true,
        label: 'Movimiento de Caja',
        hidden: true,
        permission: 'manage_internal_transactions',
      },
    },

    // C. CUENTAS POR PAGAR (LEDGER) - ✅ AHORA VISIBLE
    {
      path: '/ledger',
      name: 'transaction_ledger',
      component: () => import('@/views/finance/LedgerDashboard.vue'),
      meta: {
        requiresAuth: true,
        icon: 'fa-solid fa-file-invoice-dollar', // Icono añadido
        label: 'Cuentas por Pagar/Cobrar', // Etiqueta visible
        permission: 'manage_exchanges', // Usamos el mismo permiso financiero
        // hidden: false // Al no poner hidden, es visible por defecto
      },
    },
  ],
})

// --- GUARDIA DE NAVEGACIÓN ---
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (authStore.token && !authStore.user) {
    try {
      await authStore.fetchUser()
    } catch (e) {
      console.error('Sesión no válida')
    }
  }

  if (to.name === 'login' && authStore.isLoggedIn) {
    return next({ name: 'dashboard' })
  }

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return next({ name: 'login' })
  }

  if (to.meta.permission) {
    if (!authStore.can(to.meta.permission)) {
      notify.error(`Acceso Denegado. Requieres: ${to.meta.permission}`)
      return next({ name: 'dashboard' })
    }
  }

  next()
})

export default router
