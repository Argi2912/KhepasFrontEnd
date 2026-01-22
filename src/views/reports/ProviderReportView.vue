<script setup>
import EntityReport from '@/components/reports/EntityReport.vue'
</script>

<template>
  <EntityReport title="Reporte por Proveedor" endpoint="/statistics/providers" export-type="providers_summary" />
</template>
