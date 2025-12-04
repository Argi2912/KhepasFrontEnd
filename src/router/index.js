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
        permission: 'view_dashboard',
      },
    },

    // =========================================================================
    // REPORTES FINANCIEROS - AHORA SÍ FUNCIONA!
    // =========================================================================
    {
      path: '/reports',
      component: () => import('@/views/reports/ReportsLayout.vue'), // ← CORREGIDO
      meta: {
        requiresAuth: true,
        icon: 'fa-solid fa-chart-pie',
        label: 'Reportes Financieros',
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
      ],
    },

    // =========================================================================
    // GESTIÓN SIMPLE
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
    // CONFIGURACIÓN FINANCIERA
    // =========================================================================
    {
      path: '/financial-config',
      component: () => import('@/views/finance/FinancialConfigLayout.vue'), // ← Crea este archivo (abajo te lo doy)
      meta: { requiresAuth: true, icon: 'fa-solid fa-gear', label: 'Configuración Financiera' },
      children: [
        { path: '', redirect: { name: 'accounts_list' } },
        {
          path: 'accounts',
          name: 'accounts_list',
          component: () => import('@/views/accounts/AccountList.vue'),
          meta: { label: 'Cuentas Bancarias', permission: 'manage_accounts', hiddenInMenu: true },
        },
        {
          path: 'currencies',
          name: 'currencies_list',
          component: () => import('@/views/currencies/CurrencyListView.vue'),
          meta: { label: 'Divisas', permission: 'manage_currencies', hiddenInMenu: true },
        },
      ],
    },

    // =========================================================================
    // OPERACIONES - AHORA SÍ FUNCIONA!
    // =========================================================================
    {
      path: '/transactions',
      component: () => import('@/views/transactions/TransactionsLayout.vue'), // ← Crea este archivo
      meta: { requiresAuth: true, icon: 'fa-solid fa-briefcase', label: 'Operaciones' },
      children: [
        { path: '', redirect: { name: 'transaction_exchange_list' } },
        {
          path: 'exchanges',
          name: 'transaction_exchange_list',
          component: () => import('@/views/transactions/CurrencyExchangeListView.vue'),
          meta: {
            label: 'Operaciones Divisas',
            permission: 'manage_exchanges',
            hiddenInMenu: true,
          },
        },
        {
          path: 'exchanges/create',
          name: 'transaction_exchange_create',
          component: () => import('@/views/transactions/CurrencyExchangeForm.vue'),
          meta: { hidden: true },
        },
        {
          path: 'exchanges/:id',
          name: 'transaction_exchange_show',
          component: () => import('@/views/transactions/CurrencyExchangeDetailView.vue'),
          meta: { hidden: true },
        },
        {
          path: 'internal',
          name: 'transaction_internal_list',
          component: () => import('@/views/transactions/InternalTransactionListView.vue'),
          meta: {
            label: 'Caja y Gastos',
            permission: 'manage_internal_transactions',
            hiddenInMenu: true,
          },
        },
        {
          path: 'internal/create',
          name: 'transaction_internal_create',
          component: () => import('@/views/transactions/InternalTransactionForm.vue'),
          meta: { hidden: true },
        },
        {
          path: 'ledger',
          name: 'transaction_ledger',
          component: () => import('@/views/finance/LedgerDashboard.vue'),
          meta: {
            label: 'Cuentas por Pagar/Cobrar',
            permission: 'manage_internal_transactions',
            hiddenInMenu: true,
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
    notify.error(`Acceso denegado: requiere permiso "${to.meta.permission}"`)
    return from.name
      ? next(false)
      : next({ name: isSuperAdmin ? 'superadmin_dashboard' : 'dashboard' })
  }
  next()
})

export default router
