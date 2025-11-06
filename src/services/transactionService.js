import apiClient from '@/utils/http'

const transactionService = {
  // 1. Lectura
  index: (page = 1, search = '') => {
    return apiClient.get('/transactions', {
      params: {
        page: page,
        search: search,
      },
    })
  },
  show: (transactionId) => apiClient.get(`/transactions/${transactionId}`),

  // 2. Creación de Transacciones (Asientos contables)
  registerCXP: (data) => apiClient.post('/transactions/register-cxp', data),
  registerCXC: (data) => apiClient.post('/transactions/register-cxc', data),
  registerIngress: (data) => apiClient.post('/transactions/register-ingress', data), // Ingreso Directo
  registerEgress: (data) => apiClient.post('/transactions/register-egress', data), // Egreso Directo

  // 3. Saldar Cuentas (Pagos/Cobros)
  payDebt: (data) => apiClient.post('/transactions/pay-debt', data),
  receivePayment: (data) => apiClient.post('/transactions/receive-payment', data),

  // 4. Intercambio de Divisas
  executeExchange: (data) => apiClient.post('/transactions/execute-exchange', data),

  getLatestRate: (from_currency_id, to_currency_id, date) => {
    return apiClient.get('/exchange-rates/latest', {
      params: {
        from_currency_id,
        to_currency_id,
        date,
      },
    })
  },
}

export default transactionService
