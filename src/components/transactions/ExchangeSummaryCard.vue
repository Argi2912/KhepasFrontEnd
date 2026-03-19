<script setup>
defineProps({
  operationType: String,
  form: Object,
  clients: Array,
  brokers: Array,
  selectedPlatform: Object,
  selectedProvider: Object,
  sourceName: String,
  sourceCurrency: String,
  toAccount: Object,
  commissionCurrency: String,
})
</script>

<template>
  <div class="summary-card">
    <div class="summary-header">
      <h3>Resumen</h3>
      <span class="badge">{{ operationType.toUpperCase().replace('_', ' ') }}</span>
    </div>

    <div class="summary-table">
      <div class="row">
        <span>Cliente</span>
        <strong>{{
          clients.find((c) => c.id == form.client_id)?.name
        }}</strong>
      </div>

      <div class="row" v-if="form.platform_id">
        <span>Admin/Plataforma</span>
        <span>{{ selectedPlatform?.name }}</span>
      </div>

      <div class="row" v-if="form.broker_id">
        <span>Corredor</span>
        <span>{{
          brokers.find((b) => b.id == form.broker_id)?.name
        }}</span>
      </div>

      <div class="row" v-if="form.provider_id">
        <span>Proveedor</span>
        <span>{{ selectedProvider?.name }}</span>
      </div>

      <div class="divider"></div>

      <div class="row highlight">
        <span>Monto Enviado ({{ sourceName }})</span>
        <span class="text-danger">- {{ form.amount_sent }} {{ sourceCurrency }}</span>
      </div>

      <div class="row highlight">
        <span>Monto Recibido ({{ toAccount?.name }})</span>
        <span class="text-success">+ {{ form.amount_received }} {{ toAccount?.currency_code }}</span>
      </div>

      <div v-if="operationType === 'purchase'" class="row">
        <span>Tasa Compra</span>
        <span>{{ form.buy_rate }}</span>
      </div>
      <div v-if="operationType === 'purchase'" class="row">
        <span>Tasa Mercado</span>
        <span>{{ form.received_rate }}</span>
      </div>

      <template v-if="operationType !== 'exchange'">
        <div class="divider"></div>
        <div class="row" v-if="form.commission_provider_amount > 0">
          <span>Pago Proveedor (Estimado)</span>
          <span class="text-danger">- {{ form.commission_provider_amount.toFixed(2) }}</span>
        </div>
        <div class="row" v-if="form.commission_broker_amount > 0">
          <span>Pago Corredor</span>
          <span class="text-danger">- {{ form.commission_broker_amount.toFixed(2) }}</span>
        </div>
        <div class="row" v-if="form.commission_admin_amount > 0">
          <span>Pago Plataforma</span>
          <span class="text-danger">- {{ form.commission_admin_amount.toFixed(2) }}</span>
        </div>
        <div class="row" v-if="form.investor_profit_amount > 0">
          <span>Pago Inversionista</span>
          <span class="text-danger">- {{ form.investor_profit_amount.toFixed(2) }}</span>
        </div>

        <div class="row total">
          <span>Utilidad Real</span>
          <span :class="form.commission_net_after_investor >= 0 ? 'text-success' : 'text-danger'
            ">
            {{ form.commission_net_after_investor.toFixed(2) }} {{ commissionCurrency }}
          </span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.summary-card {
  background: var(--color-background);
  padding: 0;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  max-width: 500px;
  margin: 0 auto;
  overflow: hidden;
  color: var(--color-text-light);
}

.summary-header {
  background: #2b2f36;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-table {
  padding: 20px;
}

.row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.row.total {
  font-size: 1.2rem;
  font-weight: bold;
  margin-top: 15px;
  border-top: 1px solid var(--color-border);
  padding-top: 10px;
}

.divider {
  border-top: 1px solid var(--color-border);
  margin: 10px 0;
  width: 100%;
}

.text-success {
  color: #0ecb81;
}

.text-danger {
  color: #f6465d;
}

.badge {
  background: var(--color-primary);
  color: #111;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
}

.highlight {
  font-weight: bold;
}
</style>
