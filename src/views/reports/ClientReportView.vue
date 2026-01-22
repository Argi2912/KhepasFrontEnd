<script setup>
import EntityReport from '@/components/reports/EntityReport.vue'
</script>

<template>
  <EntityReport title="Reporte por Cliente" endpoint="/statistics/clients" export-type="clients_summary" />
</template>