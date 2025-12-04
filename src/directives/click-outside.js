// src/directives/click-outside.js

const clickOutside = {
  // Hook llamado cuando la directiva está montada.
  mounted(el, binding) {
    el.__ClickOutsideHandler__ = (event) => {
      // Verifica si el clic está fuera del elemento Y si el elemento mismo no es el objetivo
      if (!(el === event.target || el.contains(event.target))) {
        // Ejecuta la función pasada como valor de la directiva
        binding.value(event)
      }
    }
    // Adjunta el event listener al documento.
    document.addEventListener('click', el.__ClickOutsideHandler__)
  },

  // Hook llamado cuando el elemento de la directiva está desmontado.
  unmounted(el) {
    // Limpia el event listener para evitar fugas de memoria.
    document.removeEventListener('click', el.__ClickOutsideHandler__)
    delete el.__ClickOutsideHandler__
  },
}

export default clickOutside
