<script setup>
import Sidebar from '@/components/layout/Sidebar.vue'
import Navbar from '@/components/layout/Navbar.vue'
import { ref, watch } from 'vue'

const isSidebarOpen = ref(localStorage.getItem('sidebar_open') !== 'false')

watch(isSidebarOpen, (val) => {
  localStorage.setItem('sidebar_open', val.toString())
})
</script>

<template>
  <div class="flex min-h-screen bg-background text-white">
    <Sidebar :is-open="isSidebarOpen" @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />

    <main 
      class="flex-grow flex flex-col transition-[padding-left] duration-300 ease-in-out md:pl-[280px]"
      :class="{ 'md:!pl-[85px] !pl-0': !isSidebarOpen }"
    >
      <Navbar @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />

      <div class="p-6 flex-grow">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
main {
  will-change: padding-left;
}
</style>