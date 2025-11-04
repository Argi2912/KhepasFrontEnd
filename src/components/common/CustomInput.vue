<template>
  <div class="input-wrapper">
    <label :for="id" class="input-label">{{ label }}</label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="placeholder"
      class="input-style"
      :required="required"
    />
  </div>
</template>

<script>
// El script que subiste es correcto y se mantiene.
export default {
  name: 'CustomInput',
  props: {
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, default: 'text' },
    modelValue: { type: [String, Number], default: '' },
    placeholder: { type: String, default: '' },
    required: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
}
</script>

<style scoped>
/* ¡No se necesitan estilos aquí! 
  Todo es manejado por auth.css
*/
</style>
