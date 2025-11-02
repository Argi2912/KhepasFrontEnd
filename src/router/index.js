// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import DashboardView from '@/views/protected/DashboardView.vue'
import MainLayout from '@/components/layout/MainLayout.vue'

const routes = [
  // Rutas Públicas
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
  },

  // Rutas Protegidas (Usando el Layout Principal)
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: DashboardView,
      },
      // ... Agregar otras rutas protegidas aquí
    ],
  },
  // Redirección por defecto
  { path: '/', redirect: { name: 'Dashboard' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ==========================================================
// Protección Global de Rutas
// ==========================================================
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Si hay token pero el usuario no está cargado, intentar cargarlo
  if (!authStore.user && authStore.isAuthenticated) {
    await authStore.fetchUser()
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !authStore.isAuthenticated) {
    // Requerido y no autenticado -> Login
    next({ name: 'Login' })
  } else if (!requiresAuth && authStore.isAuthenticated) {
    // Autenticado y quiere ir a Login/Register -> Dashboard
    if (to.name === 'Login' || to.name === 'Register') {
      next({ name: 'Dashboard' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
