// src/components/common/CustomInput.vue (Ajuste para estética)

<template>
  <div class="mb-5">
    <label :for="id" class="block text-sm font-medium text-gray-400 mb-1">{{ label }}</label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="placeholder"
      class="w-full px-4 py-2.5 border rounded-lg focus:outline-none transition-all duration-200"
      :class="[
        // Colores y diseño ajustado
        'bg-input-bg text-gray-100 border-gray-600 focus:border-accent-green placeholder-gray-500',
      ]"
      :required="required"
    />
  </div>
</template>

<script>
// ... (Mismo script)
</script>

<style scoped>
/* Estilos basados en la paleta de Binance */
.bg-input-bg {
  background-color: #363a43;
} /* Un tono ligeramente más claro que el fondo de la tarjeta */
.border-gray-600 {
  border-color: #4a515c;
}
.focus\:border-accent-green {
  border-color: #0ecb81;
}
.placeholder-gray-500::placeholder {
  color: #888;
}
</style>
