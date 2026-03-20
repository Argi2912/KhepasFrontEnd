<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({ isOpen: Boolean })
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

const handleItemClick = () => {
  if (window.innerWidth < 768) {
    emit('toggle-sidebar')
  }
}

const menuItems = computed(() => {
  const items = []
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

  const order = [
    '/dashboard',
    '/reports',
    '/users',
    '/employees',
    '/clients',
    '/providers',
    '/brokers',
    '/admin-platforms',
    '/financial-config',
    '/transactions',
    '/tools',
    '/daily-closing'
  ]

  visibleRoutes.sort((a, b) => {
    const ia = order.indexOf(a.path)
    const ib = order.indexOf(b.path)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })

  visibleRoutes.forEach((route) => {
    if (route.meta?.permission && !authStore.can(route.meta.permission)) return

    if (route.children?.length) {
      const visibleChildren = route.children.filter((c) => c.meta?.label && !c.meta?.hidden && (!c.meta?.permission || authStore.can(c.meta.permission)))

      if (visibleChildren.length > 0) {
        items.push({
          type: 'group',
          path: route.path,
          label: route.meta.label,
          icon: route.meta.icon,
          children: visibleChildren.map((c) => ({
            name: c.name,
            label: c.meta.label
          })),
        })
      }
    }
    else if (route.name) {
      items.push({ type: 'item', name: route.name, label: route.meta.label, icon: route.meta.icon })
    }
  })
  return items
})
</script>

<template>
  <!-- Overlay para móvil -->
  <div 
    class="fixed inset-0 bg-black/80 z-[999] transition-all duration-500 backdrop-blur-md md:hidden"
    :class="[isOpen ? 'opacity-100 visible' : 'opacity-0 invisible']"
    @click="$emit('toggle-sidebar')"
  ></div>

  <aside 
    class="fixed top-0 left-0 h-full bg-secondary z-[1000] flex flex-col shadow-[20px_0_50px_rgba(0,0,0,0.4)] transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) border-r border-white/5"
    :class="[isOpen ? 'w-[290px] translate-x-0' : 'w-0 overflow-hidden md:w-[90px] -translate-x-full md:translate-x-0']"
  >
    <!-- Logo Section Premium -->
    <div class="h-[80px] flex items-center justify-center border-b border-white/5 shrink-0 px-6 bg-secondary/30 backdrop-blur-xl relative overflow-hidden group">
      <div class="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
      
      <transition name="fade">
        <div v-if="isOpen" class="flex items-center gap-3 relative z-10 transition-all duration-500">
          <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform duration-500 p-1 overflow-hidden">
             <img src="@/assets/logo.jpg" alt="Logo" class="w-full h-full object-cover rounded-lg" />
          </div>
          <div class="flex flex-col">
            <span class="text-xl font-black text-white tracking-tighter leading-none">TuConpay<span class="text-primary">.</span></span>
            <span class="text-[0.6rem] font-bold text-white/20 uppercase tracking-[0.3em] mt-1">Ecosistema Pro</span>
          </div>
        </div>
        <div v-else class="w-11 h-11 bg-white rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-all duration-500 shadow-inner p-1 overflow-hidden">
          <img src="@/assets/logo.jpg" alt="Logo" class="w-full h-full object-cover rounded-xl" />
        </div>
      </transition>
    </div>

    <!-- Menú de Navegación v5 -->
    <nav class="p-4 grow overflow-y-auto space-y-2.5 scrollbar-none hover:scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <template v-for="item in menuItems" :key="item.path || item.name">
        <!-- Grupo con Submenú -->
        <div v-if="item.type === 'group'" class="space-y-1.5">
          <div 
            class="group flex items-center text-white/50 p-3 rounded-2xl cursor-pointer transition-all duration-500 hover:bg-white/[0.04] hover:text-white relative overflow-hidden"
            :class="{ 'bg-primary/5 !text-white shadow-[inset_0_0_20px_rgba(247,166,0,0.03)] border border-white/5': route.path.startsWith(item.path) }"
            @click="toggleGroup(item.path)"
          >
            <!-- Indicador activo sutil -->
            <div v-if="route.path.startsWith(item.path)" class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_15px_rgba(247,166,0,0.5)]"></div>

            <div class="w-10 h-10 flex items-center justify-center shrink-0 rounded-xl transition-all duration-500 group-hover:bg-primary/5 group-hover:text-primary shadow-inner"
                 :class="{ 'text-primary bg-primary/10 border border-primary/10 shadow-[0_0_15px_rgba(247,166,0,0.1)]': route.path.startsWith(item.path) }">
              <FontAwesomeIcon :icon="item.icon" class="text-lg" />
            </div>
            
            <div v-if="isOpen" class="ml-3 grow flex items-center justify-between">
              <span class="font-bold text-[0.9rem] tracking-tight">{{ item.label }}</span>
              <FontAwesomeIcon 
                :icon="openGroups.has(item.path) ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"
                class="text-[0.65rem] opacity-20 group-hover:opacity-100 transition-all duration-500" 
              />
            </div>
          </div>

          <!-- Submenú Premium -->
          <Transition name="slide-fade">
            <div v-if="isOpen && openGroups.has(item.path)" class="ml-10 py-1 space-y-1 relative border-l border-white/5">
              <router-link 
                v-for="child in item.children" 
                :key="child.name" 
                :to="{ name: child.name }"
                class="flex items-center py-2.5 px-4 text-[0.8rem] font-bold text-white/30 hover:text-white transition-all rounded-r-xl hover:bg-white/5 relative group/sub"
                active-class="!text-white !bg-gradient-to-r !from-primary/10 !to-transparent before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[2px] before:h-4 before:bg-primary shadow-sm"
                @click="handleItemClick"
              >
                <span class="opacity-40 group-hover/sub:opacity-100 transition-opacity mr-2">•</span>
                {{ child.label }}
              </router-link>
            </div>
          </Transition>
        </div>

        <!-- Item Individual Premium -->
        <router-link 
          v-else 
          :to="{ name: item.name }" 
          class="group flex items-center text-white/50 p-3 rounded-2xl transition-all duration-500 hover:bg-white/[0.04] hover:text-white relative overflow-hidden border border-transparent"
          active-class="bg-primary/5 !text-white !border-white/5 shadow-[inset_0_0_20px_rgba(247,166,0,0.03)] font-bold"
          @click="handleItemClick"
        >
          <!-- Indicador activo sutil -->
          <div v-if="route.name === item.name" class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_15px_rgba(247,166,0,0.5)]"></div>

          <div class="w-10 h-10 flex items-center justify-center shrink-0 rounded-xl transition-all duration-500 group-hover:bg-primary/5 group-hover:text-primary shadow-inner"
               :class="{ 'text-primary bg-primary/10 border border-primary/10 shadow-[0_0_15px_rgba(247,166,0,0.1)]': route.name === item.name }">
            <FontAwesomeIcon :icon="item.icon" class="text-lg" />
          </div>
          <span v-if="isOpen" class="ml-3 font-bold text-[0.9rem] tracking-tight truncate">{{ item.label }}</span>
        </router-link>
      </template>
    </nav>

    <!-- Footer de Usuario v5 (Premium Glass) -->
    <div v-if="isOpen" class="p-6 border-t border-white/5 bg-black/40 backdrop-blur-3xl shrink-0 group/footer">
      <div class="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 group-hover/footer:bg-white/[0.04] group-hover/footer:border-white/10 transition-all duration-500 shadow-2xl">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black border border-primary/10 shadow-inner group-hover/footer:scale-110 transition-transform duration-500">
          {{ authStore.authUser?.name?.charAt(0) || 'U' }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-[0.85rem] font-black text-white truncate tracking-tight leading-none mb-1">{{ authStore.authUser?.name }}</p>
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(46,204,113,0.5)]"></span>
            <p class="text-[0.6rem] text-primary/60 truncate uppercase tracking-[0.15em] font-black">
              {{ authStore.isSuperAdmin ? 'SUPER ADMIN' : authStore.authUser?.tenant?.name || 'OPERADOR' }}
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Collapsed mini footer -->
    <div v-else class="h-[80px] flex items-center justify-center border-t border-white/5 bg-black/40">
       <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 border border-white/5 hover:bg-primary/10 hover:text-primary transition-all duration-500 cursor-pointer">
          <FontAwesomeIcon icon="fa-solid fa-power-off" class="text-xs" />
       </div>
    </div>
  </aside>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 800px;
  overflow: hidden;
}
.slide-fade-enter-from, .slide-fade-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-20px);
}

/* Hide scrollbar by default */
.scrollbar-none::-webkit-scrollbar { display: none; }
.scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
</style>