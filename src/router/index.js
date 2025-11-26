import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import notify from '@/services/notify'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // =========================================================================
    // 0. ÁREA SUPERADMIN (Gestión Global)
    // =========================================================================
    {
      path: '/superadmin',
      name: 'superadmin_dashboard',
      component: () => import('@/views/superadmin/TenantDashboard.vue'),
      meta: {
        requiresAuth: true,
        icon: 'fa-solid fa-earth-americas',
        label: 'Gestión de Tenants',
        permission: 'manage_tenants',
      },
    },
    {
      path: '/superadmin/logs',
      name: 'superadmin_logs',
      component: () => import('@/views/superadmin/SystemAuditLogs.vue'),
      meta: {
        requiresAuth: true,
        icon: 'fa-solid fa-list-check',
        label: 'Auditoría Global',
        permission: 'manage_tenants',
      },
    },

    // =========================================================================
    // 1. RUTAS PÚBLICAS
    // =========================================================================
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      meta: { layout: 'AuthLayout', requiresAuth: false },
    },

    // =========================================================================
    // 2. RUTA RAÍZ (Controlador de Tráfico)
    // =========================================================================
    {
      path: '/',
      name: 'root',
      meta: { requiresAuth: true },
      // No usamos 'redirect' aquí. El guardia beforeEach decide a dónde ir.
    },

    // =========================================================================
    // 3. ÁREA TENANT (Operativa del Negocio)
    // =========================================================================

    // --- Dashboard Principal ---
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
      path: '/reports',
      name: 'financial_reports',
      component: () => import('@/views/reports/FinancialReportsView.vue'),
      meta: {
        requiresAuth: true,
        permission: 'manage_internal_transactions', // Asegúrate de que este permiso exista en tu BD o usa 'view_dashboard'
        icon: 'fa-solid fa-chart-pie',
        label: 'Reportes',
      },
    },

    // --- Gestión de Usuarios y Seguridad ---
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

    // --- Catálogos del Sistema ---
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
        permission: 'manage_users', // O manage_exchanges, según prefieras
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
        label: 'Plataformas',
      },
    },

    // --- Configuración Financiera ---
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

    // --- MÓDULO OPERATIVO ---

    // A. Home de Transacciones (Opcional, si usas TransactionHomeView)
    {
      path: '/transactions',
      name: 'transactions_home',
      component: () => import('@/views/transactions/TransactionHomeView.vue'),
      meta: {
        requiresAuth: true,
        permission: 'view_dashboard', // El Admin Tenant tiene este permiso
        // 🚨 AGREGAMOS ESTO PARA QUE APAREZCA EN EL MENÚ 🚨
        icon: 'fa-solid fa-briefcase',
        label: 'Operaciones',
      },
      children: [
        // B. Operaciones de Divisas
        {
          path: '/exchanges',
          name: 'transaction_exchange_list',
          component: () => import('@/views/transactions/CurrencyExchangeListView.vue'),
          meta: {
            requiresAuth: true,
            icon: 'fa-solid fa-money-bill-transfer', // Icono del submenú
            label: 'Operaciones Divisas', // Etiqueta del submenú
            permission: 'manage_exchanges',
          },
        },
        // Rutas ocultas (Create/Show) siguen igual...
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

        // C. Caja y Gastos Internos
        {
          path: '/internal',
          name: 'transaction_internal_list',
          component: () => import('@/views/transactions/InternalTransactionListView.vue'),
          meta: {
            requiresAuth: true,
            icon: 'fa-solid fa-cash-register',
            label: 'Caja y Gastos',
            permission: 'manage_internal_transactions',
          },
        },
        {
          path: '/internal/create',
          name: 'transaction_internal_create',
          component: () => import('@/views/transactions/InternalTransactionForm.vue'),
          meta: {
            requiresAuth: true,
            label: 'Cuentas por Cobrar/Pagar',
            hidden: true,
            permission: 'manage_internal_transactions',
          },
        },

        // D. Cuentas por Pagar (Ledger)
        {
          path: '/ledger',
          name: 'transaction_ledger',
          component: () => import('@/views/finance/LedgerDashboard.vue'),
          meta: {
            requiresAuth: true,
            icon: 'fa-solid fa-file-invoice-dollar',
            label: 'Cuentas por Pagar',
            permission: 'manage_exchanges',
          },
        },
      ],
    },
  ],
})

// =============================================================================
// GUARDIA GLOBAL DE NAVEGACIÓN (LOGIC CORE)
// =============================================================================
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 1. Recuperar sesión si hay token pero no usuario (F5 Refresh)
  if (authStore.token && !authStore.user) {
    try {
      await authStore.fetchUser()
    } catch (e) {
      console.error('Sesión no válida o expirada')
      return next({ name: 'login' })
    }
  }

  const isLoggedIn = authStore.isLoggedIn
  // Detectamos Superadmin si no tiene tenant_id asociado
  const isSuperAdmin = authStore.user?.tenant_id === null

  // 2. Redirección Inteligente al intentar ir a LOGIN o RAÍZ ('/')
  if (isLoggedIn && (to.name === 'login' || to.name === 'root')) {
    // Si es Superadmin -> Panel Superadmin
    if (isSuperAdmin) {
      return next({ name: 'superadmin_dashboard' })
    }
    // Si es Usuario Tenant -> Dashboard Operativo
    return next({ name: 'dashboard' })
  }

  // 3. Bloquear rutas protegidas si no hay login
  if (to.meta.requiresAuth && !isLoggedIn) {
    return next({ name: 'login' })
  }

  // 4. VERIFICACIÓN DE PERMISOS (RBAC)
  if (to.meta.permission) {
    if (!authStore.can(to.meta.permission)) {
      // Si el usuario ya está en una ruta válida y trata de navegar a una prohibida
      if (from.name) {
        notify.error(`Acceso Denegado. Requieres: ${to.meta.permission}`)
        return next(false) // Cancela navegación
      }

      // Si entra directo por URL a una ruta prohibida, redirigir a su Home seguro
      return next({ name: isSuperAdmin ? 'superadmin_dashboard' : 'dashboard' })
    }
  }

  next()
})

export default router
