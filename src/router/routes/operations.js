export default [
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
        component: () => import('@/views/DailyClosing/DailyClosing.vue'),
        meta: {
          label: 'Cierre Diario',
        },
      },
      {
        path: 'ledger',
        name: 'transaction_ledger',
        component: () => import('@/views/finance/LedgerDashboard.vue'),
        meta: {
          label: 'Cuentas por Pagar/Cobrar',
          permission: 'manage_internal_transactions',
        },
      },
      {
        path: 'requests',
        name: 'transaction_requests_list',
        component: () => import('@/views/transactions/TransactionRequestListView.vue'),
        meta: {
          label: 'Solicitudes',
          permission: 'manage_transaction_requests',
        },
      },
      {
        path: 'requests/create',
        name: 'transaction_requests_create',
        component: () => import('@/views/transactions/TransactionRequestForm.vue'),
        meta: { hiddenInMenu: true, permission: 'manage_transaction_requests' },
      },
    ],
  },
]
