<script setup>
defineProps({
  operationType: String,
  isComplexExchange: Boolean,
  form: Object,
  commissionCurrency: String,
})
</script>

<template>
  <div v-if="operationType !== 'exchange'" class="commissions-panel">
    <div class="panel-header-flex">
      <h4>
        {{
          operationType === 'purchase'
            ? 'Rentabilidad (Spread)'
            : 'Rentabilidad Cambio Divisa'
        }}
      </h4>
    </div>

    <div class="commissions-grid grid-3">
      <div class="comm-card income">
        <label>{{
          operationType === 'purchase' ? 'Ganancia Bruta (%)' : 'Comisión (%)'
        }}</label>
        <div class="pct-input-wrapper">
          <input type="number" v-model="form.commission_charged_pct" placeholder="0" />
          <span>%</span>
        </div>
        <div class="calc-result text-success">+ {{ form.commission_charged_amount.toFixed(2) }}</div>
      </div>

      <div class="comm-card expense">
        <label>Costo Proveedor (%)</label>
        <div class="pct-input-wrapper">
          <input type="number" v-model="form.commission_provider_pct" placeholder="0" />
          <span>%</span>
        </div>
        <div class="calc-result text-danger">- {{ form.commission_provider_amount.toFixed(2) }}</div>
      </div>

      <div class="comm-card expense">
        <label>Costo Corredor (%)</label>
        <div class="pct-input-wrapper">
          <input type="number" v-model="form.commission_broker_pct" placeholder="0" />
          <span>%</span>
        </div>
        <div class="calc-result text-danger">- {{ form.commission_broker_amount.toFixed(2) }}</div>
      </div>

      <div v-if="isComplexExchange" class="comm-card expense">
        <label>Costo Admin (%)</label>
        <div class="pct-input-wrapper">
          <input type="number" v-model="form.commission_admin_pct" placeholder="0" />
          <span>%</span>
        </div>
        <div class="calc-result text-danger">- {{ form.commission_admin_amount.toFixed(2) }}</div>
      </div>

      <div v-if="form.capital_type === 'investor'" class="comm-card expense">
        <label>Porcentaje Inversionista (%)</label>
        <div class="pct-input-wrapper">
          <input type="number" v-model="form.investor_profit_pct" placeholder="0" />
          <span>%</span>
        </div>
        <div class="calc-result text-danger">- {{ form.investor_profit_amount.toFixed(2) }}</div>
      </div>
    </div>

    <div class="total-profit-bar">
      <span>Utilidad Real (Neta):</span>
      <strong :class="form.commission_net_after_investor >= 0 ? 'text-success' : 'text-danger'">
        {{ form.commission_net_after_investor.toFixed(2) }} {{ commissionCurrency }}
      </strong>
    </div>
  </div>
</template>

<style scoped>
.commissions-panel h4 {
  margin: 0 0 15px 0;
  color: var(--color-text-light);
  font-size: 1rem;
  border-bottom: 1px dashed var(--color-border);
  padding-bottom: 10px;
}

.commissions-grid {
  display: grid;
  gap: 15px;
  margin-bottom: 20px;
}

.grid-3 {
  grid-template-columns: 1fr 1fr 1fr;
}

.comm-card {
  background: var(--color-background);
  padding: 15px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
}

.comm-card label {
  font-size: 0.7rem;
  color: #aaa;
  margin-bottom: 8px;
}

.pct-input-wrapper {
  display: flex;
  align-items: center;
  background: #2b2f36;
  border-radius: 4px;
  padding: 0 8px;
  border: 1px solid #444;
}

.pct-input-wrapper input {
  background: transparent;
  border: none;
  color: white;
  width: 100%;
  padding: 6px 0;
  text-align: right;
  font-weight: bold;
}

.calc-result {
  text-align: right;
  margin-top: 5px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #ccc;
}

.total-profit-bar {
  background: #2b2f36;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid var(--color-border);
}

.total-profit-bar strong {
  font-size: 1.3rem;
}
</style>
