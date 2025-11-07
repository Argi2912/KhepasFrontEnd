// Usamos SweetAlert2
import Swal from 'sweetalert2'

export default {
  /**
   * Muestra una confirmación antes de una acción destructiva.
   * Devuelve: true (si confirma), false (si cancela)
   */
  async confirm(title = '¿Estás seguro?', text = '¡No podrás revertir esto!') {
    const result = await Swal.fire({
      title: title,
      text: text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, ¡hazlo!',
      cancelButtonText: 'Cancelar',
    })

    return result.isConfirmed
  },

  /**
   * Muestra un popup de error simple.
   */
  error(title = 'Oops...', text = 'Algo salió mal.') {
    Swal.fire({
      icon: 'error',
      title: title,
      text: text,
    })
  },
}
