<script setup>
import { reactive, computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// --- CONSTANTES PAYPAL ---
// Tasa estándar internacional (puedes cambiarlas si tu cuenta tiene otras tasas)
const FEE_PERCENTAGE = 5.4
const FIXED_FEE = 0.30

// --- ESTADO REACTIVO ---
const form = reactive({
    amountToSend: 100,      // Caso 1: Si envío esto...
    amountToReceive: 100    // Caso 2: Si quiero recibir esto...
})

// --- CÁLCULO 1: ¿CUÁNTO LLEGA? (Si envío X) ---
const resultsSend = computed(() => {
    const amount = parseFloat(form.amountToSend) || 0
    if (amount <= 0) return { fee: 0, total: 0 }

    const fee = (amount * FEE_PERCENTAGE / 100) + FIXED_FEE
    const total = amount - fee

    return {
        fee: fee > 0 ? fee : 0,
        total: total > 0 ? total : 0
    }
})

// --- CÁLCULO 2: ¿CUÁNTO ENVIAR? (Para recibir Y) ---
const resultsReceive = computed(() => {
    const amount = parseFloat(form.amountToReceive) || 0
    if (amount <= 0) return { fee: 0, total: 0 }

    // Fórmula inversa: Monto / (1 - %) + Fijo ajustado
    const total = (amount + FIXED_FEE) / (1 - (FEE_PERCENTAGE / 100))
    const fee = total - amount

    return {
        fee: fee > 0 ? fee : 0,
        total: total > 0 ? total : 0
    }
})

// --- FORMATO MONEDA ---
const currency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
}
</script>

<template>
    <div class="paypal-view">

        <div class="header-section">
            <h1>
                <FontAwesomeIcon icon="fa-solid fa-money-check-dollar" /> Calculadora PayPal
            </h1>
            <p class="subtitle">Calcula comisiones exactas para recibir o enviar pagos</p>
            <div class="rate-badge">
                Tasa: {{ FEE_PERCENTAGE }}% + ${{ FIXED_FEE }} USD
            </div>
        </div>

        <div class="calculator-grid">

            <div class="calc-card">
                <div class="card-header border-blue">
                    <h3>
                        <FontAwesomeIcon icon="fa-solid fa-hand-holding-dollar" />
                        ¿Cuánto Recibo?
                    </h3>
                    <span class="desc">Si envían un monto específico</span>
                </div>

                <div class="input-section">
                    <label>Si envían:</label>
                    <div class="input-wrapper">
                        <span class="prefix">$</span>
                        <input type="number" v-model="form.amountToSend" class="modern-input">
                    </div>
                </div>

                <div class="result-box">
                    <div class="result-row text-red">
                        <span>Comisión PayPal:</span>
                        <span>- {{ currency(resultsSend.fee) }}</span>
                    </div>
                    <div class="divider"></div>
                    <div class="result-row main text-blue">
                        <span>Recibes Neto:</span>
                        <span class="big-number">{{ currency(resultsSend.total) }}</span>
                    </div>
                </div>
            </div>

            <div class="calc-card">
                <div class="card-header border-yellow">
                    <h3>
                        <FontAwesomeIcon icon="fa-solid fa-paper-plane" />
                        ¿Cuánto deben Enviar?
                    </h3>
                    <span class="desc">Para recibir un monto exacto</span>
                </div>

                <div class="input-section">
                    <label>Para recibir libre:</label>
                    <div class="input-wrapper">
                        <span class="prefix">$</span>
                        <input type="number" v-model="form.amountToReceive" class="modern-input">
                    </div>
                </div>

                <div class="result-box">
                    <div class="result-row text-red">
                        <span>Comisión PayPal:</span>
                        <span>+ {{ currency(resultsReceive.fee) }}</span>
                    </div>
                    <div class="divider"></div>
                    <div class="result-row main text-yellow">
                        <span>Deben Enviar:</span>
                        <span class="big-number">{{ currency(resultsReceive.total) }}</span>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<style scoped>
/* COLORES */
.text-blue {
    color: #0070ba;
}

/* Azul PayPal */
.text-yellow {
    color: #FFDF0C;
}

.text-red {
    color: #ef4444;
}

.paypal-view {
    padding: 20px;
    color: #e0e0e0;
    max-width: 1000px;
    margin: 0 auto;
}

/* HEADER */
.header-section {
    text-align: center;
    margin-bottom: 40px;
}

.header-section h1 {
    font-size: 2.2rem;
    color: #fff;
    /* Blanco o el Azul de PayPal */
    margin-bottom: 5px;
    font-weight: 800;
}

/* Icono de PayPal en el título */
.header-section h1 svg {
    color: #0070ba;
    margin-right: 10px;
}

.subtitle {
    color: #888;
    font-size: 0.95rem;
    margin-bottom: 15px;
}

.rate-badge {
    display: inline-block;
    background: #1e1e1e;
    border: 1px solid #333;
    padding: 5px 15px;
    border-radius: 20px;
    font-size: 0.8rem;
    color: #aaa;
}

/* GRID */
.calculator-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
}

/* CARDS */
.calc-card {
    background: #1e1e1e;
    border: 1px solid #333;
    padding: 25px;
    border-radius: 16px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    transition: transform 0.2s;
    display: flex;
    flex-direction: column;
}

.calc-card:hover {
    transform: translateY(-3px);
    border-color: #444;
}

.card-header {
    margin-bottom: 25px;
    padding-bottom: 15px;
    border-bottom: 2px solid #333;
}

.card-header.border-blue {
    border-bottom-color: #0070ba;
}

.card-header.border-yellow {
    border-bottom-color: #FFDF0C;
}

.card-header h3 {
    margin: 0;
    font-size: 1.3rem;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 10px;
}

.desc {
    font-size: 0.85rem;
    color: #777;
    margin-top: 5px;
    display: block;
}

/* INPUTS */
.input-section {
    margin-bottom: 25px;
}

.input-section label {
    display: block;
    color: #aaa;
    margin-bottom: 8px;
    font-size: 0.9rem;
}

.input-wrapper {
    position: relative;
}

.prefix {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #fff;
    font-weight: bold;
    font-size: 1.1rem;
}

.modern-input {
    width: 100%;
    background: #111;
    border: 1px solid #444;
    color: #fff;
    padding: 15px 15px 15px 30px;
    border-radius: 8px;
    font-size: 1.2rem;
    font-weight: bold;
    transition: all 0.3s;
}

.modern-input:focus {
    outline: none;
    border-color: #fff;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
}

/* RESULTADOS */
.result-box {
    background: #111;
    padding: 20px;
    border-radius: 12px;
    margin-top: auto;
    /* Empuja al fondo */
}

.result-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.95rem;
    margin-bottom: 8px;
}

.divider {
    height: 1px;
    background: #333;
    margin: 10px 0;
}

.result-row.main {
    align-items: center;
    margin-bottom: 0;
}

.result-row.main span:first-child {
    font-size: 1rem;
    color: #ccc;
}

.big-number {
    font-size: 1.8rem;
    font-weight: 800;
    font-family: 'Segoe UI', sans-serif;
}

/* RESPONSIVE */
@media (max-width: 768px) {
    .calculator-grid {
        grid-template-columns: 1fr;
    }
}
</style>