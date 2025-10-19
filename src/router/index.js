import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import Layout from '../layout/AppLayout.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
      ],
    },

    /*
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: {
        isGuest: true,
      },
    },
    
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/:catchAll(.*)',
      name: 'notFound',
      component: () => import('../views/NotFoundView.vue'),
    }, */
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isLoggedIn = authStore.isLoggedIn

  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ name: 'login' })
  } else if (to.meta.isGuest && isLoggedIn) {
    next({ name: 'users' })
  } else {
    next()
  }
})

export default router
