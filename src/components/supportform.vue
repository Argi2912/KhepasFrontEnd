<template>
    <div class="support-container">
        <button @click="isOpen = !isOpen" class="support-trigger" :class="{ 'active': isOpen }">
            <span v-if="!isOpen">¿Soporte?</span>
            <span v-else>✕</span>
        </button>

        <Transition name="fade-slide">
            <div v-if="isOpen" class="support-card">
                <div class="card-header">
                    <h3>Soporte WhatsApp</h3>
                    <p>Identificación automática activa</p>
                </div>

                <form @submit.prevent="handleWhatsApp" class="card-body">
                    <div class="input-group">
                        <label>Asunto</label>
                        <input v-model="form.subject" placeholder="Ej: Error en reporte" required />
                    </div>
                    <div class="input-group">
                        <label>Mensaje</label>
                        <textarea v-model="form.message" placeholder="Describe el problema..." required></textarea>
                    </div>
                    <button type="submit" class="btn-whatsapp">
                        Enviar por WhatsApp
                    </button>
                </form>
            </div>
        </Transition>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const isOpen = ref(false)
const form = ref({ subject: '', message: '' })

const handleWhatsApp = () => {
    const phone = "584120212878" // 👈 TU NÚMERO AQUÍ

    // 1. Intentamos obtener los datos del usuario desde el localStorage
    // Generalmente guardas el objeto 'user' completo al hacer login
    const userData = JSON.parse(localStorage.getItem('user') || '{}');

    const userName = userData.name || 'Invitado/No logueado';
    const tenantId = userData.tenant_id || 'N/A';
    const userEmail = userData.email || 'N/A';

    // 2. Construimos el mensaje con formato de WhatsApp (negritas con asteriscos)
    const text =
        `*NUEVO TICKET DE SOPORTE*%0A` +
        `------------------------------%0A` +
        `👤 *Usuario:* ${userName}%0A` +
        `🏢 *Empresa ID:* ${tenantId}%0A` +
        `📧 *Correo:* ${userEmail}%0A` +
        `------------------------------%0A` +
        `❓ *Asunto:* ${form.value.subject}%0A` +
        `📝 *Mensaje:* ${form.value.message}%0A` +
        `------------------------------%0A` +
        `_Enviado desde el Sistema TuConpay_`;

    const url = `https://wa.me/${phone}?text=${text}`;

    window.open(url, '_blank');

    form.value = { subject: '', message: '' };
    isOpen.value = false;
}
</script>

<style scoped>
/* Estilos iguales a los anteriores pero asegurando la posición superior */
.support-container {
    position: fixed;
    top: 70px;
    right: 20px;
    z-index: 9999;
    font-family: sans-serif;
}

.support-trigger {
    background: #25d366;
    color: white;
    border: none;
    padding: 8px 18px;
    border-radius: 50px;
    font-weight: bold;
    font-size: 13px;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.support-trigger.active {
    background: #333;
}

.support-card {
    position: absolute;
    top: 50px;
    right: 0;
    width: 280px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    border: 1px solid #f0f0f0;
    overflow: hidden;
}

.card-header {
    background: #25d366;
    padding: 12px;
    color: white;
    text-align: center;
}

.card-header h3 {
    margin: 0;
    font-size: 15px;
}

.card-header p {
    margin: 3px 0 0;
    font-size: 10px;
    opacity: 0.9;
}

.card-body {
    padding: 15px;
}

.input-group {
    margin-bottom: 12px;
}

.input-group label {
    display: block;
    font-size: 10px;
    text-transform: uppercase;
    color: #888;
    margin-bottom: 4px;
    font-weight: bold;
}

.input-group input,
.input-group textarea {
    width: 100%;
    border: 1px solid #eee;
    background: #fafafa;
    border-radius: 6px;
    padding: 10px;
    font-size: 13px;
    outline: none;
}

.btn-whatsapp {
    width: 100%;
    background: #25d366;
    color: white;
    border: none;
    padding: 10px;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}
</style>