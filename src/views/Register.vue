<script setup>
import { reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import notify from '@/services/notify'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
    company_name: '',
    admin_name: '',
    admin_email: '',
    password: '',
    password_confirmation: '',
})

const isLoading = ref(false)
const paymentData = ref(null)

const handleRegister = async () => {
    if (!form.company_name || !form.admin_email || !form.password) {
        notify.warning('Todos los campos son obligatorios.')
        return
    }
    if (form.password !== form.password_confirmation) {
        notify.warning('Las contraseñas no coinciden.')
        return
    }

    isLoading.value = true
    try {
        const response = await authStore.register(form)
        paymentData.value = response.data
        notify.success('Registro exitoso. Procede al pago.')
    } catch (error) {
        console.error(error)
    } finally {
        isLoading.value = false
    }
}

const goToLogin = () => router.push({ name: 'login' })
</script>

<template>
    <div class="auth-wrapper">
        <div class="ambient-light gold-light"></div>
        <div class="ambient-light blue-light"></div>

        <div class="auth-content">
            <div class="glass-card">
                <div class="brand-header">
                    <div class="logo-box">T</div>
                    <h1 class="brand-title">Conpay<span class="gold-dot">.</span></h1>
                    <p class="brand-tagline">
                        {{ !paymentData ? 'Crea tu ecosistema multi-tenant' : 'Activación de suscripción' }}
                    </p>
                </div>

                <div class="separator"></div>

                <form v-if="!paymentData" @submit.prevent="handleRegister" class="auth-form">
                    <div class="form-row">
                        <div class="input-group">
                            <label>Nombre de Empresa</label>
                            <div class="input-field">
                                <font-awesome-icon icon="fa-solid fa-building" class="field-icon" />
                                <input v-model="form.company_name" type="text" placeholder="Ej. Kephas Store" />
                            </div>
                        </div>
                        <div class="input-group">
                            <label>Administrador</label>
                            <div class="input-field">
                                <font-awesome-icon icon="fa-solid fa-user-tie" class="field-icon" />
                                <input v-model="form.admin_name" type="text" placeholder="Tu nombre" />
                            </div>
                        </div>
                    </div>

                    <div class="input-group">
                        <label>Correo Electrónico</label>
                        <div class="input-field">
                            <font-awesome-icon icon="fa-solid fa-envelope" class="field-icon" />
                            <input v-model="form.admin_email" type="email" placeholder="admin@empresa.com" />
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="input-group">
                            <label>Contraseña</label>
                            <div class="input-field">
                                <font-awesome-icon icon="fa-solid fa-lock" class="field-icon" />
                                <input v-model="form.password" type="password" placeholder="••••••••" />
                            </div>
                        </div>
                        <div class="input-group">
                            <label>Confirmar</label>
                            <div class="input-field">
                                <font-awesome-icon icon="fa-solid fa-shield-check" class="field-icon" />
                                <input v-model="form.password_confirmation" type="password" placeholder="••••••••" />
                            </div>
                        </div>
                    </div>

                    <button type="submit" class="primary-btn" :disabled="isLoading">
                        <span v-if="isLoading" class="spinner"></span>
                        <span v-else>Registrarse y Pagar 1.00 USDT</span>
                    </button>
                </form>

                <div v-else class="payment-view">
                    <div class="qr-wrapper">
                        <p class="qr-text">Escanea con tu aplicación de <b>Binance</b></p>
                        <div class="qr-border">
                            <img :src="paymentData.payment.qr_code_url" alt="QR Binance Pay" />
                        </div>
                    </div>

                    <div class="action-buttons">
                        <a :href="paymentData.payment.checkout_url" target="_blank" class="binance-link">
                            <font-awesome-icon icon="fa-solid fa-arrow-up-right-from-square" /> Ir a Binance Web
                        </a>
                    </div>

                    <div class="notice-card">
                        <font-awesome-icon icon="fa-solid fa-info-circle" />
                        <p>Tu cuenta se activará automáticamente al confirmarse el pago en la red.</p>
                    </div>
                </div>

                <div class="auth-footer">
                    <p>¿Ya tienes una cuenta activa? <span @click="goToLogin" class="gold-link">Inicia sesión</span></p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Contenedor Principal Estilo Landing */
.auth-wrapper {
    min-height: 100vh;
    background-color: #05070a;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    font-family: 'Inter', sans-serif;
    color: #fff;
}

/* Luces Ambientales */
.ambient-light {
    position: absolute;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    filter: blur(140px);
    opacity: 0.12;
    pointer-events: none;
}
.gold-light { top: -150px; right: -150px; background: #f0b90b; }
.blue-light { bottom: -150px; left: -150px; background: #0062ff; }

/* Tarjeta de Cristal */
.glass-card {
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 28px;
    padding: 45px;
    width: 100%;
    max-width: 580px;
    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.6);
    position: relative;
    z-index: 10;
}

/* Encabezado */
.brand-header { text-align: center; margin-bottom: 30px; }
.logo-box {
    width: 50px; height: 50px; background: #f0b90b; color: #000;
    display: inline-flex; align-items: center; justify-content: center;
    font-weight: 900; border-radius: 12px; font-size: 1.6rem; margin-bottom: 15px;
}
.brand-title { font-size: 2rem; font-weight: 800; margin: 0; letter-spacing: -1px; }
.gold-dot { color: #f0b90b; }
.brand-tagline { color: #848e9c; font-size: 0.95rem; margin-top: 8px; }

.separator { height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); margin: 30px 0; }

/* Formulario */
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.input-group { margin-bottom: 20px; }
.input-group label { display: block; color: #eaecef; font-size: 0.85rem; margin-bottom: 10px; font-weight: 500; }

.input-field {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    display: flex; align-items: center;
    padding: 0 16px; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.input-field:focus-within { border-color: #f0b90b; box-shadow: 0 0 0 1px #f0b90b; background: rgba(0, 0, 0, 0.5); }
.field-icon { color: #f0b90b; font-size: 0.9rem; opacity: 0.8; }

input {
    background: transparent; border: none; color: #fff; padding: 14px;
    width: 100%; outline: none; font-size: 0.95rem;
}

/* Botón Principal */
.primary-btn {
    background: #f0b90b; color: #000; border: none; padding: 16px;
    border-radius: 14px; font-weight: 700; cursor: pointer;
    transition: 0.3s; margin-top: 15px; width: 100%; font-size: 1rem;
}
.primary-btn:hover:not(:disabled) { background: #ffc424; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(240, 185, 11, 0.2); }
.primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* Binance Payment View */
.payment-view { text-align: center; animation: slideUp 0.4s ease-out; }
.qr-border {
    background: #fff; padding: 15px; border-radius: 20px;
    display: inline-block; margin: 20px 0; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}
.qr-border img { width: 200px; height: 200px; display: block; }
.qr-text { color: #848e9c; font-size: 0.9rem; }

.binance-link {
    display: inline-flex; align-items: center; gap: 8px;
    color: #f0b90b; text-decoration: none; font-weight: 600;
    margin-bottom: 25px; padding: 10px 20px; border-radius: 10px;
    background: rgba(240, 185, 11, 0.05); transition: 0.3s;
}
.binance-link:hover { background: rgba(240, 185, 11, 0.1); }

.notice-card {
    background: rgba(240, 185, 11, 0.08); border: 1px solid rgba(240, 185, 11, 0.2);
    padding: 15px; border-radius: 12px; color: #f0b90b; font-size: 0.85rem;
    display: flex; align-items: center; gap: 12px; line-height: 1.4;
}

.auth-footer { text-align: center; margin-top: 35px; color: #848e9c; font-size: 0.95rem; }
.gold-link { color: #f0b90b; font-weight: 600; cursor: pointer; transition: 0.2s; }
.gold-link:hover { text-decoration: underline; }

@keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.spinner {
    width: 20px; height: 20px; border: 3px solid rgba(0,0,0,0.1);
    border-top-color: #000; border-radius: 50%; display: inline-block;
    animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Adaptabilidad móvil */
@media (max-width: 600px) {
    .form-row { grid-template-columns: 1fr; gap: 0; }
    .glass-card { padding: 30px 20px; }
}
</style>