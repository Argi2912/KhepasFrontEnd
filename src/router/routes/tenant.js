export default [
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
    path: '/admin-platforms',
    name: 'platforms_list',
    component: () => import('@/views/admin/PlatformList.vue'),
    meta: {
      requiresAuth: true,
      permission: 'manage_platforms',
      icon: 'fa-solid fa-server',
      label: 'Plataformas',
    },
  },
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
]
