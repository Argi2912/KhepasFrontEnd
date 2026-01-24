// src/router/index.js
import { createRouter, createWebHistory, RouterView } from 'vue-router' // 👈 1. IMPORTAMOS RouterView
import { useAuthStore } from '@/stores/auth'
import notify from '@/services/notify'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // =========================================================================
    // 1. SUPERADMIN
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
    // 2. PÚBLICAS
    // =========================================================================
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      meta: { layout: 'AuthLayout', requiresAuth: false },
    },
    { path: '/', name: 'root', meta: { requiresAuth: true } },

    // =========================================================================
    // 3. DASHBOARD
    // =========================================================================
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

    // =========================================================================
    // 4. REPORTES FINANCIEROS
    // =========================================================================
    {
      path: '/reports',
      component: () => import('@/views/reports/ReportsLayout.vue'),
      meta: {
        requiresAuth: true,
        icon: 'fa-solid fa-chart-pie',
        label: 'Reportes Financieros',
        permission: 'view_reports',
      },
      children: [
        { path: '', redirect: { name: 'reports.general' } },
        {
          path: 'general',
          name: 'reports.general',
          component: () => import('@/views/reports/FinancialReportsView.vue'),
          meta: { label: 'Resumen General' },
        },
        {
          path: 'clients',
          name: 'reports.clients',
          component: () => import('@/views/reports/ClientReportView.vue'),
          meta: { label: 'Por Cliente', hiddenInMenu: true },
        },
        {
          path: 'providers',
          name: 'reports.providers',
          component: () => import('@/views/reports/ProviderReportView.vue'),
          meta: { label: 'Por Proveedor', hiddenInMenu: true },
        },
        {
          path: 'platforms',
          name: 'reports.platforms',
          component: () => import('@/views/reports/PlatformReportView.vue'),
          meta: { label: 'Por Plataforma', hiddenInMenu: true },
        },
        {
          path: 'brokers',
          name: 'reports.brokers',
          component: () => import('@/views/reports/BrokerReportView.vue'),
          meta: { label: 'Por Corredor', hiddenInMenu: true },
        },
        {
          path: 'profit-matrix',
          name: 'reports.profit_matrix',
          component: () => import('@/views/reports/ProfitMatrixView.vue'),
          meta: {
            label: 'Matriz de Rentabilidad',
            icon: 'fa-solid fa-table-cells',
          },
        },
      ],
    },

    // =========================================================================
    // 5. GESTIÓN SIMPLE (Listados Directos)
    // =========================================================================
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
    {
      path: '/employees',
      name: 'employees_list',
      component: () => import('@/views/employees/EmployeeList.vue'),
      meta: {
        requiresAuth: true,
        permission: 'manage_employees',
        icon: 'fa-solid fa-user-tie',
        label: 'Gestión de Nóminas',
      },
    },
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
    // ✅ MOVIMOS INVERSIONISTAS AQUÍ ARRIBA
    {
      path: '/investors',
      name: 'investors_list',
      component: () => import('@/views/investors/InvestorList.vue'),
      meta: {
        requiresAuth: true,
        permission: 'manage_investors',
        icon: 'fa-solid fa-handshake-angle',
        label: 'Inversionistas',
      },
    },
    {
      path: '/brokers',
      name: 'brokers_list',
      component: () => import('@/views/brokers/BrokerList.vue'),
      meta: {
        requiresAuth: true,
        permission: 'manage_brokers',
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

    // =========================================================================
    // 6. CONFIGURACIÓN FINANCIERA
    // =========================================================================
    {
      path: '/financial-config',
      component: () => import('@/views/finance/FinancialConfigLayout.vue'),
      meta: {
        requiresAuth: true,
        icon: 'fa-solid fa-gear',
        label: 'Configuración Financiera',
        permission: 'manage_finance',
      },
      children: [
        { path: '', redirect: { name: 'accounts_list' } },
        {
          path: 'accounts',
          name: 'accounts_list',
          component: () => import('@/views/accounts/AccountList.vue'),
          meta: {
            label: 'Cuentas Bancarias',
            permission: 'manage_finance',
          },
        },
        {
          path: 'currencies',
          name: 'currencies_list',
          component: () => import('@/views/currencies/CurrencyListView.vue'),
          meta: {
            label: 'Divisas',
            permission: 'manage_finance',
          },
        },
      ],
    },

    // =========================================================================
    // 7. OPERACIONES
    // =========================================================================
    {
      path: '/transactions',
      component: () => import('@/views/transactions/TransactionsLayout.vue'),
      meta: {
        requiresAuth: true,
        icon: 'fa-solid fa-briefcase',
        label: 'Operaciones',
      },
      children: [
        { path: '', redirect: { name: 'transaction_exchange_list' } },
        {
          path: 'exchanges',
          name: 'transaction_exchange_list',
          component: () => import('@/views/transactions/CurrencyExchangeListView.vue'),
          meta: {
            label: 'Operaciones Divisas',
            permission: 'manage_exchanges',
          },
        },
        {
          path: 'exchanges/create',
          name: 'transaction_exchange_create',
          component: () => import('@/views/transactions/CurrencyExchangeForm.vue'),
          meta: { hiddenInMenu: true, permission: 'manage_exchanges' },
        },
        {
          path: 'exchanges/:id',
          name: 'transaction_exchange_show',
          component: () => import('@/views/transactions/CurrencyExchangeDetailView.vue'),
          meta: { hiddenInMenu: true, permission: 'manage_exchanges' },
        },
        // --- CAJA INTERNA ---
        {
          path: 'internal',
          name: 'transaction_internal_list',
          component: () => import('@/views/transactions/InternalTransactionListView.vue'),
          meta: {
            label: 'Caja y Gastos',
            permission: 'manage_internal_transactions',
          },
        },
        {
          path: 'internal/create',
          name: 'transaction_internal_create',
          component: () => import('@/views/transactions/InternalTransactionForm.vue'),
          meta: { hiddenInMenu: true, permission: 'manage_internal_transactions' },
        },
        {
          path: '/daily-closing',
          name: 'DailyClosing',
          component: () => import('../views/Daylingclosing/DailyClosing.vue'),
          meta: {
            label: 'Cierre Diario',
          },
        },
        // --- LEDGER ---
        {
          path: 'ledger',
          name: 'transaction_ledger',
          component: () => import('@/views/finance/LedgerDashboard.vue'),
          meta: {
            label: 'Cuentas por Pagar/Cobrar',
            permission: 'manage_internal_transactions',
          },
        },
      ],
    }, // 👈 AQUÍ CERRAMOS OPERACIONES CORRECTAMENTE

    // =========================================================================
    // 8. HERRAMIENTAS
    // =========================================================================
    {
      path: '/tools',
      component: RouterView,
      meta: {
        requiresAuth: true,
        icon: 'fa-solid fa-toolbox',
        label: 'Herramientas',
      },
      children: [
        // 1. Calculadora P2P
        {
          path: 'calculator',
          name: 'p2p_calculator',
          component: () => import('@/views/tools/P2PCalculator.vue'),
          meta: {
            label: 'Calculadora P2P',
            icon: 'fa-solid fa-calculator'
          }
        },
        // 2. Calculadora PayPal (NUEVA) 🔥
        {
          path: 'paypal',
          name: 'paypal_calculator',
          component: () => import('@/views/tools/PayPalCalculator.vue'),
          meta: {
            label: 'Calculadora PayPal',
            icon: 'fa-brands fa-paypal' // Asegúrate de tener el ícono de marca
          }
        }
      ]
    },

  ],
})

// GUARDIA GLOBAL
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  if (authStore.token && !authStore.user) {
    try {
      await authStore.fetchUser()
    } catch {
      authStore.logout()
      return next({ name: 'login' })
    }
  }

  const isLoggedIn = authStore.isLoggedIn
  const isSuperAdmin = authStore.user?.tenant_id === null

  if (isLoggedIn && (to.name === 'login' || to.name === 'root')) {
    return next({ name: isSuperAdmin ? 'superadmin_dashboard' : 'dashboard' })
  }
  if (to.meta.requiresAuth && !isLoggedIn) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }
  if (to.meta.permission && !authStore.can(to.meta.permission)) {
    return from.name
      ? next(false)
      : next({ name: isSuperAdmin ? 'superadmin_dashboard' : 'dashboard' })
  }
  next()
})

export default router