export function useCurrencyFormatter() {
  const format = (amount, currencyCode = 'USD', showSign = false) => {
    if (amount === null || amount === undefined || amount === '') return '—'

    const num = parseFloat(amount)
    if (isNaN(num)) return '—'

    const formatted = new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(num))

    const sign = showSign ? (num > 0 ? '+' : num < 0 ? '-' : '') : num < 0 ? '-' : ''

    return `${sign}${formatted} ${currencyCode.toUpperCase()}`
  }

  return { format }
}
