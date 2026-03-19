import { ref } from 'vue'
import api from '@/services/api'
import Swal from 'sweetalert2'
import { downloadTransactionReceipt, downloadBlob } from '@/utils/download'

export function useInternalTransactionList() {
  const transactions = ref([])
  const isLoading = ref(false)
  const isDownloading = ref(false)
  const pagination = ref({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })

  const showDetailModal = ref(false)
  const selectedTx = ref(null)
  const isLoadingDetail = ref(false)

  const normalizeInternalTx = (data) => {
    if (!data) return {}

    const account = data.account || {}
    const user = data.user || {}
    const isIncome = data.type === 'income'

    let dateFormatted = 'N/A'
    if (data.transaction_date && typeof data.transaction_date === 'string') {
      try {
        const cleanDatePart = data.transaction_date.substring(0, 10);
        const parts = cleanDatePart.split('-');
        if (parts.length === 3) {
          dateFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
        } else {
          dateFormatted = data.transaction_date;
        }
      } catch (e) {
        dateFormatted = data.transaction_date || 'Error Fechas';
      }
    }

    let finalPersonName = '---';
    const category = (data.category || '').toLowerCase();
    const entityType = (data.entity_type || '');

    const isSystemOperation =
      entityType.includes('CurrencyExchange') ||
      category.includes('intercambio') ||
      category.includes('pago') ||
      category.includes('cobro') ||
      category.includes('deuda') ||
      !data.entity_type;

    if (isSystemOperation) {
      finalPersonName = user.name || 'Usuario Sistema';
    } else {
      if (data.entity) {
        finalPersonName = data.entity.name || data.entity.alias || data.entity.business_name;
      } else {
        finalPersonName = data.person_name;
      }
    }

    if (!finalPersonName || finalPersonName === 'N/A') finalPersonName = 'Desconocido';

    let finalOwner = data.dueño || 'N/A'
    if (finalOwner === 'N/A' && data.entity_type) {
      if (data.entity_type.includes('Client')) finalOwner = 'Cliente'
      else if (data.entity_type.includes('Provider')) finalOwner = 'Proveedor'
      else if (data.entity_type.includes('Employee')) finalOwner = 'Empleado'
      else if (data.entity_type.includes('Broker')) finalOwner = 'Corredor'
      else if (data.entity_type.includes('Platform')) finalOwner = 'Plataforma'
      else if (data.entity_type.includes('Investor')) finalOwner = 'Inversionista'
    }
    if (finalOwner === 'N/A') finalOwner = 'Interno';

    let finalAccountName = 'Cuenta Eliminada';
    let finalCurrency = account.currency_code || '';

    if (account.name) {
      finalAccountName = account.name;
    }
    else if (data.entity_type && data.entity_type.includes('Provider')) {
      finalAccountName = `Billetera: ${finalPersonName}`;
      if (!finalCurrency) finalCurrency = 'USD';
    }
    else if (data.entity_type && data.entity_type.includes('Investor')) {
      finalAccountName = `Capital: ${finalPersonName}`;
      if (!finalCurrency) finalCurrency = 'USD';
    }
    else if (data.person_name) {
      finalAccountName = `Virtual: ${data.person_name}`;
    }

    return {
      id: data.id,
      date_raw: data.transaction_date,
      date_fmt: dateFormatted,
      created_at: new Date(data.created_at).toLocaleString(),
      type: data.type,
      type_label: isIncome ? 'INGRESO' : 'EGRESO',
      is_income: isIncome,
      category: data.category || 'General',
      description: data.description || 'Sin notas adicionales',
      dueño: finalOwner,
      person_name: finalPersonName,
      account_name: finalAccountName,
      currency: finalCurrency,
      user_name: user.name || 'Usuario Eliminado',
      amount: parseFloat(data.amount || 0),
    }
  }

  const formatMoney = (amount, currency = '') => {
    const val = parseFloat(amount || 0).toFixed(2)
    return currency ? `${val} ${currency}` : val
  }

  const downloadReport = async (format) => {
    isDownloading.value = true
    try {
      const today = new Date().toISOString().slice(0, 10);
      const startOfTime = '2020-01-01';
      const response = await api.get('/reports/download', {
        params: {
          report_type: 'internal',
          format: format,
          start_date: startOfTime,
          end_date: today
        },
        responseType: 'blob'
      })
      
      const filename = `Caja_Historial_${today}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      downloadBlob(response.data, filename)
    } catch (error) {
      Swal.fire('Error', error.message || 'No se pudo generar el reporte.', 'error')
    } finally {
      isDownloading.value = false
    }
  }

  const downloadReceipt = async (id) => {
    await downloadTransactionReceipt(id, 'internal')
  }

  const fetchTransactions = async (page = 1) => {
    isLoading.value = true
    try {
      const { data } = await api.get(`/transactions/internal?page=${page}`)
      const mappedData = data.data.map((tx) => {
        const norm = normalizeInternalTx(tx)
        return {
          ...tx,
          ...norm,
          amount_fmt: formatMoney(norm.amount, norm.currency),
        }
      })
      transactions.value = mappedData.sort((a, b) => {
        if (b.date_raw > a.date_raw) return 1;
        if (b.date_raw < a.date_raw) return -1;
        return 0;
      });
      const { data: list, ...meta } = data
      pagination.value = meta
    } catch (e) {
      console.error('Error cargando caja:', e)
    } finally {
      isLoading.value = false
    }
  }

  const openModal = async (id) => {
    showDetailModal.value = true
    isLoadingDetail.value = true
    selectedTx.value = null
    try {
      const { data } = await api.get(`/transactions/internal/${id}`)
      selectedTx.value = normalizeInternalTx(data)
    } catch (e) {
      showDetailModal.value = false
    } finally {
      isLoadingDetail.value = false
    }
  }

  return {
    transactions,
    isLoading,
    isDownloading,
    pagination,
    showDetailModal,
    selectedTx,
    isLoadingDetail,
    fetchTransactions,
    downloadReport,
    downloadReceipt,
    openModal,
    formatMoney
  }
}
