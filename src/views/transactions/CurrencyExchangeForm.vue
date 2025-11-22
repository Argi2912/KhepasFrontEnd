<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useTransactionStore } from '@/stores/transaction'
import { useAuthStore } from '@/stores/auth'
import { useFormValidation } from '@/utils/useFormValidation'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const router = useRouter()
const authStore = useAuthStore()
const transactionStore = useTransactionStore()
const { errors, handleAxiosError } = useFormValidation()

// --- ESTADO ---
const currentStep = ref(1)
const totalSteps = 3
const isSubmitting = ref(false)
const operationType = ref('purchase') 
const isAutoCalculating = ref(false)

const form = reactive({
  client_id: '',
  broker_id: '',
  provider_id: '',
  platform_id: '',
  admin_user_id: authStore.authUser?.id,
  from_account_id: '',
  to_account_id: '',
  amount_sent: '',
  amount_received: '',

  // Tasas
  exchange_rate: '', 
  buy_rate: '',
  received_rate: '',

  // Comisiones (Porcentajes)
  commission_charged_pct: 0,
  commission_broker_pct: 0,
  commission_provider_pct: 0,
  commission_admin_pct: 0,

  // Comisiones (Montos)
  commission_charged_amount: 0,
  commission_broker_amount: 0,
  commission_provider_amount: 0,
  commission_admin_amount: 0,
  commission_net_profit: 0,
  
  // Extras
  reference_id: '',
  person_name: '',
  account_owner: '',
})

// --- COMPUTEDS ---
const sourceAccounts = computed(() => transactionStore.getAccounts)
const destinationAccounts = computed(() => {
  if (operationType.value === 'purchase') {
    return transactionStore.getAccounts.filter((a) => a.currency_code?.toUpperCase() !== 'VES')
  }
  return transactionStore.getAccounts
})
const fromAccount = computed(() => transactionStore.getAccounts.find((a) => a.id == form.from_account_id))
const toAccount = computed(() => transactionStore.getAccounts.find((a) => a.id == form.to_account_id))
const selectedProvider = computed(() => transactionStore.getProviders.find((p) => p.id == form.provider_id))
const selectedPlatform = computed(() => transactionStore.getPlatforms.find((p) => p.id == form.platform_id))

const commissionCurrency = computed(() => {
  if (operationType.value === 'purchase') return toAccount.value?.currency_code || '---'
  return fromAccount.value?.currency_code || '---'
})

const hasSufficientBalance = computed(() => {
  if (!fromAccount.value || !form.amount_sent) return true
  const rawAccount = transactionStore.rawAccounts?.find((a) => a.id == form.from_account_id)
  return rawAccount ? parseFloat(rawAccount.balance) >= parseFloat(form.amount_sent) : true
})

const totalClientPays = computed(() => {
    const base = parseFloat(form.amount_sent) || 0
    const commission = parseFloat(form.commission_charged_amount) || 0
    return (base + commission).toFixed(2)
})

// --- LÓGICA COMPRA ---
watch(
  [() => form.buy_rate, () => form.received_rate],
  ([buy, received]) => {
    if (operationType.value !== 'purchase' || isAutoCalculating.value) return
    const b = parseFloat(buy) || 0
    const r = parseFloat(received) || 0
    if (b > 0 && r > 0) {
      isAutoCalculating.value = true
      const pct = ((r / b) * 100) - 100
      form.commission_charged_pct = pct.toFixed(2)
      calculateAmounts()
      setTimeout(() => isAutoCalculating.value = false, 0)
    }
  }
)

watch(
  () => form.commission_charged_pct,
  (newPct) => {
    if (operationType.value !== 'purchase' || isAutoCalculating.value) return
    const pct = parseFloat(newPct) || 0
    const r = parseFloat(form.received_rate) || 0
    if (r > 0) {
      isAutoCalculating.value = true
      const newBuyRate = r / (1 + (pct / 100))
      form.buy_rate = newBuyRate.toFixed(2)
      calculateAmounts()
      setTimeout(() => isAutoCalculating.value = false, 0)
    }
  }
)

// --- LÓGICA CAMBIO DIVISA ---
watch(
  [() => form.amount_sent, () => form.exchange_rate],
  ([sent, rate]) => {
    if (operationType.value !== 'currency_conversion' || isAutoCalculating.value) return
    
    const s = parseFloat(sent) || 0
    const r = parseFloat(rate) || 0
    
    if (s > 0 && r > 0) {
        isAutoCalculating.value = true
        form.amount_received = (s * r).toFixed(2)
        calculateCommissions()
        setTimeout(() => isAutoCalculating.value = false, 0)
    }
  }
)

// --- WATCHERS COMISIONES ---
watch(
  [
    () => form.commission_charged_pct, 
    () => form.commission_provider_pct, 
    () => form.commission_broker_pct,
    () => form.commission_admin_pct
  ],
  () => { calculateCommissions() }
)

function calculateAmounts() {
  if (operationType.value !== 'purchase') return
  const r = parseFloat(form.amount_received) || 0
  const tasaCompra = parseFloat(form.buy_rate) || 0
  if (r > 0 && tasaCompra > 0) {
    form.amount_sent = (r * tasaCompra).toFixed(2)
  } else {
    form.amount_sent = 0
  }
  calculateCommissions()
}

function calculateCommissions() {
  let commissionBase = 0; 
  
  if (operationType.value === 'purchase') {
    commissionBase = parseFloat(form.amount_received) || 0
  } else {
    commissionBase = parseFloat(form.amount_sent) || 0
  }

  if (commissionBase > 0) {
    
    // 1. GANANCIA BRUTA (El Pastel)
    // Se calcula sobre la base: 20,000 * 5% = 1,000
    const chargedPct = parseFloat(form.commission_charged_pct) || 0;
    const chargedAmount = (commissionBase * (chargedPct / 100));
    form.commission_charged_amount = chargedAmount.toFixed(2);
    
    // --- LÓGICA SEGÚN TIPO DE OPERACIÓN ---

    if (operationType.value === 'currency_conversion') {
        // 🔥 MODO REPARTO (SPLIT) 🔥
        // Aquí los % de gastos se calculan SOBRE LA GANANCIA (los 1,000)
        
        // 2. Proveedor (Ej: 40% de 1,000 = 400)
        const providerSharePct = parseFloat(form.commission_provider_pct) || 0;
        const providerCut = chargedAmount * (providerSharePct / 100);
        form.commission_provider_amount = providerCut.toFixed(2);

        // 3. Corredor (Ej: 5% de 1,000 = 50)
        const brokerSharePct = parseFloat(form.commission_broker_pct) || 0;
        const brokerCut = chargedAmount * (brokerSharePct / 100);
        form.commission_broker_amount = brokerCut.toFixed(2);

        // 4. Plataforma (Ej: X% de 1,000)
        const adminSharePct = parseFloat(form.commission_admin_pct) || 0;
        const adminCut = chargedAmount * (adminSharePct / 100);
        form.commission_admin_amount = adminCut.toFixed(2);

        // Utilidad Neta = Lo que sobra del pastel (Ej: 550)
        form.commission_net_profit = (chargedAmount - providerCut - brokerCut - adminCut).toFixed(2);
    } 
    else {
        // 🔥 MODO ESTÁNDAR (Compra/Exchange) 🔥
        // Aquí los gastos son un costo operativo sobre el VOLUMEN TOTAL
        
        let expenseBase = commissionBase; // Base simple por defecto

        const providerPct = parseFloat(form.commission_provider_pct) || 0;
        form.commission_provider_amount = (expenseBase * (providerPct / 100)).toFixed(2);
        
        const brokerPct = parseFloat(form.commission_broker_pct) || 0;
        form.commission_broker_amount = (expenseBase * (brokerPct / 100)).toFixed(2);

        const adminPct = parseFloat(form.commission_admin_pct) || 0;
        form.commission_admin_amount = (expenseBase * (adminPct / 100)).toFixed(2);

        form.commission_net_profit = (
          chargedAmount - 
          parseFloat(form.commission_provider_amount) - 
          parseFloat(form.commission_broker_amount) - 
          parseFloat(form.commission_admin_amount)
        ).toFixed(2);
    }

  } else {
    form.commission_charged_amount = 0
    form.commission_provider_amount = 0
    form.commission_broker_amount = 0
    form.commission_admin_amount = 0
    form.commission_net_profit = 0
  }
}

watch(operationType, () => {
  form.from_account_id = ''
  form.to_account_id = ''
  form.amount_sent = ''
  form.amount_received = ''
  form.exchange_rate = ''
  form.buy_rate = ''
  form.received_rate = ''
  form.commission_charged_pct = 0
  form.commission_provider_pct = 0
  form.commission_admin_pct = 0
  form.commission_broker_pct = 0
  form.platform_id = ''
  form.provider_id = ''
  form.client_id = ''
  form.broker_id = ''
})

onMounted(async () => { await transactionStore.fetchAllSupportData() })

const nextStep = () => {
  if (operationType.value === 'exchange') {
     if (currentStep.value === 1) {
        if (!form.from_account_id || !form.to_account_id || !form.platform_id) return Swal.fire('Falta información', 'Seleccione Cuentas y Plataforma.', 'warning');
     }
  } 
  else if (operationType.value === 'currency_conversion') {
     if (currentStep.value === 1) {
        if (!form.client_id || !form.provider_id || !form.platform_id || !form.from_account_id || !form.to_account_id) return Swal.fire('Falta información', 'Complete todos los campos requeridos.', 'warning');
     }
  }
  else {
     if (currentStep.value === 1 && (!form.from_account_id || !form.to_account_id || !form.client_id)) return Swal.fire('Falta información', 'Complete los campos obligatorios.', 'warning');
  }
  if (currentStep.value < totalSteps) currentStep.value++
}

const prevStep = () => { if (currentStep.value > 1) currentStep.value-- }

const handleConfirm = async () => {
  if (!hasSufficientBalance.value) return Swal.fire('Saldo Insuficiente', `La cuenta ${fromAccount.value?.name} no tiene fondos suficientes.`, 'error')
  
  if (operationType.value === 'exchange') {
     if (!form.amount_sent || !form.amount_received) return Swal.fire('Falta Datos', 'Ingrese los montos.', 'warning')
  } 
  else if (operationType.value === 'currency_conversion') {
     if (!form.amount_sent || !form.exchange_rate) return Swal.fire('Falta Datos', 'Ingrese monto y tasa.', 'warning')
  }
  else if (operationType.value === 'purchase') {
     if (!form.buy_rate || !form.received_rate) return Swal.fire('Falta Datos', 'Ingrese tasas.', 'warning')
  }

  isSubmitting.value = true
  try {
    let payload = { ...form, operation_type: 'exchange' } 
    
    if (operationType.value === 'purchase') {
      payload.operation_type = 'purchase'
      payload.exchange_rate = null
      payload.platform_id = null
      payload.commission_admin_pct = 0
      payload.commission_admin_amount = 0
      payload.commission_broker_pct = 0
      payload.commission_broker_amount = 0
    } 
    else if (operationType.value === 'exchange') {
      payload.buy_rate = null
      payload.received_rate = null
      payload.provider_id = null 
      payload.commission_broker_pct = 0
      
      if (!payload.client_id && transactionStore.getClients.length > 0) {
         payload.client_id = transactionStore.getClients[0].id 
      }

      const sent = parseFloat(payload.amount_sent) || 0
      const received = parseFloat(payload.amount_received) || 0
      if (sent > 0) payload.exchange_rate = (received / sent).toFixed(8)
      else payload.exchange_rate = 1
    } 
    else if (operationType.value === 'currency_conversion') {
       payload.buy_rate = null
       payload.received_rate = null
    }

    const response = await transactionStore.createCurrencyExchange(payload)
    await Swal.fire({ title: '¡Procesado!', text: `Operación #${response.number} exitosa.`, icon: 'success', confirmButtonColor: '#0ecb81' })
    router.push({ name: 'transaction_exchange_list' })
  } catch (error) { 
    handleAxiosError(error) 
  } finally { 
    isSubmitting.value = false 
  }
}
</script>

<template>
  <div class="page-wrapper">
    <div v-if="transactionStore.isLoadingData" class="loading-screen">
      <p>Cargando datos...</p>
    </div>
    <div v-else class="form-card">
      <div class="form-header">
        <div>
          <h2>Nueva Operación</h2>
          <p class="subtitle">Paso {{ currentStep }} / {{ totalSteps }}</p>
        </div>
        <div class="type-switcher">
          <button :class="{ active: operationType === 'purchase' }" @click="operationType = 'purchase'">Compra</button>
          <button :class="{ active: operationType === 'currency_conversion' }" @click="operationType = 'currency_conversion'">Cambio Divisa</button>
          <button :class="{ active: operationType === 'exchange' }" @click="operationType = 'exchange'">Intercambio</button>
        </div>
      </div>
      <div class="progress-bar" :style="{ width: (currentStep / totalSteps) * 100 + '%' }"></div>

      <div class="form-body">
        
        <div v-if="operationType === 'exchange'" class="exchange-view fade-in">
            <div v-if="currentStep === 1">
                <div class="grid-2">
                    <BaseSelect label="1. Cuenta Origen (Sale)" :options="transactionStore.getAccounts" v-model="form.from_account_id" required />
                    <BaseSelect label="2. Cuenta Destino (Entra)" :options="transactionStore.getAccounts" v-model="form.to_account_id" required />
                    <BaseSelect label="3. Plataforma *" :options="transactionStore.getPlatforms" v-model="form.platform_id" required class="col-span-2" />
                </div>
            </div>
            <div v-if="currentStep === 2">
                 <div class="exchange-amounts-card">
                    <p v-if="!hasSufficientBalance" class="error-txt mb-2">⚠️ Saldo insuficiente en {{ fromAccount?.name }}</p>
                    <div class="amount-row">
                        <label>Monto Enviado ({{ fromAccount?.currency_code }})</label>
                        <input type="number" v-model="form.amount_sent" placeholder="0.00" class="big-input text-danger" />
                    </div>
                    <div class="arrow-separator"><FontAwesomeIcon icon="fa-solid fa-arrow-down" /></div>
                    <div class="amount-row">
                        <label>Monto Recibido ({{ toAccount?.currency_code }})</label>
                        <input type="number" v-model="form.amount_received" placeholder="0.00" class="big-input text-success" />
                    </div>
                </div>
            </div>
            <div v-if="currentStep === 3">
                <div class="summary-card">
                    <div class="summary-header"><h3>Resumen Intercambio</h3><span class="badge">EXCHANGE</span></div>
                    <div class="summary-table">
                        <div class="row"><span>Plataforma</span><strong>{{ selectedPlatform?.name }}</strong></div>
                        <div class="divider"></div>
                        <div class="row highlight"><span>Enviado</span><span class="text-danger">- {{ form.amount_sent }} {{ fromAccount?.currency_code }}</span></div>
                        <div class="row highlight"><span>Recibido</span><span class="text-success">+ {{ form.amount_received }} {{ toAccount?.currency_code }}</span></div>
                        <div class="row total"><span>Cuentas:</span><small>{{ fromAccount?.name }} ➜ {{ toAccount?.name }}</small></div>
                    </div>
                </div>
            </div>
        </div>

        <div v-else-if="operationType === 'currency_conversion'" class="conversion-view fade-in">
            <div v-if="currentStep === 1">
                <div class="grid-2">
                    <BaseSelect label="Cliente *" :options="transactionStore.getClients" v-model="form.client_id" required />
                    <BaseSelect label="Corredor *" :options="transactionStore.getBrokers" v-model="form.broker_id" required />
                    <BaseSelect label="Proveedor *" :options="transactionStore.getProviders" v-model="form.provider_id" required />
                    <BaseSelect label="Plataforma *" :options="transactionStore.getPlatforms" v-model="form.platform_id" required />
                    <div class="divider col-span-2"></div>
                    <BaseSelect label="Cuenta Origen (Sale) *" :options="transactionStore.getAccounts" v-model="form.from_account_id" required />
                    <BaseSelect label="Cuenta Destino (Entra) *" :options="transactionStore.getAccounts" v-model="form.to_account_id" required />
                </div>
            </div>

            <div v-if="currentStep === 2">
                 <div class="calc-panel">
                    <div class="calc-row">
                        <div class="input-group">
                            <label>Capital Operativo (Sale)</label>
                            <input type="number" v-model="form.amount_sent" placeholder="0.00" class="big-input" />
                        </div>
                        <div class="operator">×</div>
                        <div class="input-group">
                            <label>Tasa de Cambio</label>
                            <input type="number" v-model="form.exchange_rate" placeholder="1.00" class="big-input rate-input" />
                        </div>
                        <div class="operator">=</div>
                        <div class="input-group">
                            <label>Monto Recibido ({{ toAccount?.currency_code }})</label>
                            <input type="number" v-model="form.amount_received" placeholder="0.00" class="big-input readonly" readonly />
                        </div>
                    </div>
                    
                    <div v-if="form.amount_sent > 0" class="total-client-row">
                        <span>Total Recibido (+Comisión):</span>
                        <strong>{{ totalClientPays }} {{ commissionCurrency }}</strong>
                    </div>

                    <p v-if="!hasSufficientBalance" class="error-txt mt-2">
                        ⛔ Saldo insuficiente en {{ fromAccount?.name }}. Disponible: {{ fromAccount?.balance }}
                    </p>
                 </div>

                 <div class="commissions-panel">
                    <h4>Distribución de la Ganancia (Split)</h4>
                    <div class="commissions-grid grid-2">
                        
                        <div class="comm-card income">
                            <label>Comisión Cobrada (100%)</label>
                            <div class="pct-input-wrapper"><input type="number" step="0.01" v-model="form.commission_charged_pct" placeholder="5" /><span>%</span></div>
                            <div class="calc-result text-success">+ {{ form.commission_charged_amount }}</div>
                        </div>

                        <div class="comm-card expense">
                            <label>Participación Corredor (% de Ganancia)</label>
                            <div class="pct-input-wrapper"><input type="number" step="0.01" v-model="form.commission_broker_pct" placeholder="5" /><span>%</span></div>
                            <div class="calc-result text-danger">- {{ form.commission_broker_amount }}</div>
                        </div>

                        <div class="comm-card expense">
                            <label>Participación Proveedor (% de Ganancia)</label>
                            <div class="pct-input-wrapper"><input type="number" step="0.01" v-model="form.commission_provider_pct" placeholder="40" /><span>%</span></div>
                            <div class="calc-result text-danger">- {{ form.commission_provider_amount }}</div>
                        </div>

                        <div class="comm-card expense">
                            <label>Participación Plataforma (% de Ganancia)</label>
                            <div class="pct-input-wrapper"><input type="number" step="0.01" v-model="form.commission_admin_pct" placeholder="0" /><span>%</span></div>
                            <div class="calc-result text-danger">- {{ form.commission_admin_amount }}</div>
                        </div>
                    </div>
                    <div class="total-profit-bar">
                        <span>Utilidad Neta (Lo que sobra):</span>
                        <strong :class="form.commission_net_profit >= 0 ? 'text-success' : 'text-danger'">{{ form.commission_net_profit }} {{ commissionCurrency }}</strong>
                    </div>
                 </div>
            </div>

            <div v-if="currentStep === 3">
                <div class="summary-card">
                    <div class="summary-header"><h3>Resumen Conversión</h3><span class="badge">DIVISA</span></div>
                    <div class="summary-table">
                        <div class="row"><span>Cliente</span><strong>{{transactionStore.getClients.find((c) => c.id == form.client_id)?.name }}</strong></div>
                        <div class="row"><span>Corredor</span><span>{{ transactionStore.getBrokers.find((b) => b.id == form.broker_id)?.user?.name || 'N/A' }}</span></div>
                        <div class="divider"></div>
                        <div class="row"><span>Tasa</span><strong>{{ form.exchange_rate }}</strong></div>
                        <div class="row highlight"><span>Sale ({{ fromAccount?.name }})</span><span class="text-danger">- {{ form.amount_sent }} {{ fromAccount?.currency_code }}</span></div>
                        <div class="row highlight"><span>Entra ({{ toAccount?.name }})</span><span class="text-success">+ {{ form.amount_received }} {{ toAccount?.currency_code }}</span></div>
                        <div class="divider"></div>
                        <div class="row"><span>Total Recibido Cliente</span><strong>{{ totalClientPays }} {{ commissionCurrency }}</strong></div>
                        <div class="row total"><span>Ganancia Neta</span><span :class="form.commission_net_profit >= 0 ? 'text-success' : 'text-danger'">{{ form.commission_net_profit }}</span></div>
                    </div>
                </div>
            </div>
        </div>

        <div v-else class="purchase-view fade-in">
            <div v-if="currentStep === 1">
              <div class="grid-2">
                <BaseSelect label="Cliente *" :options="transactionStore.getClients" v-model="form.client_id" required />
                <BaseSelect label="Corredor (Opcional)" :options="transactionStore.getBrokers" v-model="form.broker_id" />
                <div class="grid-2-nested col-span-2"><BaseSelect label="Proveedor (Liquidez)" :options="transactionStore.getProviders" v-model="form.provider_id" /></div>
                <div class="divider col-span-2"></div>
                <BaseSelect label="Cuenta Origen (Sale Dinero) *" :options="sourceAccounts" v-model="form.from_account_id" required />
                <BaseSelect label="Cuenta Destino (Entra Dinero) *" :options="destinationAccounts" v-model="form.to_account_id" required />
              </div>
            </div>
            <div v-if="currentStep === 2">
              <div class="calc-panel">
                <div class="calc-row">
                  <div class="input-group"><label>Monto Entra ({{ toAccount?.currency_code }})</label><input type="number" v-model="form.amount_received" placeholder="0.00" class="big-input" /></div>
                  <div class="operator">×</div>
                  <div class="rate-inputs-container"><div class="grid-2-rates">
                      <div class="input-group"><label>Tasa Costo *</label><input type="number" v-model="form.buy_rate" placeholder="1.00" class="big-input rate-input" /></div>
                      <div class="input-group"><label>Tasa Venta (Ref) *</label><input type="number" v-model="form.received_rate" placeholder="1.00" class="big-input rate-input" /></div>
                  </div></div>
                  <div class="operator">=</div>
                  <div class="input-group"><label>Monto Sale ({{ fromAccount?.currency_code }})</label><input type="number" v-model="form.amount_sent" placeholder="0.00" class="big-input readonly" readonly /></div>
                </div>
                <p v-if="!hasSufficientBalance" class="error-txt">Saldo insuficiente en {{ fromAccount?.name }}</p>
              </div>
              <div class="commissions-panel">
                <h4>Desglose de Rentabilidad</h4>
                <div class="commissions-grid grid-2">
                  <div class="comm-card income"><label>Comisión Cobrada (%)</label><div class="pct-input-wrapper"><input type="number" v-model="form.commission_charged_pct" placeholder="0" /><span>%</span></div><div class="calc-result text-success">+ {{ form.commission_charged_amount }} {{ commissionCurrency }}</div></div>
                  <div class="comm-card expense"><label>Costo Proveedor (%)</label><div class="pct-input-wrapper"><input type="number" v-model="form.commission_provider_pct" placeholder="0" /><span>%</span></div><div class="calc-result text-danger">- {{ form.commission_provider_amount }} {{ commissionCurrency }}</div></div>
                </div>
                <div class="total-profit-bar"><span>Utilidad Neta:</span><strong :class="form.commission_net_profit >= 0 ? 'text-success' : 'text-danger'">{{ form.commission_net_profit }} {{ commissionCurrency }}</strong></div>
              </div>
            </div>
            <div v-if="currentStep === 3">
              <div class="summary-card">
                <div class="summary-header"><h3>Resumen de Compra</h3><span class="badge">COMPRA</span></div>
                <div class="summary-table">
                  <div class="row"><span>Cliente</span><strong>{{transactionStore.getClients.find((c) => c.id == form.client_id)?.name }}</strong></div>
                  <div class="row" v-if="form.provider_id"><span>Proveedor</span><span>{{ selectedProvider?.name }}</span></div>
                  <div class="divider"></div>
                  <div class="row"><span>Tasa Compra</span><strong>{{ form.buy_rate }}</strong></div>
                  <div class="row"><span>Tasa Referencia</span><strong>{{ form.received_rate }}</strong></div>
                  <div class="divider"></div>
                  <div class="row highlight"><span>Sale ({{ fromAccount?.name }})</span><span class="text-danger">- {{ form.amount_sent }}</span></div>
                  <div class="row highlight"><span>Entra ({{ toAccount?.name }})</span><span class="text-success">+ {{ form.amount_received }}</span></div>
                  <div class="divider"></div>
                  <div class="row total"><span>Ganancia Estimada ({{ commissionCurrency }})</span><span :class="form.commission_net_profit >= 0 ? 'text-success' : 'text-danger'">{{ form.commission_net_profit }}</span></div>
                </div>
              </div>
            </div>
        </div>

      </div>

      <div class="form-footer">
        <button v-if="currentStep > 1" @click="prevStep" class="btn-secondary"><FontAwesomeIcon icon="fa-solid fa-arrow-left" /> Atrás</button>
        <div v-else></div>
        <button v-if="currentStep < totalSteps" @click="nextStep" class="btn-primary">Siguiente <FontAwesomeIcon icon="fa-solid fa-arrow-right" /></button>
        <button v-if="currentStep === totalSteps" @click="handleConfirm" class="btn-success" :disabled="isSubmitting">{{ isSubmitting ? 'Procesando...' : 'Confirmar Operación' }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* GENERAL */
.page-wrapper { max-width: 850px; margin: 0 auto; padding: 20px; color: var(--color-text-light); }
.form-card { background-color: var(--color-secondary); border-radius: 10px; border: 1px solid var(--color-border); overflow: hidden; display: flex; flex-direction: column; min-height: 600px; }
.form-body { padding: 25px; flex-grow: 1; }

/* GRID */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
.grid-2-nested { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.col-span-2 { grid-column: span 2; }
.divider { border-top: 1px solid var(--color-border); margin: 10px 0; width: 100%; }
.progress-bar { height: 3px; background: var(--color-primary); transition: width 0.3s; }

/* HEADER */
.form-header { padding: 20px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; }
.type-switcher { display: flex; background: var(--color-background); padding: 4px; border-radius: 8px; gap: 5px; }
.type-switcher button { background: transparent; border: none; color: #888; padding: 8px 16px; cursor: pointer; font-weight: bold; border-radius: 6px; transition: 0.3s; }
.type-switcher button.active { background: var(--color-primary); color: #111; }

/* FOOTER */
.form-footer { padding: 20px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-border); margin-top: auto; }
.btn-primary, .btn-secondary, .btn-success { padding: 10px 25px; border-radius: 5px; border: none; font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: background 0.2s; }
.btn-primary { background: var(--color-primary); color: #111; }
.btn-success { background: var(--color-success); color: #fff; }
.btn-secondary { background: transparent; border: 1px solid #444; color: #ccc; }
.btn-secondary:hover { background: #2b2f36; }

/* CALCULADORA */
.calc-panel { background: var(--color-background); padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid var(--color-border); }
.calc-row { display: flex; align-items: flex-end; gap: 15px; }
.input-group { flex: 1; display: flex; flex-direction: column; }
.input-group label { font-size: 0.75rem; color: #888; margin-bottom: 4px; text-transform: uppercase; }
.big-input { background: #2b2f36; border: 1px solid var(--color-border); color: white; padding: 12px; font-size: 1.2rem; border-radius: 6px; width: 100%; font-weight: bold; }
.readonly { background: #1e2023; color: var(--color-success); border-color: transparent; }
.operator { font-size: 1.5rem; padding-bottom: 8px; color: #555; }
.error-txt { color: var(--color-danger); margin-top: 5px; font-weight: bold; }
.rate-inputs-container { flex: 2; }
.grid-2-rates { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

/* NUEVO: FILA DE TOTAL CLIENTE */
.total-client-row {
    margin-top: 15px;
    background: #1e2023;
    padding: 12px;
    border-radius: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid var(--color-border);
}
.total-client-row strong {
    font-size: 1.2rem;
    color: #10b981; /* Verde */
}

/* ESTILOS ESPECIFICOS INTERCAMBIO */
.exchange-amounts-card { background: #1f2125; padding: 2rem; border-radius: 12px; text-align: center; border: 1px solid #333; }
.amount-row { margin-bottom: 1rem; text-align: left; }
.amount-row label { display: block; font-weight: bold; margin-bottom: 0.5rem; color: #888; }
.arrow-separator { font-size: 1.5rem; color: #94a3b8; margin: 1rem 0; }
.text-danger { color: #ef4444; }
.text-success { color: #10b981; }
.mb-2 { margin-bottom: 0.5rem; }
.mt-2 { margin-top: 0.5rem; }

/* COMISIONES */
.commissions-panel h4 { margin: 0 0 15px 0; color: var(--color-text-light); font-size: 1rem; border-bottom: 1px dashed var(--color-border); padding-bottom: 10px; }
.commissions-grid { display: grid; gap: 15px; margin-bottom: 20px; }
.comm-card { background: var(--color-background); padding: 15px; border-radius: 8px; border: 1px solid var(--color-border); display: flex; flex-direction: column; }
.comm-card label { font-size: 0.7rem; color: #aaa; margin-bottom: 8px; }
.pct-input-wrapper { display: flex; align-items: center; background: #2b2f36; border-radius: 4px; padding: 0 8px; border: 1px solid #444; }
.pct-input-wrapper input { background: transparent; border: none; color: white; width: 100%; padding: 6px 0; text-align: right; font-weight: bold; }
.calc-result { text-align: right; margin-top: 5px; font-size: 0.9rem; font-weight: 600; color: #ccc; }
.total-profit-bar { background: #2b2f36; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--color-border); }
.total-profit-bar strong { font-size: 1.3rem; }

/* RESUMEN */
.summary-card { background: var(--color-background); padding: 0; border-radius: 8px; border: 1px solid var(--color-border); max-width: 500px; margin: 0 auto; overflow: hidden; }
.summary-header { background: #2b2f36; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; }
.summary-table { padding: 20px; }
.row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.95rem; }
.row.total { font-size: 1.2rem; font-weight: bold; margin-top: 15px; border-top: 1px solid var(--color-border); padding-top: 10px; }
</style>