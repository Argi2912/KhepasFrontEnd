<script setup>
import { ref, reactive, nextTick } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import api from '@/services/api'

const isOpen = ref(false)
const isSending = ref(false)
const message = ref('')
const contactInfo = ref('')
const chatHistory = ref([]) // In-memory only

const toggleChat = () => {
    isOpen.value = !isOpen.value
}

const sendMessage = async () => {
    if (!message.value.trim()) return

    isSending.value = true
    const userMsg = message.value
    message.value = ''
    
    // Add to local history (in-memory)
    chatHistory.value.push({ role: 'user', text: userMsg })

    try {
        // Enviar al backend (endpoint de invitado por crear/verificar)
        await api.post('/support/guest', {
            body: userMsg,
            contact_info: contactInfo.value,
            subject: 'Consulta desde Landing Page'
        })

        chatHistory.value.push({ 
            role: 'bot', 
            text: '¡Gracias por contactarnos! Un agente revisará tu mensaje y te contactará si proporcionaste datos de contacto. Esta conversación se borrará al cerrar la pestaña.' 
        })
    } catch (error) {
        chatHistory.value.push({ 
            role: 'bot', 
            text: 'Lo sentimos, hubo un error al enviar el mensaje. Inténtalo de nuevo más tarde.' 
        })
    } finally {
        isSending.value = false
    }
}

defineExpose({
    toggleChat,
    openChat: () => isOpen.value = true
})
</script>

<template>
    <div class="guest-support-widget">
        <!-- Chat Window -->
        <transition name="fade-slide">
            <div v-if="isOpen" class="chat-window glass-card">
                <div class="chat-header">
                    <div class="status-dot"></div>
                    <h3>Soporte TuConpay</h3>
                    <button @click="toggleChat" class="close-btn">
                        <FontAwesomeIcon :icon="['fas', 'times']" />
                    </button>
                </div>

                <div class="chat-messages" ref="messageContainer">
                    <div class="welcome-msg">
                        ¿Cómo podemos ayudarte hoy?
                        <p class="privacy-note">Esta sesión es privada y no se guarda historial.</p>
                    </div>

                    <div v-for="(msg, idx) in chatHistory" :key="idx" 
                         :class="['msg-bubble', msg.role]">
                        {{ msg.text }}
                    </div>
                </div>

                <div class="chat-input-area">
                    <input v-model="contactInfo" 
                           type="text" 
                           placeholder="Tu email o teléfono (opcional)" 
                           class="contact-input" />
                    <div class="input-row">
                        <textarea v-model="message" 
                                  @keydown.enter.prevent="sendMessage"
                                  placeholder="Escribe tu mensaje..."
                                  rows="1"></textarea>
                        <button @click="sendMessage" :disabled="isSending || !message.trim()">
                            <FontAwesomeIcon v-if="!isSending" :icon="['fas', 'paper-plane']" />
                            <span v-else class="loader"></span>
                        </button>
                    </div>
                </div>
            </div>
        </transition>

        <!-- Floating Button -->
        <button @click="toggleChat" :class="['floating-btn', { active: isOpen }]">
            <FontAwesomeIcon v-if="!isOpen" :icon="['fas', 'headset']" />
            <FontAwesomeIcon v-else :icon="['fas', 'chevron-down']" />
        </button>
    </div>
</template>

<style scoped>
.guest-support-widget {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 9999;
    font-family: inherit;
}

.floating-btn {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f0b90b 0%, #d9a50a 100%);
    color: #000;
    border: none;
    box-shadow: 0 10px 25px rgba(240, 185, 11, 0.4);
    cursor: pointer;
    font-size: 1.5rem;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    display: flex;
    align-items: center;
    justify-content: center;
}

.floating-btn:hover {
    transform: scale(1.1) rotate(5deg);
}

.floating-btn.active {
    background: #1e2329;
    color: #fff;
    transform: rotate(0deg);
}

.chat-window {
    position: absolute;
    bottom: 80px;
    right: 0;
    width: 350px;
    height: 500px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    border: 1px solid rgba(255,255,255,0.1);
}

.glass-card {
    background: rgba(18, 22, 28, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 20px;
}

.chat-header {
    padding: 1.25rem;
    background: rgba(255,255,255,0.03);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    display: flex;
    align-items: center;
    gap: 10px;
}

.status-dot {
    width: 8px;
    height: 8px;
    background: #00ff88;
    border-radius: 50%;
    box-shadow: 0 0 10px #00ff88;
}

.chat-header h3 {
    margin: 0;
    font-size: 1rem;
    flex: 1;
    color: #fff;
}

.close-btn {
    background: none;
    border: none;
    color: #848e9c;
    cursor: pointer;
}

.chat-messages {
    flex: 1;
    padding: 1.25rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.welcome-msg {
    text-align: center;
    color: #fff;
    font-size: 0.9rem;
    margin-bottom: 1rem;
    padding: 1rem;
    background: rgba(240, 185, 11, 0.05);
    border-radius: 12px;
}

.privacy-note {
    font-size: 0.75rem;
    color: #848e9c;
    margin-top: 5px;
}

.msg-bubble {
    max-width: 85%;
    padding: 0.75rem 1rem;
    border-radius: 15px;
    font-size: 0.9rem;
    line-height: 1.4;
}

.msg-bubble.user {
    align-self: flex-end;
    background: var(--gold, #f0b90b);
    color: #000;
    border-bottom-right-radius: 2px;
}

.msg-bubble.bot {
    align-self: flex-start;
    background: rgba(255,255,255,0.07);
    color: #fff;
    border-bottom-left-radius: 2px;
}

.chat-input-area {
    padding: 1.25rem;
    background: rgba(255,255,255,0.02);
    border-top: 1px solid rgba(255,255,255,0.05);
}

.contact-input {
    width: 100%;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    color: #fff;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 0.8rem;
    margin-bottom: 10px;
}

.input-row {
    display: flex;
    gap: 10px;
    align-items: flex-end;
}

textarea {
    flex: 1;
    background: none;
    border: none;
    color: #fff;
    resize: none;
    padding: 5px 0;
    font-size: 0.95rem;
    outline: none;
}

.input-row button {
    background: var(--gold, #f0b90b);
    color: #000;
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.input-row button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Animations */
.fade-slide-enter-active, .fade-slide-leave-active {
    transition: all 0.3s ease;
}
.fade-slide-enter-from, .fade-slide-leave-to {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
}

.loader {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(0,0,0,0.1);
    border-top-color: #000;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

@media (max-width: 480px) {
    .chat-window {
        width: calc(100vw - 4rem);
        height: 60vh;
    }
}
</style>
