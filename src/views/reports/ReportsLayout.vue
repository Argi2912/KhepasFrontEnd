<!-- src/views/reports/ReportsLayout.vue -->
<template>
  <div class="reports-layout">
    <div class="reports-header">
      <h1 class="text-2xl font-bold text-primary">Reportes Financieros</h1>
    </div>
    <div class="reports-content">
      <router-view />
    </div>
  </div>
</template>

<script setup></script>

<style scoped>
.reports-layout {
  padding: 20px;
}

.reports-header {
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}
</style>
