// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

// Vistas
import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import DashboardView from '@/views/protected/DashboardView.vue'
import MainLayout from '@/components/layout/MainLayout.vue'

import UserListView from '@/views/protected/UserListView.vue'
import ProfileView from '@/views/protected/ProfileView.vue'
import CashListView from '@/views/protected/CashListView.vue'
import TransactionListView from '@/views/protected/TransactionListView.vue'
import CurrencyListView from '@/views/protected/CurrencyListView.vue'
import ExchangeRateListView from '@/views/protected/ExchangeRateListView.vue'

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

  // Rutas Protegidas (Layout Principal)
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

      // ==========================================================
      // SOLUCIÓN: Añadir rutas placeholder para el Sidebar
      // (Usamos DashboardView como componente temporal para todas)
      // ==========================================================
      {
        path: 'transactions',
        name: 'Transactions',
        component: TransactionListView,
      },
      {
        path: 'profile', // Ruta para editar el perfil propio
        name: 'Profile',
        component: ProfileView,
      },
      {
        path: 'users', // Módulo de Usuarios (Admin)
        name: 'Users',
        component: UserListView,
      },
      {
        path: 'cashes',
        name: 'Cashes',
        component: CashListView, // Placeholder
      },
      {
        path: '/currencies',
        name: 'CurrencyList',
        component: CurrencyListView,
      },
      {
        path: 'exchange-rates',
        name: 'ExchangeRates',
        component: ExchangeRateListView, // Placeholder
      },
      {
        path: 'stats',
        name: 'Stats',
        component: DashboardView, // Placeholder
      },
      // ==========================================================
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
  // (Asegúrate de que authStore esté inicializado si no usas pinia en el main.js)
  if (!authStore.user && authStore.isAuthenticated) {
    try {
      await authStore.fetchUser()
    } catch (e) {
      // fetchUser maneja el 401 y redirige
    }
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
