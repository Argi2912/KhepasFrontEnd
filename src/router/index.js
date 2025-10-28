import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import Layout from '../layout/AppLayout.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: {
        isGuest: true,
      },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: {
        isGuest: true,
      },
    },
    {
      component: Layout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '/dashboard',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
        },
        {
          path: '/users',
          name: 'users',
          component: () => import('../views/UsersView.vue'),
        },
        {
          path: '/form',
          name: 'form',
          component: () => import('../views/FormularioView.vue'),
        },
        {
          path: '/Roles',
          name: 'roles',
          component: () => import('../views/RolesView.vue'),
        },
        {
          path: '/Request',
          name: 'Request',
          component: () => import('../views/RequestView.vue'),
        },
         {
          path: '/currencies',
          name: 'currencies',
          component: () => import('../views/currenciesView.vue'),
        },
         {
          path: '/exchange',
          name: 'exchange',
          component: () => import('../views/exchangeView.vue'),
        },
      ],
    },
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isLoggedIn = authStore.isLoggedIn

  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ name: 'login' })
  } else if (to.meta.isGuest && isLoggedIn) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
