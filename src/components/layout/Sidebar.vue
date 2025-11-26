<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({
  isOpen: Boolean,
})

const authStore = useAuthStore()
const router = useRouter()

// Lógica de menú basada en las rutas
const menuItems = computed(() => {
  return (
    router.options.routes
      // Filtramos rutas de nivel superior que tienen iconos y etiquetas (el menú principal)
      .filter((route) => route.meta?.icon && route.meta?.label)
      .map((route) => {
        // Verificación del permiso de la ruta padre
        const canViewParent = !route.meta.permission || authStore.can(route.meta.permission)

        // Procesar rutas hijas (submenús)
        const subItems = route.children
          ? route.children
              .filter(
                (child) =>
                  // Ocultamos rutas con meta.hidden (ej. formularios create/edit)
                  !child.meta?.hidden &&
                  // 🚨 Filtramos rutas hijas por su permiso específico
                  (!child.meta.permission || authStore.can(child.meta.permission)),
              )
              .map((child) => ({
                name: child.name,
                label: child.meta.label,
              }))
          : []

        return {
          ...route.meta,
          name: route.name,
          path: route.path,
          // Si el padre no tiene permiso, aún puede ser visible si tiene hijos visibles
          canView: canViewParent,
          children: subItems,
        }
      })
      // 🚨 FILTRO FINAL CORREGIDO: Mostrar solo si tiene permiso de padre O si tiene sub-ítems visibles
      .filter((item) => item.canView || (item.children && item.children.length > 0))
  )
})
</script>

<template>
  <aside :class="['sidebar', { 'is-closed': !isOpen }]">
    <div class="logo-section">
      <span v-if="isOpen" class="logo-text">K E P H A S</span>
      <FontAwesomeIcon v-else icon="fa-solid fa-bolt" class="logo-icon-closed" />
    </div>

    <nav class="menu">
      <template v-for="item in menuItems" :key="item.path">
        <router-link
          :to="{ name: item.name }"
          class="menu-item"
          active-class="active"
          v-if="!item.children || item.children.length === 0"
        >
          <FontAwesomeIcon :icon="item.icon" class="menu-icon" />
          <span v-if="isOpen" class="menu-label">{{ item.label }}</span>
        </router-link>

        <div v-else class="menu-group">
          <div class="menu-item menu-parent">
            <FontAwesomeIcon :icon="item.icon" class="menu-icon" />
            <span v-if="isOpen" class="menu-label">{{ item.label }}</span>
          </div>

          <div v-if="isOpen" class="submenu">
            <router-link
              v-for="sub in item.children"
              :key="sub.name"
              :to="{ name: sub.name }"
              class="menu-sub-item"
              active-class="sub-active"
            >
              {{ sub.label }}
            </router-link>
          </div>
        </div>
      </template>
    </nav>

    <div class="user-footer" v-if="isOpen">
      <span class="tenant-name"
        >Tenant: {{ authStore.authUser?.tenant?.name || 'SuperAdmin' }}</span
      >
    </div>
  </aside>
</template>

<style scoped>
/* Sidebar Base */
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

/* Logo Section */
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

/* Menu Navigation */
.menu {
  padding: 10px 15px;
  flex-grow: 1;
  overflow-y: auto;
}

/* Item Base */
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

.active {
  background-color: var(--color-primary);
  color: var(--color-secondary) !important;
  opacity: 1;
  font-weight: 600;
}

.menu-icon {
  min-width: 30px;
  font-size: 1.1rem;
  text-align: center;
  margin-right: 15px;
}

/* Menu Colapsado */
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

/* Submenu/Group Styles */
.menu-group {
  margin-bottom: 10px;
}
.menu-parent {
  cursor: default;
  opacity: 0.9;
  color: var(--color-primary);
  padding-left: 0;
  margin-bottom: 5px;
  font-weight: bold;
}
.submenu {
  display: flex;
  flex-direction: column;
  padding-left: 45px;
  margin-top: -5px;
}
.menu-sub-item {
  text-decoration: none;
  color: var(--color-text-light);
  padding: 5px 0;
  font-size: 0.9rem;
  opacity: 0.7;
}
.menu-sub-item:hover,
.sub-active {
  opacity: 1;
  color: var(--color-primary);
}

/* Footer Section */
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
</style>
