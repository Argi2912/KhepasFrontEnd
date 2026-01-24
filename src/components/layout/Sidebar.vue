<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({ isOpen: Boolean })
// 1. CAMBIO: Unificamos el nombre del evento a 'toggle-sidebar'
const emit = defineEmits(['toggle-sidebar'])

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const openGroups = ref(new Set())

watch(
  () => route.path,
  (path) => {
    router.getRoutes().forEach((r) => {
      if (r.children?.length && path.startsWith(r.path) && r.path !== '/') {
        openGroups.value.add(r.path)
      }
    })
  },
  { immediate: true },
)

const toggleGroup = (path) => {
  openGroups.value.has(path) ? openGroups.value.delete(path) : openGroups.value.add(path)
}

// 2. LÓGICA: Cerrar menú al hacer clic en un enlace (solo en móvil)
const handleItemClick = () => {
  if (window.innerWidth < 768) {
    emit('toggle-sidebar')
  }
}

// MENÚ AUTOMÁTICO
// Sidebar.vue

// ... (todo lo anterior sigue igual)

// MENÚ AUTOMÁTICO
const menuItems = computed(() => {
  const items = []

  // 1. Usamos 'router.options.routes' para respetar la jerarquía (Padres e Hijos)
  // En lugar de 'router.getRoutes()' que aplana todo y causa duplicados.
  const allRoutes = router.options.routes

  if (authStore.isSuperAdmin) {
    allRoutes
      .filter((r) => r.path.startsWith('/superadmin') && r.meta?.label && !r.meta?.hidden)
      .sort((a, b) => a.path.localeCompare(b.path))
      .forEach((r) => items.push({ type: 'item', name: r.name, label: r.meta.label, icon: r.meta.icon }))
    return items
  }

  const visibleRoutes = allRoutes.filter(
    (r) => r.meta?.label && r.meta?.icon && !r.meta?.hidden && !r.meta?.hiddenInMenu && r.path !== '/' && !r.path.includes('/:'),
  )

  // Agregamos '/tools' a la lista de orden para que sepa dónde ponerlo
  const order = [
    '/dashboard',
    '/reports',
    '/users',
    '/employees',
    '/clients',
    '/providers',
    '/brokers',
    '/admi-platforms',
    '/financial-config',
    '/transactions',
    '/tools', // <--- Importante
    '/Dailyngclosing'
  ]

  visibleRoutes.sort((a, b) => {
    const ia = order.indexOf(a.path)
    const ib = order.indexOf(b.path)
    // Si no está en la lista, lo manda al final (99)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })

  visibleRoutes.forEach((route) => {
    if (route.meta?.permission && !authStore.can(route.meta.permission)) return

    // Si tiene hijos visibles, es un GRUPO
    if (route.children?.length) {
      const visibleChildren = route.children.filter((c) => c.meta?.label && !c.meta?.hidden && (!c.meta?.permission || authStore.can(c.meta.permission)))

      if (visibleChildren.length > 0) {
        items.push({
          type: 'group',
          path: route.path,
          label: route.meta.label,
          icon: route.meta.icon,
          // Mapeamos los hijos correctamente
          children: visibleChildren.map((c) => ({
            name: c.name,
            label: c.meta.label
          })),
        })
      }
    }
    // Si NO tiene hijos, es un ITEM suelto
    else if (route.name) {
      items.push({ type: 'item', name: route.name, label: route.meta.label, icon: route.meta.icon })
    }
  })
  return items
})
</script>

<template>
  <div class="sidebar-overlay" :class="{ 'show': isOpen }" @click="$emit('toggle-sidebar')"></div>

  <aside :class="['sidebar', { 'is-closed': !isOpen }]">
    <div class="logo-section">
      <span v-if="isOpen" class="logo-text">TuConpay</span>
      <FontAwesomeIcon v-else icon="fa-solid fa-bolt" class="logo-icon-closed" />
    </div>

    <nav class="menu">
      <template v-for="item in menuItems" :key="item.path || item.name">
        <div v-if="item.type === 'group'" class="menu-group" :class="{ active: route.path.startsWith(item.path) }">
          <div class="menu-item menu-parent" @click="toggleGroup(item.path)">
            <FontAwesomeIcon :icon="item.icon" class="menu-icon" />
            <span v-if="isOpen" class="menu-label">{{ item.label }}</span>
            <FontAwesomeIcon v-if="isOpen"
              :icon="openGroups.has(item.path) ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"
              class="chevron" />
          </div>

          <Transition name="slide-fade">
            <div v-if="isOpen && openGroups.has(item.path)" class="submenu">
              <router-link v-for="child in item.children" :key="child.name" :to="{ name: child.name }"
                class="menu-sub-item" active-class="sub-active" @click="handleItemClick">
                {{ child.label }}
              </router-link>
            </div>
          </Transition>
        </div>

        <router-link v-else :to="{ name: item.name }" class="menu-item" active-class="active" @click="handleItemClick">
          <FontAwesomeIcon :icon="item.icon" class="menu-icon" />
          <span v-if="isOpen" class="menu-label">{{ item.label }}</span>
        </router-link>
      </template>
    </nav>

    <div class="user-footer" v-if="isOpen">
      <span class="tenant-name">Tenant: {{ authStore.authUser?.tenant?.name || 'SuperAdmin' }}</span>
    </div>
  </aside>
</template>

<style scoped>
/* (El CSS se mantiene igual que en tu versión responsiva anterior) */
:root {
  --color-dark-bg: #1f2937;
  --color-secondary: #1f2937;
  --color-primary: #fbbf24;
  --color-active-bg: #374151;
  --color-hover: #374151;
  --color-text-light: #e5e7eb;
  --color-border: #374151;
  --color-dropdown-bg: #111827;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  backdrop-filter: blur(2px);
}

.sidebar-overlay.show {
  opacity: 1;
  visibility: visible;
}

@media (min-width: 769px) {
  .sidebar-overlay {
    display: none;
  }
}

.sidebar {
  width: 280px;
  background-color: var(--color-secondary);
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  padding: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.1);
}

.is-closed {
  width: 80px;
}

@media (max-width: 768px) {
  .sidebar {
    width: 280px;
    transform: translateX(0);
  }

  .is-closed {
    width: 280px;
    transform: translateX(-100%);
  }

  .logo-section {
    justify-content: center;
  }

  .is-closed .menu-label {
    display: block;
  }
}

.logo-section {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.logo-text {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: 2px;
}

.logo-icon-closed {
  font-size: 1.5rem;
  color: var(--color-primary);
}

.menu {
  padding: 10px 15px;
  flex-grow: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}

.menu-item {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--color-text-light);
  padding: 12px 15px;
  margin: 5px 0;
  border-radius: 6px;
  white-space: nowrap;
  opacity: 0.8;
  transition: background-color 0.2s, opacity 0.2s;
  cursor: pointer;
}

.menu-item:hover {
  background-color: var(--color-hover);
  opacity: 1;
}

.active {
  background-color: var(--color-active-bg);
  color: var(--color-primary) !important;
  opacity: 1;
  font-weight: 600;
}

.menu-icon {
  min-width: 30px;
  font-size: 1.1rem;
  text-align: center;
  margin-right: 15px;
}

@media (min-width: 769px) {

  .is-closed .menu-label,
  .is-closed .chevron,
  .is-closed .tenant-name {
    display: none;
  }

  .is-closed .menu-icon {
    margin-right: 0;
  }

  .is-closed .menu-item {
    justify-content: center;
    padding: 12px 0;
  }
}

.menu-group {
  margin-bottom: 10px;
}

.menu-parent {
  opacity: 0.9;
  margin-bottom: 5px;
  font-weight: bold;
}

.menu-group.active .menu-parent {
  background: var(--color-active-bg);
  color: var(--color-primary);
  border-radius: 8px;
}

.chevron {
  margin-left: auto;
  font-size: 0.8rem;
  opacity: 0.6;
}

.submenu {
  background-color: var(--color-dropdown-bg);
  border-radius: 0 0 8px 8px;
  padding-left: 50px;
  padding-top: 4px;
  padding-bottom: 4px;
  margin-top: 0;
  margin-bottom: 5px;
  display: flex;
  flex-direction: column;
}

.menu-sub-item {
  text-decoration: none;
  color: var(--color-text-light);
  padding: 8px 0;
  border-radius: 6px;
  padding-left: 12px;
  font-size: 0.93rem;
  transition: all 0.2s;
}

.menu-sub-item:hover,
.sub-active {
  color: var(--color-primary);
  background: var(--color-hover);
  font-weight: 600;
}

.user-footer {
  padding: 15px;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
  text-align: center;
  background: var(--color-secondary);
}

.tenant-name {
  font-size: 0.85rem;
  color: #aaa;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease-out;
  overflow: hidden;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  max-height: 0;
  opacity: 0;
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  max-height: 500px;
}
</style>