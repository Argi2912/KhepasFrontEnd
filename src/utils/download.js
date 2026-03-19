import api from '@/services/api'
import notify from '@/services/notify'

/**
 * Downloads a file from a Blob response.
 * @param {Blob} blob - The file content.
 * @param {string} filename - The name of the file to be saved.
 */
export const downloadBlob = (blob, filename) => {
  if (!blob) {
    notify.error('El servidor no devolvió datos válidos.')
    return
  }

  // Si blob ya es una instancia de Blob, lo usamos directo, de lo contrario lo envolvemos
  const blobInstance = blob instanceof Blob ? blob : new Blob([blob])
  
  const url = window.URL.createObjectURL(blobInstance)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  
  // Compatibilidad para Firefox
  document.body.appendChild(link)
  link.click()
  
  // Limpieza después de un breve delay
  setTimeout(() => {
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }, 100)
}

/**
 * Common logic for downloading transaction receipts.
 * @param {number|string} id - The transaction ID.
 * @param {string} type - 'exchange' | 'internal'
 */
export const downloadTransactionReceipt = async (id, type = 'exchange') => {
  try {
    const endpoint = `/reports/receipt/${id}`
      
    const response = await api.get(endpoint, { 
      params: { format: 'pdf' },
      responseType: 'blob' 
    })
    
    // Check if the response is actually JSON (error)
    if (response.data.type === 'application/json') {
      const errorText = await response.data.text()
      const errorData = JSON.parse(errorText)
      throw new Error(errorData.message || 'Error al generar el recibo')
    }

    const filename = `Recibo_${type}_${id}.pdf`
    downloadBlob(response.data, filename)
    notify.success('Recibo descargado correctamente.')
  } catch (error) {
    notify.error(error.message || 'Error al descargar el recibo.')
    console.error('Download error:', error)
  }
}
