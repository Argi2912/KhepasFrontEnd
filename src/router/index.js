// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import notify from '@/services/notify'

// Importación de módulos de rutas
import authRoutes from './routes/auth'
import superadminRoutes from './routes/superadmin'
import tenantRoutes from './routes/tenant'
import operationsRoutes from './routes/operations'
import toolsRoutes from './routes/tools'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...authRoutes,
    ...superadminRoutes,
    ...tenantRoutes,
    ...operationsRoutes,
    ...toolsRoutes,
  ],
})

// =============================================================================
// GUARDIA GLOBAL DE NAVEGACIÓN
// =============================================================================
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 1. Recuperar sesión si hay token pero no usuario cargado
  if (authStore.token && !authStore.user) {
    try {
      await authStore.fetchUser()
    } catch (error) {
      console.error('Error al recuperar usuario:', error)
      authStore.logout() // Logout local si falla el fetch
      return next({ name: 'login' })
    }
  }

  const isLoggedIn = authStore.isLoggedIn
  const isSuperAdmin = authStore.user?.tenant_id === null

  // 2. Definición de rutas públicas (No requieren login)
  const publicPages = ['landing', 'login', 'register', 'payment-success']
  const isPublicPage = publicPages.includes(to.name)

  // 3. Redirección si ya está logueado e intenta ir a páginas de invitados
  if (isLoggedIn && (to.name === 'login' || to.name === 'register' || to.name === 'landing')) {
    return next({ name: isSuperAdmin ? 'superadmin_dashboard' : 'dashboard' })
  }

  // --- LÓGICA DE BLOQUEO POR SUSCRIPCIÓN VENCIDA ---
  if (isLoggedIn && authStore.user?.tenant) {
    const isTenantActive = Boolean(authStore.user.tenant.is_active)

    if (!isTenantActive) {
      if (to.name !== 'subscription_expired' && to.name !== 'payment-success') {
        return next({ name: 'subscription_expired' })
      }
      return next()
    }

    if (isTenantActive && to.name === 'subscription_expired') {
      return next({ name: 'dashboard' })
    }
  }

  // 4. Protección de rutas privadas
  if (!isPublicPage && !isLoggedIn) {
    notify.info('Por favor, inicia sesión para continuar.')
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  // 5. Verificación de Permisos
  if (to.meta.permission && !authStore.can(to.meta.permission)) {
    notify.error('No tienes permiso para acceder a esta sección.')
    return next({ name: isSuperAdmin ? 'superadmin_dashboard' : 'dashboard' })
  }

  next()
})

export default router
