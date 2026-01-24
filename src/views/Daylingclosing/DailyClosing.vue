<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '@/services/api'
import notify from '@/services/notify'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import BaseCard from '@/components/shared/BaseCard.vue'

// --- ESTADO ---
const isLoading = ref(false)
const isDownloading = ref(false)
const selectedDate = ref(new Date().toISOString().split('T')[0]) // Fecha de hoy
const data = ref({
    global_summary: [],
    accounts_details: [],
    movements: []
})

// --- 1. CARGA DE DATOS (PANTALLA) ---
// 1. Cargar Datos en Pantalla (Versión Blindada)
const fetchClosing = async () => {
    isLoading.value = true
    try {
        const response = await api.get('/daily-closing', {
            params: { date: selectedDate.value }
        })

        // Validación de seguridad:
        // Solo asignamos si la respuesta tiene la estructura correcta
        if (response.data && response.data.movements) {
            data.value = response.data
        } else {
            // Si el backend devuelve algo raro, no rompemos la vista
            console.warn("Respuesta inesperada del servidor:", response.data)
            notify.error("No se pudieron cargar los datos correctamente")
        }

    } catch (error) {
        console.error(error)
        notify.error('Error cargando el cierre')
    } finally {
        isLoading.value = false
    }
}

// --- 2. FORMATO DE MONEDA ---
const formatMoney = (amount, currency = 'USD') => {
    let safeCurrency = currency;
    if (currency === 'BS' || currency === 'Bs') safeCurrency = 'VES';
    try {
        return new Intl.NumberFormat('es-VE', {
            style: 'currency', currency: safeCurrency, minimumFractionDigits: 2
        }).format(amount || 0)
    } catch (error) {
        return `${currency} ${Number(amount || 0).toFixed(2)}`
    }
}

// --- 3. EXPORTAR (TU LÓGICA ORIGINAL) ---
const downloadReport = async (format) => {
    isDownloading.value = true
    try {
        // Usamos la fecha seleccionada como inicio y fin para filtrar solo este día
        const dateStr = selectedDate.value;

        const response = await api.get('/reports/download', {
            params: {
                report_type: 'internal', // Tipo de reporte que maneja tu backend
                format: format,
                start_date: dateStr,
                end_date: dateStr
            },
            responseType: 'blob' // Vital para que funcione la descarga
        })

        // Si el backend devuelve error en JSON en lugar del archivo
        if (response.data.type === 'application/json') {
            const errorText = await response.data.text();
            throw new Error(JSON.parse(errorText).message || 'Error generando reporte');
        }

        // Crear enlace de descarga temporal
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `Cierre_Caja_${dateStr}.${format === 'excel' ? 'xlsx' : 'pdf'}`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        notify.success(`Reporte descargado correctamente`)

    } catch (error) {
        console.error("Error descargando:", error)
        notify.error(error.message || 'No se pudo generar el reporte.')
    } finally {
        isDownloading.value = false
    }
}

// --- CICLO DE VIDA ---
watch(selectedDate, () => fetchClosing())
onMounted(() => fetchClosing())
</script>

<template>
    <div class="daily-closing-page">

        <div class="header-section">
            <div class="titles">
                <h1>Cierre de Caja Diario</h1>
                <p class="subtitle">Resumen financiero consolidado</p>
            </div>

            <div class="controls">
                <div class="date-control">
                    <label>Fecha:</label>
                    <input type="date" v-model="selectedDate" class="date-input">
                    <button @click="fetchClosing" class="btn-icon" title="Recargar Datos">
                        <FontAwesomeIcon icon="fa-solid fa-sync" :spin="isLoading" />
                    </button>
                </div>

                <div class="divider-vertical"></div>

                <button @click="downloadReport('excel')" :disabled="isDownloading" class="btn-export btn-excel"
                    title="Exportar a Excel">
                    <FontAwesomeIcon icon="fa-solid fa-file-excel" />
                    <span class="btn-text">Excel</span>
                </button>

                <button @click="downloadReport('pdf')" :disabled="isDownloading" class="btn-export btn-pdf"
                    title="Exportar a PDF">
                    <FontAwesomeIcon icon="fa-solid fa-file-pdf" />
                    <span class="btn-text">PDF</span>
                </button>
            </div>
        </div>

        <div class="summary-grid" v-if="!isLoading">
            <div v-for="stat in data.global_summary" :key="stat.currency" class="currency-card">
                <div class="card-header">
                    <span class="currency-badge">{{ stat.currency === 'BS' ? 'VES' : stat.currency }}</span>
                    <span class="net-label">Flujo Neto</span>
                </div>
                <div class="card-body">
                    <div class="stat-row income">
                        <span>Ingresos</span>
                        <strong>+{{ formatMoney(stat.total_income, stat.currency) }}</strong>
                    </div>
                    <div class="stat-row expense">
                        <span>Egresos</span>
                        <strong>-{{ formatMoney(stat.total_expense, stat.currency) }}</strong>
                    </div>
                    <hr class="divider">
                    <div class="stat-row total">
                        <span>Total Día</span>
                        <strong :class="stat.net_balance >= 0 ? 'text-green' : 'text-red'">
                            {{ formatMoney(stat.net_balance, stat.currency) }}
                        </strong>
                    </div>
                </div>
            </div>
            <div v-if="!data.global_summary || data.global_summary.length === 0" class="empty-state-card">
                <FontAwesomeIcon icon="fa-solid fa-cash-register" class="empty-icon" />
                <p>No hay movimientos registrados.</p>
            </div>
        </div>

        <div v-else class="loading-box">Cargando datos...</div>

        <BaseCard class="mt-4" v-if="data.accounts_details.length > 0">
            <div class="section-title">
                <FontAwesomeIcon icon="fa-solid fa-university" /> Balance por Cuentas
            </div>
            <table class="custom-table">
                <thead>
                    <tr>
                        <th>Cuenta</th>
                        <th class="text-right">Ingresos</th>
                        <th class="text-right">Egresos</th>
                        <th class="text-right">Flujo Neto</th>
                        <th class="text-right">Saldo Actual</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="acc in data.accounts_details" :key="acc.account_id">
                        <td class="account-name">{{ acc.account_name }} <small>({{ acc.currency }})</small></td>
                        <td class="text-right text-green">+{{ formatMoney(acc.income, acc.currency) }}</td>
                        <td class="text-right text-red">-{{ formatMoney(acc.expense, acc.currency) }}</td>
                        <td class="text-right font-bold">
                            <span :class="acc.net_flow >= 0 ? 'text-green' : 'text-red'">
                                {{ formatMoney(acc.net_flow, acc.currency) }}
                            </span>
                        </td>
                        <td class="text-right text-blue">{{ formatMoney(acc.final_balance, acc.currency) }}</td>
                    </tr>
                </tbody>
            </table>
        </BaseCard>

        <BaseCard class="mt-4" v-if="data.movements.length > 0">
            <div class="section-title">
                <FontAwesomeIcon icon="fa-solid fa-list" /> Últimos Movimientos
            </div>
            <div class="table-responsive">
                <table class="custom-table small-text">
                    <thead>
                        <tr>
                            <th>Hora</th>
                            <th>Categoría</th>
                            <th>Descripción</th>
                            <th>Resp.</th>
                            <th>Cuenta</th>
                            <th class="text-right">Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="mov in data.movements" :key="mov.id">
                            <td>{{ mov.time }}</td>
                            <td><span class="category-tag">{{ mov.category }}</span></td>
                            <td class="desc-cell">{{ mov.description }}</td>
                            <td>{{ mov.person || 'Sistema' }}</td>
                            <td>{{ mov.account }}</td>
                            <td class="text-right font-bold" :class="mov.type === 'income' ? 'text-green' : 'text-red'">
                                {{ mov.type === 'income' ? '+' : '-' }}{{ formatMoney(mov.amount) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </BaseCard>

    </div>
</template>

<style scoped>
/* --- ESTILOS VISUALES (Los mismos de antes) --- */
.daily-closing-page {
    padding: 20px;
    color: #e0e0e0;
}

.header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    flex-wrap: wrap;
    gap: 15px;
}

.header-section h1 {
    font-size: 1.8rem;
    margin: 0;
    color: #fbbf24;
}

.subtitle {
    color: #888;
    margin: 0;
    font-size: 0.9rem;
}

.controls {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #2c2f33;
    padding: 8px 15px;
    border-radius: 8px;
    border: 1px solid #3f3f46;
}

.date-control {
    display: flex;
    align-items: center;
    gap: 8px;
}

.date-input {
    background: #18191c;
    border: 1px solid #555;
    color: white;
    padding: 6px 10px;
    border-radius: 4px;
}

.divider-vertical {
    width: 1px;
    height: 25px;
    background: #555;
    margin: 0 5px;
}

/* Botones Export */
.btn-export {
    background: #333;
    color: #fff;
    border: 1px solid #444;
    padding: 8px 15px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.95rem;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
}

.btn-export:hover:not(:disabled) {
    transform: translateY(-2px);
}

.btn-export:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-excel:hover {
    background: #198754;
    border-color: #198754;
}

.btn-pdf:hover {
    background: #dc3545;
    border-color: #dc3545;
}

.btn-icon {
    background: none;
    border: 1px solid #555;
    color: #fbbf24;
    padding: 6px 10px;
    border-radius: 4px;
    cursor: pointer;
}

/* Cards & Tables */
.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.currency-card {
    background: #2c2f33;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    border: 1px solid #3f3f46;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.currency-badge {
    background: #fbbf24;
    color: #000;
    padding: 4px 8px;
    border-radius: 6px;
    font-weight: bold;
}

.net-label {
    color: #aaa;
    font-size: 0.8rem;
    text-transform: uppercase;
}

.stat-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 0.95rem;
}

.divider {
    border: 0;
    border-top: 1px solid #444;
    margin: 10px 0;
}

.total {
    font-size: 1.2rem;
}

.custom-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.95rem;
}

.custom-table th,
.custom-table td {
    padding: 12px 15px;
    border-bottom: 1px solid #3f3f46;
    text-align: left;
}

.custom-table th {
    color: #888;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.8rem;
}

.text-right {
    text-align: right;
}

.text-green {
    color: #27ae60;
}

.text-red {
    color: #e74c3c;
}

.text-blue {
    color: #3498db;
}

.font-bold {
    font-weight: bold;
}

.category-tag {
    background: #18191c;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.8rem;
    color: #ddd;
    border: 1px solid #444;
}

.desc-cell {
    color: #aaa;
    max-width: 250px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.mt-4 {
    margin-top: 2rem;
}

.empty-state-card {
    grid-column: 1 / -1;
    background: #2c2f33;
    padding: 40px;
    text-align: center;
    border-radius: 12px;
    color: #888;
    border: 1px dashed #555;
}

.empty-icon {
    font-size: 2rem;
    margin-bottom: 10px;
    color: #555;
}

@media (max-width: 768px) {
    .header-section {
        flex-direction: column;
        align-items: flex-start;
    }

    .controls {
        width: 100%;
        justify-content: space-between;
        flex-wrap: wrap;
    }

    .btn-text {
        display: none;
    }

    .table-responsive {
        overflow-x: auto;
    }
}
</style>