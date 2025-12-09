<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({ isOpen: Boolean })
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Grupos abiertos
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

// MENÚ 100% AUTOMÁTICO
const menuItems = computed(() => {
  const items = []

  // SuperAdmin → todo lo de /superadmin
  if (authStore.isSuperAdmin) {
    router
      .getRoutes()
      .filter((r) => r.path.startsWith('/superadmin') && r.meta?.label && !r.meta?.hidden)
      .sort((a, b) => a.path.localeCompare(b.path))
      .forEach((r) =>
        items.push({ type: 'item', name: r.name, label: r.meta.label, icon: r.meta.icon }),
      )
    return items
  }

  // Tenant: todas las rutas con label + icon + no ocultas
  const visibleRoutes = router.getRoutes().filter(
    (r) =>
      r.meta?.label &&
      r.meta?.icon &&
      !r.meta?.hidden &&
      !r.meta?.hiddenInMenu && // ← ESTA LÍNEA NUEVA
      r.path !== '/' &&
      !r.path.includes('/:'),
  )

  // Orden preferido
  const order = [
    '/dashboard',
    '/reports',
    '/users',
    '/clients',
    '/providers',
    '/brokers',
    '/admi-platforms',
    '/financial-config',
    '/transactions',

  ]
  visibleRoutes.sort((a, b) => {
    const ia = order.indexOf(a.path)
    const ib = order.indexOf(b.path)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })

  visibleRoutes.forEach((route) => {
    if (route.meta.permission && !authStore.can(route.meta.permission)) return

    if (route.children?.length) {
      const visibleChildren = route.children.filter(
        (c) =>
          c.meta?.label &&
          !c.meta?.hidden &&
          (!c.meta.permission || authStore.can(c.meta.permission)),
      )
      if (visibleChildren.length > 0) {
        items.push({
          type: 'group',
          path: route.path,
          label: route.meta.label,
          icon: route.meta.icon,
          children: visibleChildren.map((c) => ({ name: c.name, label: c.meta.label })),
        })
      }
    } else if (route.name) {
      items.push({
        type: 'item',
        name: route.name,
        label: route.meta.label,
        icon: route.meta.icon,
      })
    }
  })

  return items
})
</script>

<template>
  <aside :class="['sidebar', { 'is-closed': !isOpen }]">
    <div class="logo-section">
      <span v-if="isOpen" class="logo-text">K E P H A S</span>
      <FontAwesomeIcon v-else icon="fa-solid fa-bolt" class="logo-icon-closed" />
    </div>

    <nav class="menu">
      <template v-for="item in menuItems" :key="item.path || item.name">
        <!-- GRUPO (Dropdown) -->
        <div v-if="item.type === 'group'" class="menu-group" :class="{ active: route.path.startsWith(item.path) }">
          <div class="menu-item menu-parent" @click="toggleGroup(item.path)">
            <FontAwesomeIcon :icon="item.icon" class="menu-icon" />
            <span v-if="isOpen" class="menu-label">{{ item.label }}</span>
            <FontAwesomeIcon v-if="isOpen" :icon="openGroups.has(item.path) ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'
              " class="chevron" />
          </div>

          <Transition name="slide-fade">
            <div v-if="isOpen && openGroups.has(item.path)" class="submenu">
              <router-link v-for="child in item.children" :key="child.name" :to="{ name: child.name }"
                class="menu-sub-item" active-class="sub-active">
                {{ child.label }}
              </router-link>
            </div>
          </Transition>
        </div>

        <!-- ITEM SIMPLE -->
        <router-link v-else :to="{ name: item.name }" class="menu-item" active-class="active">
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

<!-- Tu <style scoped> se mantiene exactamente igual -->
<style scoped>
/* Las etiquetas <style> se mantienen igual */

/* --- VARIABLES DE COLOR (Tema Oscuro Unificado) --- */
:root {
  /* Fondo principal del sidebar y secundario */
  --color-dark-bg: #1f2937;
  --color-secondary: #1f2937;
  /* Amarillo Kephas (Solo para Logo y Acentos de texto) */
  --color-primary: #fbbf24;
  /* Gris Oscuro para Hover y Fondo Activo (Elimina el amarillo) */
  --color-active-bg: #374151;
  --color-hover: #374151;
  /* Texto claro */
  --color-text-light: #e5e7eb;
  --color-border: #374151;
  /* Fondo más oscuro para el submenú */
  --color-dropdown-bg: #111827;
}

.sidebar {
  width: 280px;
  background-color: var(--color-secondary);
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  padding: 0;
  transition: width 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.is-closed {
  width: 80px;
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
  transition:
    background-color 0.2s,
    opacity 0.2s;
}

.menu-item:hover {
  background-color: var(--color-hover);
  opacity: 1;
}

/* ESTILO ACTIVO (Ruta Individual): Fondo gris oscuro, texto amarillo */
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

.is-closed .menu-label {
  display: none;
}

.is-closed .menu-icon {
  margin-right: 0;
}

.is-closed .menu-item {
  justify-content: center;
  padding: 12px 0;
}

.menu-group {
  margin-bottom: 10px;
}

/* Estilo para el elemento padre del dropdown */
.menu-parent {
  cursor: pointer;
  opacity: 0.9;
  color: var(--color-text-light);
  padding-left: 0;
  margin-bottom: 5px;
  font-weight: bold;
}

.menu-parent:hover {
  background-color: var(--color-hover);
}

/* Estilo para el padre cuando una de sus rutas hijas está activa */
.menu-group.active .menu-parent {
  background: var(--color-active-bg);
  /* Mismo fondo gris oscuro */
  color: var(--color-primary);
  /* Texto amarillo como acento */
  border-radius: 8px;
}

.chevron {
  margin-left: auto;
  font-size: 0.8rem;
  opacity: 0.6;
}

/* Submenú: Fondo más oscuro para destacarse */
.submenu {
  /* Animación de apertura y cierre */
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

/* Estilo para el elemento hijo activo/hover */
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
}

.tenant-name {
  font-size: 0.85rem;
  color: #aaa;
}

/* Transición para el dropdown */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease-out;
  overflow: hidden;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

/* Solo para controlar la altura máxima durante la transición */
.slide-fade-enter-to,
.slide-fade-leave-from {
  max-height: 500px;
  /* Asegura que la altura máxima sea suficiente */
}
</style>
