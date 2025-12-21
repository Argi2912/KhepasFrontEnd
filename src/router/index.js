// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import notify from '@/services/notify'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // =========================================================================
    // SUPERADMIN
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
    // PÚBLICAS
    // =========================================================================
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      meta: { layout: 'AuthLayout', requiresAuth: false },
    },
    { path: '/', name: 'root', meta: { requiresAuth: true } },

    // =========================================================================
    // DASHBOARD
    // =========================================================================
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/Dashboard.vue'),
      meta: {
        requiresAuth: true,
        icon: 'fa-solid fa-gauge-high',
        label: 'Dashboard',
        permission: 'view_dashboard', // Todos (Admin, Analista, Cajero) deben tener este permiso
      },
    },

    // =========================================================================
    // REPORTES FINANCIEROS (Solo Analista y Admin)
    // =========================================================================
    {
      path: '/reports',
      component: () => import('@/views/reports/ReportsLayout.vue'),
      meta: {
        requiresAuth: true,
        icon: 'fa-solid fa-chart-pie',
        label: 'Reportes Financieros',
        permission: 'view_reports', // 🔒 AQUÍ PROTEGEMOS EL MÓDULO ENTERO
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
    // GESTIÓN SIMPLE (Solo Admin / RRHH)
    // =========================================================================

    {
      path: '/users',
      name: 'users_list',
      component: () => import('@/views/users/TenantUserListView.vue'),
      meta: {
        requiresAuth: true,
        permission: 'manage_users', // 🔒 Solo Admin
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
        permission: 'manage_employees', // 🔒 DESCOMENTADO: Solo Admin/RRHH
        icon: 'fa-solid fa-user-tie',
        label: 'Gestion De Nominas',
      },
    },
    {
      path: '/clients',
      name: 'clients_list',
      component: () => import('@/views/clients/ClientList.vue'),
      meta: {
        requiresAuth: true,
        permission: 'manage_clients', // 🔒 Cajero y Admin
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
      path: '/investors',
      name: 'investors_list',
      component: () => import('@/views/investors/InvestorList.vue'),
      meta: {
        requiresAuth: true,
        permission: 'manage_investors', // 🔒 Solo Admin (Cambiado de manage_exchanges para seguridad)
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
        permission: 'manage_brokers', // 🔒 DESCOMENTADO: Solo Admin
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
        permission: 'manage_platforms', // 🔒 Solo Admin
        icon: 'fa-solid fa-server',
        label: 'Plataformas',
      },
    },

    // =========================================================================
    // CONFIGURACIÓN FINANCIERA (Solo Admin)
    // =========================================================================
    {
      path: '/financial-config',
      component: () => import('@/views/finance/FinancialConfigLayout.vue'),
      meta: {
        requiresAuth: true,
        icon: 'fa-solid fa-gear',
        label: 'Configuración Financiera',
        permission: 'manage_finance', // 🔒 AÑADIDO: Protege todo el menú para Cajeros/Analistas
      },
      children: [
        { path: '', redirect: { name: 'accounts_list' } },
        {
          path: 'accounts',
          name: 'accounts_list',
          component: () => import('@/views/accounts/AccountList.vue'),
          meta: {
            label: 'Cuentas Bancarias',
            permission: 'manage_finance', // 🔒 DESCOMENTADO
          },
        },
        {
          path: 'currencies',
          name: 'currencies_list',
          component: () => import('@/views/currencies/CurrencyListView.vue'),
          meta: {
            label: 'Divisas',
            permission: 'manage_finance', // 🔒 DESCOMENTADO
          },
        },
      ],
    },

    // =========================================================================
    // OPERACIONES (Admin y Cajero)
    // =========================================================================
    {
      path: '/transactions',
      component: () => import('@/views/transactions/TransactionsLayout.vue'),
      meta: {
        requiresAuth: true,
        icon: 'fa-solid fa-briefcase',
        label: 'Operaciones',
        // SIN PERMISO EN EL PADRE: Para que puedan entrar tanto Cajero (a Exchanges) como Admin
      },
      children: [
        { path: '', redirect: { name: 'transaction_exchange_list' } },
        {
          path: 'exchanges',
          name: 'transaction_exchange_list',
          component: () => import('@/views/transactions/CurrencyExchangeListView.vue'),
          meta: {
            label: 'Operaciones Divisas',
            permission: 'manage_exchanges', // 🔒 DESCOMENTADO: Cajero y Admin
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
        // --- CAJA INTERNA (Solo Admin) ---
        {
          path: 'internal',
          name: 'transaction_internal_list',
          component: () => import('@/views/transactions/InternalTransactionListView.vue'),
          meta: {
            label: 'Caja y Gastos',
            permission: 'manage_internal_transactions', // 🔒 DESCOMENTADO: Solo Admin
          },
        },
        {
          path: 'internal/create',
          name: 'transaction_internal_create',
          component: () => import('@/views/transactions/InternalTransactionForm.vue'),
          meta: { hiddenInMenu: true, permission: 'manage_internal_transactions' },
        },
        {
          path: 'ledger',
          name: 'transaction_ledger',
          component: () => import('@/views/finance/LedgerDashboard.vue'),
          meta: {
            label: 'Cuentas por Pagar/Cobrar',
            permission: 'manage_internal_transactions', // 🔒 DESCOMENTADO: Solo Admin
          },
        },
      ],
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
    // Si no tiene permiso, lo mandamos al dashboard o login según corresponda
    return from.name
      ? next(false)
      : next({ name: isSuperAdmin ? 'superadmin_dashboard' : 'dashboard' })
  }
  next()
})

export default router
