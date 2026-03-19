/**
 * Utility for formatting currency values consistent with Khepas business logic.
 */
export function useCurrencyFormatter() {
  const format = (value, currency = 'USD') => {
    if (value === null || value === undefined) value = 0

    // 1. Normalizar código (USDT -> USD)
    let currencyCode = currency === 'USDT' ? 'USD' : currency

    // 2. Especial para 'BS' o 'VES'
    if (currencyCode === 'BS' || currencyCode === 'VES') {
      return `Bs. ${new Intl.NumberFormat('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value)}`
    }

    // 3. Intento estándar
    try {
      return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value)
    } catch (error) {
      console.warn('Moneda desconocida:', currencyCode)
      return `${currencyCode} ${Number(value).toFixed(2)}`
    }
  }

  return { format }
}
