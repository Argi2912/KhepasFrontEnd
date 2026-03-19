<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

defineProps({
  operationType: String,
  isComplexExchange: Boolean,
  sourceCurrency: String,
  toAccount: Object,
  form: Object,
  clientReceivesAmount: [String, Number],
  hasSufficientBalance: Boolean,
  fromAccount: Object,
  selectedInvestor: Object,
  exchangePercentage: String,
})

const emit = defineEmits([
  'update:clientReceivesAmount',
  'onEditReceived',
  'onEditSent',
  'onEditRate',
  'onEditClientReceives',
])
</script>

<template>
  <div class="calc-panel">
    <div class="calc-row">
      <div class="input-group">
        <label v-if="operationType === 'purchase'">Monto Recibido (USD)</label>
        <label v-else-if="isComplexExchange">Monto del Cliente (Recibo)</label>
        <label v-else>Monto Enviado ({{ sourceCurrency }})</label>

        <input v-if="operationType === 'purchase' || isComplexExchange" type="number" v-model="form.amount_received"
          @input="emit('onEditReceived')" placeholder="0.00" class="big-input" />

        <input v-else type="number" v-model="form.amount_sent" @input="emit('onEditSent')" placeholder="0.00"
          class="big-input" />
      </div>

      <div class="operator">
        <span v-if="
          operationType === 'exchange' &&
          sourceCurrency === 'VES' &&
          toAccount?.currency_code === 'USD'
        ">÷</span>
        <span v-else-if="operationType === 'exchange'">×</span>
        <span v-else-if="operationType === 'currency_change'">−</span>
        <span v-else>×</span>
      </div>

      <div v-if="operationType === 'exchange'" class="operator">
        <FontAwesomeIcon icon="fa-solid fa-arrow-right" />
      </div>

      <div class="rate-inputs-container">
        <div v-if="operationType === 'purchase'" class="grid-2-rates">
          <div class="input-group">
            <label>Tasa Compra (Costo)</label>
            <input type="number" v-model="form.buy_rate" placeholder="250" class="big-input rate-input" />
          </div>
          <div class="input-group">
            <label>Tasa Mercado Real</label>
            <input type="number" v-model="form.received_rate" placeholder="300" class="big-input rate-input" />
          </div>
        </div>

        <div v-else-if="operationType === 'exchange'" class="input-group full-width-rate" style="position: relative">
          <label>Tasa (Opcional)</label>
          <input type="number" v-model="form.exchange_rate" @input="emit('onEditRate')" placeholder="Auto"
            class="big-input rate-input" />

          <div v-if="form.amount_sent > 0 && form.amount_received > 0" style="
              position: absolute;
              right: 0;
              top: 0;
              font-size: 0.75rem;
              font-weight: bold;
            " :style="{ color: parseFloat(exchangePercentage) >= 0 ? '#0ecb81' : '#f6465d' }">
            {{ exchangePercentage }}%
          </div>
        </div>

        <div v-else class="input-group full-width-rate">
          <label>Comisión (%)</label>
          <div class="pct-input-wrapper-inline">
            <input type="number" v-model="form.commission_charged_pct" placeholder="0" step="0.01"
              class="big-input rate-input" />
            <span class="pct-symbol">%</span>
          </div>
        </div>
      </div>

      <div v-if="operationType !== 'exchange'" class="operator">=</div>

      <div class="input-group">
        <label v-if="operationType === 'purchase'">Monto Enviado (BS)</label>
        <label v-else>Monto a Entregar al Cliente</label>

        <input v-if="operationType === 'purchase'" type="number" v-model="form.amount_sent" placeholder="0.00"
          class="big-input" readonly style="background: #1e2023; color: #ccc" />

        <input v-else-if="operationType === 'exchange'" type="number" v-model="form.amount_received"
          @input="emit('onEditReceived')" placeholder="0.00" class="big-input" />

        <input v-else type="number" :value="clientReceivesAmount"
          @input="emit('update:clientReceivesAmount', $event.target.value); emit('onEditClientReceives')"
          placeholder="0.00" class="big-input" />
      </div>
    </div>

    <p v-if="!hasSufficientBalance" class="error-txt">
      Saldo insuficiente en
      <span v-if="form.capital_type === 'own'">{{ fromAccount?.name }}</span>
      <span v-else-if="form.capital_type === 'investor'">{{ selectedInvestor?.name }}</span>
    </p>

    <div v-if="operationType === 'purchase' || isComplexExchange" class="delivery-check-group">
      <div class="check-item">
        <label class="checkbox-wrapper">
          <input type="checkbox" v-model="form.delivered" />
          <span class="checkmark"></span>
          <div class="check-text">
            <span class="title">Entregar Inmediatamente</span>
            <small v-if="!form.delivered" class="text-warning">Estado: POR COBRAR</small>
          </div>
        </label>
      </div>

      <div class="check-item">
        <label class="checkbox-wrapper">
          <input type="checkbox" v-model="form.paid" />
          <span class="checkmark"></span>
          <div class="check-text">
            <span class="title">Pagado Inmediatamente</span>
            <small v-if="!form.paid" class="text-danger">Estado: POR PAGAR</small>
          </div>
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calc-panel {
  background: var(--color-background);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid var(--color-border);
}

.calc-row {
  display: flex;
  align-items: flex-end;
  gap: 15px;
}

.input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.input-group label {
  font-size: 0.75rem;
  color: #888;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.big-input {
  background: #2b2f36;
  border: 1px solid var(--color-border);
  color: white;
  padding: 12px;
  font-size: 1.2rem;
  border-radius: 6px;
  width: 100%;
  font-weight: bold;
  box-sizing: border-box;
}

.readonly {
  background: #1e2023;
  color: var(--color-success);
  border-color: transparent;
}

.operator {
  font-size: 1.5rem;
  padding-bottom: 8px;
  color: #555;
  text-align: center;
}

.error-txt {
  color: var(--color-danger);
  margin-top: 5px;
  font-weight: bold;
}

.rate-inputs-container {
  flex: 2;
}

.grid-2-rates {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.rate-inputs-container .full-width-rate {
  flex: 1;
}

.pct-input-wrapper-inline {
  position: relative;
  display: flex;
  align-items: center;
}

.pct-input-wrapper-inline input {
  padding-right: 30px;
}

.pct-input-wrapper-inline .pct-symbol {
  position: absolute;
  right: 12px;
  color: #aaa;
  font-weight: bold;
  font-size: 1rem;
  pointer-events: none;
}

.delivery-check-group {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.check-item {
  flex: 1;
  min-width: 200px;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.checkbox-wrapper input {
  display: none;
}

.checkmark {
  width: 24px;
  height: 24px;
  background-color: #2b2f36;
  border: 1px solid #555;
  border-radius: 6px;
  position: relative;
  transition: 0.2s;
}

.checkbox-wrapper input:checked~.checkmark {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.checkbox-wrapper input:checked~.checkmark::after {
  content: '';
  position: absolute;
  left: 8px;
  top: 4px;
  width: 6px;
  height: 12px;
  border: solid #000;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.check-text {
  display: flex;
  flex-direction: column;
}

.check-text .title {
  font-weight: bold;
  color: var(--color-text-light);
  font-size: 0.95rem;
}
</style>
