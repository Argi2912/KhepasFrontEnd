// src/router/index.js
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
        permission: 'manage_users', // ✅ Coincide con Seeder
        icon: 'fa-solid fa-user-gear',
        label: 'Gestión de Usuarios',
      },
    },

    // --- 4. Catálogos del Sistema (Configuración) ---
    {
      path: '/clients',
      name: 'clients_list',
      component: () => import('@/views/clients/ClientList.vue'),
      meta: {
        requiresAuth: true,
        permission: 'manage_clients', // ✅ Coincide con Seeder
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
        permission: 'manage_clients', // Usamos el mismo permiso de cartera
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
        permission: 'manage_users', // Los brokers son usuarios
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
        permission: 'manage_platforms', // ✅ Coincide con Seeder
        icon: 'fa-solid fa-server',
        label: 'Plataformas',
      },
    },

    // --- 5. Configuración Financiera (Tasas y Cuentas) ---
    {
      path: '/accounts',
      name: 'accounts_list',
      component: () => import('@/views/accounts/AccountList.vue'),
      meta: {
        requiresAuth: true,
        // Permitimos 'manage_exchanges' para que el cajero pueda ver las cuentas,
        // aunque idealmente solo 'admin_tenant' (manage_platforms) debería editarlas.
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
        permission: 'manage_exchanges', // Reemplaza a 'manage_rates' (eliminado)
        icon: 'fa-solid fa-coins',
        label: 'Divisas',
      },
    },
    {
      path: '/rates',
      name: 'rates_list',
      component: () => import('@/views/rates/ExchangeRateListView.vue'),
      meta: {
        requiresAuth: true,
        permission: 'manage_exchanges', // Reemplaza a 'manage_rates' (eliminado)
        icon: 'fa-solid fa-money-bill-trend-up',
        label: 'Tasas de Cambio',
      },
    },

    // --- 6. Módulo Operativo (Transacciones) ---
    {
      path: '/transactions',
      name: 'transactions_home',
      component: () => import('@/views/transactions/TransactionHomeView.vue'),
      meta: {
        requiresAuth: true,
        icon: 'fa-solid fa-money-bill-transfer',
        label: 'Transacciones',
        permission: 'view_dashboard', // Acceso base para ver el menú
      },
      children: [
        // A. Operaciones de Divisas
        {
          path: 'exchange/create',
          name: 'transaction_exchange_create',
          component: () => import('@/views/transactions/CurrencyExchangeForm.vue'),
          meta: {
            requiresAuth: true,
            label: 'Nueva Operación',
            hidden: true,
            permission: 'manage_exchanges', // ✅ Coincide con Seeder
          },
        },
        // B. Movimientos de Caja
        {
          path: 'internal/create',
          name: 'transaction_internal_create',
          component: () => import('@/views/transactions/InternalTransactionForm.vue'),
          meta: {
            requiresAuth: true,
            label: 'Movimiento de Caja',
            hidden: true,
            permission: 'manage_internal_transactions', // ✅ Coincide con Seeder
          },
        },
        {
          path: 'internal/list',
          name: 'transaction_internal_list',
          component: () => import('@/views/transactions/InternalTransactionListView.vue'),
          meta: { requiresAuth: true, label: 'Historial de Caja', hidden: true },
        },
        // C. Historial y Detalles
        {
          path: 'exchange/list',
          name: 'transaction_exchange_list',
          component: () => import('@/views/transactions/CurrencyExchangeListView.vue'),
          meta: {
            requiresAuth: true,
            label: 'Historial de Operaciones',
            hidden: true,
            permission: 'manage_exchanges',
          },
        },
        {
          path: 'exchange/:id',
          name: 'transaction_exchange_show',
          component: () => import('@/views/transactions/CurrencyExchangeDetailView.vue'),
          meta: {
            requiresAuth: true,
            label: 'Detalle de Transacción',
            hidden: true,
            permission: 'manage_exchanges',
          },
        },
      ],
    },
    {
      path: '/ledger',
      name: 'transaction_ledger',
      component: () => import('@/views/finance/LedgerDashboard.vue'),
      meta: { requiresAuth: true, label: 'Cuentas por Pagar/Cobrar', hidden: true },
    },
  ],
})

// --- GUARDIA DE NAVEGACIÓN ---
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 1. Recuperar usuario si hay token pero no datos (F5 Refresh)
  if (authStore.token && !authStore.user) {
    try {
      await authStore.fetchUser()
    } catch (e) {
      console.error('Sesión no válida')
    }
  }

  // 2. Si ya está logueado e intenta ir al login -> Dashboard
  if (to.name === 'login' && authStore.isLoggedIn) {
    return next({ name: 'dashboard' })
  }

  // 3. Rutas protegidas requieren login
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return next({ name: 'login' })
  }

  // 4. 🚨 VERIFICACIÓN DE PERMISOS (RBAC)
  // Esta parte faltaba en tu snippet y es vital para que funcionen los permisos
  if (to.meta.permission) {
    if (!authStore.can(to.meta.permission)) {
      notify.error(`Acceso Denegado. Requieres: ${to.meta.permission}`)
      // Si falla, redirigimos al dashboard (que es seguro)
      return next({ name: 'dashboard' })
    }
  }

  next()
})

export default router
