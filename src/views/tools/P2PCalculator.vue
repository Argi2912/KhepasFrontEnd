<script setup>
import { reactive, computed } from 'vue'
import BaseCard from '@/components/shared/BaseCard.vue' // Asumiendo que tienes este componente, si no, usa un div con clase card
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// --- ESTADO REACTIVO ---
const form = reactive({
    // Datos de Compra (Salida de dinero)
    pricePurchase: 1000,
    commPurchaseAd: 0,
    commPurchasePlatform: 0,

    // Datos de Venta (Entrada de dinero)
    priceSale: 1500,
    commSaleAd: 0,
    commSalePlatform: 0
})

// --- CÁLCULOS AUTOMÁTICOS (COMPUTED) ---

// 1. Costo Total (Precio Base + Comisiones de Compra)
const totalPurchaseCost = computed(() => {
    const price = parseFloat(form.pricePurchase) || 0
    const adFee = price * (parseFloat(form.commPurchaseAd) / 100)
    const platFee = price * (parseFloat(form.commPurchasePlatform) / 100)
    return price + adFee + platFee
})

// 2. Ingreso Neto (Precio Venta - Comisiones de Venta)
const netSaleIncome = computed(() => {
    const price = parseFloat(form.priceSale) || 0
    const adFee = price * (parseFloat(form.commSaleAd) / 100)
    const platFee = price * (parseFloat(form.commSalePlatform) / 100)
    return price - adFee - platFee
})

// 3. Ganancia Monetaria
const profitAmount = computed(() => {
    return netSaleIncome.value - totalPurchaseCost.value
})

// 4. Porcentaje de Rentabilidad (ROI)
const profitPercentage = computed(() => {
    if (totalPurchaseCost.value === 0) return 0
    return (profitAmount.value / totalPurchaseCost.value) * 100
})

// --- FORMATO ---
const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(val)
}
</script>

<template>
    <div class="calculator-view">
        <div class="header-section">
            <h1>
                <FontAwesomeIcon icon="fa-solid fa-calculator" /> Calculadora P2P
            </h1>
            <p class="subtitle">Simulador de Arbitraje y Rentabilidad</p>
        </div>

        <div class="calculator-grid">

            <div class="calc-card purchase-card">
                <div class="card-header">
                    <h3 class="text-red">
                        <FontAwesomeIcon icon="fa-solid fa-arrow-down" /> Datos de Compra
                    </h3>
                </div>

                <div class="form-group">
                    <label>Precio Compra</label>
                    <div class="input-wrapper">
                        <span class="currency-symbol">$</span>
                        <input type="number" v-model="form.pricePurchase" class="modern-input">
                    </div>
                </div>

                <div class="row-group">
                    <div class="form-group half">
                        <label>Com. Anuncio %</label>
                        <input type="number" v-model="form.commPurchaseAd" class="modern-input">
                    </div>
                    <div class="form-group half">
                        <label>Com. Plataforma %</label>
                        <input type="number" v-model="form.commPurchasePlatform" class="modern-input">
                    </div>
                </div>

                <div class="summary-line cost">
                    <span>Costo Real:</span>
                    <strong>{{ formatCurrency(totalPurchaseCost) }}</strong>
                </div>
            </div>

            <div class="result-column">
                <div class="result-circle">
                    <span class="label">Rentabilidad</span>
                    <span class="percentage" :class="profitPercentage >= 0 ? 'text-brand' : 'text-danger'">
                        {{ profitPercentage.toFixed(2) }}%
                    </span>
                    <span class="sub-label">ROI</span>
                </div>

                <div class="profit-box">
                    <span class="label">Ganancia Neta</span>
                    <span class="amount" :class="profitAmount >= 0 ? 'text-success' : 'text-danger'">
                        {{ profitAmount > 0 ? '+' : '' }}{{ formatCurrency(profitAmount) }}
                    </span>
                </div>
            </div>

            <div class="calc-card sale-card">
                <div class="card-header">
                    <h3 class="text-green">
                        <FontAwesomeIcon icon="fa-solid fa-arrow-up" /> Datos de Venta
                    </h3>
                </div>

                <div class="form-group">
                    <label>Precio Venta</label>
                    <div class="input-wrapper">
                        <span class="currency-symbol">$</span>
                        <input type="number" v-model="form.priceSale" class="modern-input">
                    </div>
                </div>

                <div class="row-group">
                    <div class="form-group half">
                        <label>Com. Anuncio %</label>
                        <input type="number" v-model="form.commSaleAd" class="modern-input">
                    </div>
                    <div class="form-group half">
                        <label>Com. Plataforma %</label>
                        <input type="number" v-model="form.commSalePlatform" class="modern-input">
                    </div>
                </div>

                <div class="summary-line income">
                    <span>Recibe Neto:</span>
                    <strong>{{ formatCurrency(netSaleIncome) }}</strong>
                </div>
            </div>

        </div>
    </div>
</template>

<style scoped>
/* VARIABLES DE COLOR (Basado en tu código original) */
.text-brand {
    color: #FFDF0C;
}

.text-red {
    color: #ef4444;
}

.text-green {
    color: #10b981;
}

.text-danger {
    color: #ef4444;
}

.text-success {
    color: #10b981;
}

.calculator-view {
    padding: 20px;
    color: #e0e0e0;
    max-width: 1200px;
    margin: 0 auto;
}

.header-section {
    text-align: center;
    margin-bottom: 40px;
}

.header-section h1 {
    font-size: 2rem;
    color: #FFDF0C;
    margin-bottom: 5px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.subtitle {
    color: #888;
    font-size: 0.9rem;
}

/* GRID LAYOUT */
.calculator-grid {
    display: grid;
    grid-template-columns: 1fr 250px 1fr;
    /* Izquierda - Centro - Derecha */
    gap: 30px;
    align-items: start;
}

/* TARJETAS DE INPUTS */
.calc-card {
    background: #1e1e1e;
    border: 1px solid #333;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    transition: transform 0.2s;
}

.calc-card:hover {
    border-color: #444;
    transform: translateY(-2px);
}

.purchase-card {
    border-top: 3px solid #ef4444;
}

.sale-card {
    border-top: 3px solid #10b981;
}

.card-header h3 {
    margin: 0 0 20px 0;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 10px;
    text-transform: uppercase;
    font-weight: bold;
}

/* FORMULARIOS */
.form-group {
    margin-bottom: 15px;
}

.row-group {
    display: flex;
    gap: 15px;
}

.half {
    flex: 1;
}

label {
    display: block;
    font-size: 0.8rem;
    color: #aaa;
    margin-bottom: 6px;
    text-transform: uppercase;
}

.input-wrapper {
    position: relative;
}

.currency-symbol {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #FFDF0C;
    font-weight: bold;
}

.modern-input {
    width: 100%;
    background: #111;
    border: 1px solid #444;
    color: #fff;
    padding: 12px 15px 12px 25px;
    /* Espacio para el símbolo */
    border-radius: 6px;
    font-size: 1rem;
    font-family: 'Courier New', monospace;
    /* Toque financiero */
    transition: all 0.3s;
}

.modern-input:focus {
    outline: none;
    border-color: #FFDF0C;
    box-shadow: 0 0 8px rgba(255, 223, 12, 0.2);
}

/* SUBTOTALES */
.summary-line {
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px dashed #444;
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
}

.summary-line.cost strong {
    color: #ef4444;
}

.summary-line.income strong {
    color: #10b981;
}

/* COLUMNA CENTRAL (RESULTADOS) */
.result-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.result-circle {
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, #2a2a2a 0%, #111 100%);
    border: 4px solid #333;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-shadow: 0 0 20px rgba(255, 223, 12, 0.1);
    position: relative;
}

.result-circle .percentage {
    font-size: 2.5rem;
    font-weight: 800;
    line-height: 1;
}

.result-circle .label {
    font-size: 0.8rem;
    color: #888;
    text-transform: uppercase;
    margin-bottom: 5px;
}

.result-circle .sub-label {
    font-size: 0.7rem;
    color: #555;
    margin-top: 5px;
}

.profit-box {
    background: #111;
    border: 1px solid #FFDF0C;
    padding: 15px 30px;
    border-radius: 8px;
    text-align: center;
    width: 100%;
}

.profit-box .label {
    display: block;
    font-size: 0.8rem;
    color: #FFDF0C;
    margin-bottom: 5px;
}

.profit-box .amount {
    font-size: 1.5rem;
    font-weight: bold;
}

/* RESPONSIVE */
@media (max-width: 900px) {
    .calculator-grid {
        grid-template-columns: 1fr;
    }

    .result-column {
        order: -1;
        /* Mover resultados arriba en móvil */
        margin-bottom: 20px;
    }
}
</style>