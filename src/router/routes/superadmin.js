export default [
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
    path: '/superadmin/users',
    name: 'superadmin_users',
    component: () => import('@/views/superadmin/SuperadminUserList.vue'),
    meta: {
      requiresAuth: true,
      icon: 'fa-solid fa-users-gear',
      label: 'Gestión de Usuarios',
      permission: 'manage_tenants',
    },
  },
  {
    path: '/superadmin/profile',
    name: 'superadmin_profile',
    component: () => import('@/views/superadmin/SuperadminProfile.vue'),
    meta: {
      requiresAuth: true,
      icon: 'fa-solid fa-user-shield',
      label: 'Mi Perfil',
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
]
