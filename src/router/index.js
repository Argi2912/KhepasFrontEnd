import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import HomeView from '../views/HomeView.vue'
import AuthenticatedLayout from '../views/AuthenticatedLayout.vue'
import DashboardPage from '../views/DashboardView.vue'
import UsersPage from '../views/UsersView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
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
      path: '/',
      component: AuthenticatedLayout, // Usamos el layout para rutas autenticadas
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardPage,
        },
        {
          path: 'users',
          name: 'users',
          component: UsersPage,
        },
        // Redirigir a dashboard si se accede a '/' después de iniciar sesión
        {
          path: '',
          redirect: '/dashboard',
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
