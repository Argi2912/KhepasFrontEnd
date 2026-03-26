<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';
import notify from '@/services/notify';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { useRouter } from 'vue-router';
import PayPalButton from '@/components/shared/PayPalButton.vue';

const router = useRouter();
const authStore = useAuthStore();
const isLoading = ref(false);

const tenantName = computed(() => authStore.user?.tenant?.name || 'Tu Organización');
const planPrice = computed(() => authStore.user?.tenant?.plan_price || '0.00');
const planName = computed(() => authStore.user?.tenant?.plan_name || 'Plan Actual');

// Normaliza el plan_name del tenant al ID que el backend espera ("normal" o "pro")
const normalizedPlanId = computed(() => {
    const raw = (authStore.user?.tenant?.plan_name || '').toLowerCase();
    const price = parseFloat(authStore.user?.tenant?.plan_price || 0);
    if (raw === 'pro' || raw === 'normal') return raw;
    if (raw.includes('profesional') || raw.includes('pro') || price >= 300) return 'pro';
    return 'normal';
});

// --- Lógica de Pago (PayPal) ---
const handlePaymentSuccess = async () => {
    notify.success('¡Suscripción reactivada con éxito!');

    // Forzar is_active = true en el estado local del usuario
    // El pago ya fue validado por el backend en capture-order, solo falta reflejarlo en el frontend
    if (authStore.user?.tenant) {
        authStore.user.tenant.is_active = true;
    }

    // Refrescar datos del usuario en segundo plano (sin bloquear la navegación)
    authStore.fetchUser().catch(() => {});

    // Navegar al dashboard — el router guard verá is_active = true
    router.push({ name: 'dashboard' });
};

const logout = () => {
    authStore.logout();
    router.push({ name: 'login' });
};
</script>

<template>
    <div class="auth-container">
        <div class="auth-card">

            <div class="status-icon">
                <font-awesome-icon icon="circle-exclamation" class="text-red-500 text-6xl mb-4" />
            </div>

            <div class="auth-header">
                <h2 class="text-red-500">Suscripción Vencida</h2>
                <p>Tu acceso ha sido restringido temporalmente.</p>
            </div>

            <div class="debt-summary">
                <div class="debt-row">
                    <span>Organización:</span>
                    <strong class="text-white">{{ tenantName }}</strong>
                </div>
                <div class="debt-row">
                    <span>Plan Contratado:</span>
                    <strong class="text-yellow-400">{{ planName }}</strong>
                </div>
                <div class="debt-total">
                    <span>Total a Pagar:</span>
                    <h1>${{ planPrice }} <span class="currency">USD</span></h1>
                </div>
            </div>

            <div class="payment-methods">
                <label class="section-title">Método de Pago</label>
                <div class="method-options">
                    <label class="method-btn selected">
                        <input type="radio" checked />
                        <font-awesome-icon :icon="['fab', 'paypal']" /> PayPal
                    </label>


                </div>
            </div>

            <PayPalButton 
                v-if="planPrice > 0"
                :amount="planPrice"
                :planId="normalizedPlanId"
                :description="`Reactivación Suscripción - ${tenantName}`"
                @success="handlePaymentSuccess"
            />
            <button v-else @click="handlePaymentSuccess" class="btn-primary">
                Reactivar Gratis
            </button>

            <div class="auth-footer">
                <a @click="logout" class="text-gray-500 hover:text-white transition-colors">
                    <font-awesome-icon icon="sign-out-alt" /> Cerrar Sesión
                </a>
            </div>

        </div>
    </div>
</template>

<style scoped>
/* REUTILIZANDO TUS ESTILOS EXACTOS DE REGISTER.VUE */



.auth-card {
    background: #181a20;
    padding: 40px 30px;
    border-radius: 16px;
    width: 100%;
    max-width: 500px;
    text-align: center;
    /* Centramos textos por defecto */
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.auth-header h2 {
    font-size: 1.8rem;
    margin-bottom: 10px;
    font-weight: bold;
}

.auth-header .text-red-500 {
    color: #ef4444;
    /* Rojo alerta */
}

.auth-header p {
    color: #848e9c;
    margin-bottom: 30px;
}

.status-icon {
    margin-bottom: 20px;
}

/* CAJA DE RESUMEN DE DEUDA */
.debt-summary {
    background: #1e2329;
    border: 1px solid #2b3139;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 30px;
    text-align: left;
}

.debt-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 0.95rem;
    color: #848e9c;
}

.debt-total {
    border-top: 1px solid #2b3139;
    margin-top: 15px;
    padding-top: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.debt-total span {
    color: #848e9c;
    font-size: 0.9rem;
}

.debt-total h1 {
    color: #f0b90b;
    /* Amarillo Binance */
    font-size: 1.8rem;
    font-weight: bold;
    margin: 0;
}

.debt-total .currency {
    font-size: 1rem;
    color: #848e9c;
    font-weight: normal;
}

/* MÉTODOS DE PAGO (Tus estilos) */
.section-title {
    display: block;
    margin-bottom: 10px;
    font-weight: 600;
    color: #848e9c;
    text-align: left;
    font-size: 0.9rem;
}

.method-options {
    display: flex;
    gap: 10px;
    margin-bottom: 30px;
}

.method-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: #2b3139;
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: 0.3s;
    font-size: 0.9rem;
    border: 1px solid transparent;
    color: #848e9c;
}

.method-btn.selected {
    border-color: #f0b90b;
    color: #f0b90b;
    background: rgba(240, 185, 11, 0.1);
}

.btn-primary {
    width: 100%;
    padding: 15px;
    background: #f0b90b;
    color: black;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.3s;
}

.btn-primary:hover {
    background: #d4a409;
}

.btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.auth-footer {
    margin-top: 25px;
    font-size: 0.9rem;
}

.auth-footer a {
    cursor: pointer;
}
</style>