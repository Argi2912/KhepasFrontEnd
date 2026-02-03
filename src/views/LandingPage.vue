<script setup>
import { useRouter } from 'vue-router'
// Asegúrate de tener fontawesome instalado, o usa iconos SVG directos si prefieres
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const router = useRouter()
const goToLogin = () => router.push({ name: 'login' })
const goToRegister = () => router.push({ name: 'register' })

const features = [
    { icon: 'fa-solid fa-bolt', title: 'Motor Ultra Rápido', desc: 'Ejecución de cambios y validación de saldos en milisegundos.' },
    { icon: 'fa-solid fa-coins', title: 'Multi-Divisa Real', desc: 'Manejo nativo de USD, USDT, VES y más en una sola billetera.' },
    { icon: 'fa-solid fa-chart-line', title: 'Ledger Automático', desc: 'Olvídate de la contabilidad manual. Cada centavo queda registrado.' },
    { icon: 'fa-solid fa-lock', title: 'Seguridad Blindada', desc: 'Encriptación de grado bancario y auditoría de acciones por usuario.' }
]
</script>

<template>
    <div class="landing-page">

        <div class="ambient-light gold-light"></div>
        <div class="ambient-light blue-light"></div>

        <nav class="glass-nav">
            <div class="brand">
                <div class="logo-box">T</div>
                <span>Conpay<span class="gold-text"></span></span>
            </div>
            <div class="nav-links">
                <button @click="goToLogin" class="btn-text">Ingresar</button>
                <button @click="goToRegister" class="btn-gold">Comenzar</button>
            </div>
        </nav>

        <header class="hero-section">
            <div class="hero-content">
                <div class="pill-badge">
                    <span class="dot-pulse"></span> Nueva Versión 2.0 Disponible
                </div>

                <h1 class="main-title">
                    El Sistema Operativo para <br />
                    <span class="gradient-text">Operadores Financieros</span>
                </h1>

                <p class="subtitle">
                    Deja de luchar con Excel. Centraliza tu tesorería, cambios y deuda en una plataforma diseñada para
                    escalar tu negocio de cambio.
                </p>

                <div class="cta-group">
                    <button @click="goToRegister" class="btn-gold btn-lg glow-effect">
                        Crear Cuenta Gratis
                    </button>
                    <button class="btn-glass btn-lg">
                        <FontAwesomeIcon icon="fa-solid fa-play" /> Ver Demo
                    </button>
                </div>

                <div class="stats-pills">
                    <div class="pill">🔒 +99.9% Uptime</div>
                    <div class="pill">⚡ Tiempo Real</div>
                    <div class="pill">🛡️ Auditoría Total</div>
                </div>
            </div>

            <div class="hero-visual">
                <div class="glass-card float-animation">
                    <div class="card-top">
                        <div class="card-dots">
                            <span></span><span></span><span></span>
                        </div>
                        <div class="card-tag">LIVE</div>
                    </div>

                    <div class="balance-area">
                        <label>Balance Total Estimado</label>
                        <div class="amount">$452,104.50 <span class="currency">USD</span></div>
                        <div class="change positive">▲ +2.4% hoy</div>
                    </div>

                    <div class="mini-chart">
                        <div class="bar" style="height: 40%"></div>
                        <div class="bar" style="height: 70%"></div>
                        <div class="bar" style="height: 50%"></div>
                        <div class="bar active" style="height: 100%"></div>
                        <div class="bar" style="height: 60%"></div>
                        <div class="bar" style="height: 80%"></div>
                    </div>
                </div>

                <div class="decorative-circle"></div>
            </div>
        </header>

        <section class="features-section">
            <h2 class="section-title">Potencia sin complicaciones</h2>
            <div class="grid-cards">
                <div v-for="(item, i) in features" :key="i" class="feature-card">
                    <div class="icon-glow">
                        <FontAwesomeIcon :icon="item.icon" />
                    </div>
                    <h3>{{ item.title }}</h3>
                    <p>{{ item.desc }}</p>
                </div>
            </div>
        </section>

        <footer class="simple-footer">
            <p>&copy; 2026 TuConpay Financial Services.</p>
        </footer>

    </div>
</template>

<style scoped>
/* =========================================
   VARIABLES Y RESET
   ========================================= */
.landing-page {
    --gold: #f0b90b;
    --gold-glow: rgba(240, 185, 11, 0.4);
    --dark-bg: #0b0e11;
    --card-bg: rgba(30, 32, 38, 0.7);
    --text-main: #ffffff;
    --text-muted: #848e9c;

    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background-color: var(--dark-bg);
    color: var(--text-main);
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
}

/* =========================================
   FONDO AMBIENTAL (LUCES)
   ========================================= */
.ambient-light {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    opacity: 0.15;
    z-index: 0;
    pointer-events: none;
}

.gold-light {
    top: -100px;
    right: -100px;
    width: 500px;
    height: 500px;
    background: var(--gold);
}

.blue-light {
    bottom: 0;
    left: -200px;
    width: 600px;
    height: 600px;
    background: #1e88e5;
    opacity: 0.08;
}

/* =========================================
   NAVBAR (GLASSMORPHISM)
   ========================================= */
.glass-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: rgba(11, 14, 17, 0.8);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    z-index: 100;
}

.brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 700;
    font-size: 1.25rem;
}

.logo-box {
    width: 36px;
    height: 36px;
    background: var(--gold);
    color: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    box-shadow: 0 0 15px var(--gold-glow);
}

.gold-text {
    color: var(--gold);
}

.nav-links {
    display: flex;
    gap: 1rem;
    align-items: center;
}

/* =========================================
   BOTONES
   ========================================= */
button {
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
    font-family: inherit;
}

.btn-text {
    background: none;
    color: var(--text-muted);
    font-weight: 500;
    font-size: 0.95rem;
}

.btn-text:hover {
    color: #fff;
}

.btn-gold {
    background: linear-gradient(135deg, #f0b90b 0%, #d9a50a 100%);
    color: #000;
    font-weight: 700;
    padding: 0.6rem 1.5rem;
    border-radius: 50px;
    box-shadow: 0 4px 15px rgba(240, 185, 11, 0.3);
}

.btn-gold:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(240, 185, 11, 0.5);
}

.btn-lg {
    padding: 1rem 2.5rem;
    font-size: 1.1rem;
}

.btn-glass {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
    border-radius: 50px;
    padding: 1rem 2rem;
    font-weight: 600;
}

.btn-glass:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: #fff;
}

.glow-effect {
    position: relative;
    overflow: hidden;
}

.glow-effect::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 60%);
    transform: scale(0);
    opacity: 0;
    transition: 0.5s;
}

.glow-effect:hover::after {
    transform: scale(1);
    opacity: 1;
    transition: 0s;
}

/* =========================================
   HERO SECTION
   ========================================= */
.hero-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    min-height: 100vh;
    padding: 8rem 5% 4rem;
    position: relative;
    z-index: 10;
}

.pill-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(240, 185, 11, 0.1);
    color: var(--gold);
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    border: 1px solid rgba(240, 185, 11, 0.2);
}

.dot-pulse {
    width: 8px;
    height: 8px;
    background: var(--gold);
    border-radius: 50%;
    box-shadow: 0 0 0 0 rgba(240, 185, 11, 0.7);
    animation: pulse-gold 2s infinite;
}

.main-title {
    font-size: 4rem;
    line-height: 1.1;
    font-weight: 800;
    margin-bottom: 1.5rem;
    letter-spacing: -1px;
}

.gradient-text {
    background: linear-gradient(90deg, #ffffff 0%, #f0b90b 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.subtitle {
    font-size: 1.2rem;
    color: var(--text-muted);
    max-width: 500px;
    line-height: 1.6;
    margin-bottom: 2.5rem;
}

.cta-group {
    display: flex;
    gap: 1rem;
    margin-bottom: 3rem;
}

.stats-pills {
    display: flex;
    gap: 1.5rem;
}

.pill {
    color: var(--text-muted);
    font-size: 0.9rem;
    font-weight: 500;
}

/* =========================================
   VISUAL 3D (TARJETA)
   ========================================= */
.hero-visual {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    perspective: 1000px;
}

.glass-card {
    width: 380px;
    background: rgba(22, 26, 30, 0.6);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    padding: 2rem;
    position: relative;
    z-index: 2;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    transform: rotateY(-10deg) rotateX(5deg);
    transition: transform 0.5s ease;
}

.glass-card:hover {
    transform: rotateY(0) rotateX(0) scale(1.02);
}

.card-top {
    display: flex;
    justify-content: space-between;
    margin-bottom: 2rem;
}

.card-dots {
    display: flex;
    gap: 6px;
}

.card-dots span {
    width: 10px;
    height: 10px;
    background: #333;
    border-radius: 50%;
}

.card-tag {
    background: rgba(0, 255, 136, 0.1);
    color: #00ff88;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: bold;
}

.balance-area label {
    display: block;
    font-size: 0.85rem;
    color: var(--text-muted);
    margin-bottom: 0.5rem;
}

.amount {
    font-size: 2.2rem;
    font-weight: 700;
    color: #fff;
    margin-bottom: 0.5rem;
}

.currency {
    font-size: 1rem;
    color: var(--gold);
}

.change {
    font-size: 0.9rem;
    color: #00ff88;
    font-weight: 600;
}

.mini-chart {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    height: 60px;
    margin-top: 2rem;
}

.bar {
    width: 12%;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    transition: 0.3s;
}

.bar:hover,
.bar.active {
    background: var(--gold);
    box-shadow: 0 0 10px var(--gold-glow);
}

.decorative-circle {
    position: absolute;
    width: 300px;
    height: 300px;
    border: 1px solid rgba(240, 185, 11, 0.1);
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
    animation: spin 20s linear infinite;
}

.decorative-circle::before {
    content: '';
    position: absolute;
    top: -5px;
    left: 50%;
    width: 10px;
    height: 10px;
    background: var(--gold);
    border-radius: 50%;
    box-shadow: 0 0 10px var(--gold);
}

/* =========================================
   FEATURES SECTION
   ========================================= */
.features-section {
    padding: 5rem 5%;
    background: linear-gradient(to bottom, var(--dark-bg), #000);
}

.section-title {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 4rem;
    font-weight: 700;
}

.grid-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 2rem;
}

.feature-card {
    background: var(--card-bg);
    padding: 2.5rem 2rem;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: 0.3s;
    position: relative;
    overflow: hidden;
}

.feature-card:hover {
    transform: translateY(-10px);
    border-color: rgba(240, 185, 11, 0.3);
    background: rgba(30, 32, 38, 0.9);
}

.icon-glow {
    font-size: 2rem;
    color: var(--gold);
    margin-bottom: 1.5rem;
    width: 60px;
    height: 60px;
    background: rgba(240, 185, 11, 0.1);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.feature-card h3 {
    font-size: 1.25rem;
    margin-bottom: 0.8rem;
    font-weight: 600;
}

.feature-card p {
    color: var(--text-muted);
    line-height: 1.6;
    font-size: 0.95rem;
}

/* =========================================
   FOOTER
   ========================================= */
.simple-footer {
    text-align: center;
    padding: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    color: var(--text-muted);
    font-size: 0.9rem;
}

/* =========================================
   ANIMACIONES
   ========================================= */
@keyframes pulse-gold {
    0% {
        box-shadow: 0 0 0 0 rgba(240, 185, 11, 0.4);
    }

    70% {
        box-shadow: 0 0 0 10px rgba(240, 185, 11, 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(240, 185, 11, 0);
    }
}

@keyframes spin {
    100% {
        transform: translate(-50%, -50%) rotate(360deg);
    }
}

@keyframes float {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-15px);
    }
}

.float-animation {
    animation: float 6s ease-in-out infinite;
}

/* =========================================
   RESPONSIVE
   ========================================= */
@media (max-width: 992px) {
    .hero-section {
        grid-template-columns: 1fr;
        text-align: center;
        padding-top: 7rem;
    }

    .hero-visual {
        margin-top: 4rem;
    }

    .cta-group {
        justify-content: center;
    }

    .stats-pills {
        justify-content: center;
    }

    .subtitle {
        margin: 0 auto 2.5rem;
    }

    .main-title {
        font-size: 3rem;
    }
}
</style>