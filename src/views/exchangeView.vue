<template>
    <div class="exchange-container">
        <h2 class="title">Tasa De Cambio</h2>

        <div class="btn-container">
            <button class="btn-agregar" @click="abrirModal()">Nueva tasa de cambio</button>
        </div>

        <div class="tabla-container">
            <table class="tabla">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>valor</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="exchange in exchangeStore.exchangeRates" :key="exchange.id">
                        <td>{{ exchange.id }}</td>
                        <td>{{ exchange.name }}</td>
                        <td>{{ exchange.value }}</td>
                        <td>
                            <button class="btn-accion editar" @click="abrirModal(exchange)">Editar</button>
                            <button class="btn-accion eliminar" @click="eliminar(exchange.id)">Eliminar</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-if="mostrarModal" class="overlay" @click.self="cerrarModal">
            <div class="modal-contenido neon-card">
                <div class="modal-header">
                    <h3>{{ modoEdicion ? 'Editar Tasa' : 'Nueva Tasa' }}</h3>
                    <button class="btn-cerrar" @click="cerrarModal">×</button>
                </div>

                <div class="modal-body">
                    <label class="form-label">Nombre:</label>
                    <input v-model="form.name" type="text" class="input-field" placeholder="Ej: Dólar" />
                    <label class="form-label">valor:</label>
                    <input v-model="form.value" type="text" class="input-field" placeholder="Ej: USD" />
                </div>

                <div class="modal-footer">
                    <button class="btn-guardar" @click="guardar()">
                        {{ modoEdicion ? 'Actualizar' : 'Guardar' }}
                    </button>
                    <button class="btn-cancelar" @click="cerrarModal">Cancelar</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useexchangeStore } from '../stores/exchangeStore'
import { Notyf } from 'notyf' 

const exchangeStore = useexchangeStore()
const mostrarModal = ref(false)
const modoEdicion = ref(false)

const form = ref({
    id: null,
    name: '',
    value: ''
})

// Al montar, cargar la lista
onMounted(() => {
    exchangeStore.fetchList()
})

function abrirModal(exchange = null) {
    modoEdicion.value = !!exchange
    // CORRECCIÓN 2: Usar exchange.value en lugar de currency.value
    form.value = exchange
        ? { id: exchange.id, name: exchange.name, value: exchange.value }
        : { id: null, name: '', value: ''  }
    mostrarModal.value = true
}

function cerrarModal() {
    mostrarModal.value = false
    form.value = { id: null, name: '',value: '' }
}

async function guardar() {
    if (!form.value.name || !form.value.value) {
        alert('⚠️ Debes completar todos los campos.')
        return
    }

    try {
        if (modoEdicion.value) {
            await exchangeStore.update(form.value)
        } else {
            await exchangeStore.create(form.value)
        }
        cerrarModal()
    } catch (err) {
        console.error(err)
    }
}

async function eliminar(id) {
    if (confirm('¿Seguro que deseas eliminar esta moneda?')) {
        try {
            await exchangeStore.delete(id)
        } catch (err) {
            console.error(err)
        }
    }
}
</script>

<style scoped>
/* ==== Contenedor principal ==== */
.exchange-container {
    padding: 30px;
    background: linear-gradient(180deg, #1b263b, #4c98e9);
    min-height: 100vh;
    color: #fff;
}

/* ==== Título ==== */
.title {
    text-align: center;
    color: #00bfff;
    margin-bottom: 20px;
    text-shadow: 0 0 10px #0096ff;
}

/* ==== Botón de agregar ==== */
.btn-container {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 15px;
}

.btn-agregar {
    background: #0096ff;
    color: #fff;
    border: none;
    border-radius: 25px;
    padding: 10px 25px;
    cursor: pointer;
    box-shadow: 0 0 15px rgba(0, 150, 255, 0.6);
    transition: all 0.3s ease;
}

.btn-agregar:hover {
    background: #00bfff;
    box-shadow: 0 0 25px rgba(0, 150, 255, 1);
}

/* ==== Tabla ==== */
.tabla-container {
    overflow-x: auto;
}

.tabla {
    width: 100%;
    border-collapse: collapse;
    background-color: #000814;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 150, 255, 0.3);
}

.tabla th,
.tabla td {
    padding: 12px;
    text-align: center;
    border-bottom: 1px solid #1e2a3a;
}

.tabla th {
    background-color: #0096ff;
    color: #fff;
}

.tabla tr:hover {
    background-color: #001d3d;
}

/* ==== Botones de acción ==== */
.btn-accion {
    border: 1px solid #0096ff;
    border-radius: 20px;
    padding: 8px 16px;
    cursor: pointer;
    color: #0096ff;
    background-color: transparent;
    transition: all 0.3s ease;
    margin: 0 5px;
}

.btn-accion:hover {
    background-color: #0096ff;
    color: white;
}

.btn-accion.eliminar {
    border-color: #ff4d4d;
    color: #ff4d4d;
}

.btn-accion.eliminar:hover {
    background-color: #ff4d4d;
    color: white;
}

/* ==== Modal ==== */
.overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(10, 17, 32, 0.95);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1050;
    padding: 30px;
}

.modal-contenido {
    background-color: #0d1b2a;
    border: 2px solid #0096ff;
    border-radius: 20px;
    padding: 30px 40px;
    width: 85%;
    max-width: 600px;
    box-shadow: 0 0 40px rgba(0, 150, 255, 0.7);
    animation: aparecer 0.3s ease;
    color: #ffffff;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(0, 150, 255, 0.3);
    margin-bottom: 15px;
}

.btn-cerrar {
    background: transparent;
    border: none;
    color: #0096ff;
    font-size: 24px;
    cursor: pointer;
}

/* ==== Inputs ==== */
.input-field {
    width: 100%;
    padding: 10px;
    border-radius: 12px;
    border: 1px solid #0096ff;
    background: #001d3d;
    color: #ffffff;
    margin-bottom: 15px;
}

/* ==== Footer del modal ==== */
.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
}

.btn-guardar {
    background-color: #0096ff;
    color: white;
    border: none;
    border-radius: 25px;
    padding: 10px 20px;
    cursor: pointer;
    box-shadow: 0 0 10px #0096ff;
}

.btn-guardar:hover {
    background-color: #00bfff;
}

.btn-cancelar {
    background: transparent;
    color: #ccc;
    border-radius: 25px;
    padding: 10px 20px;
    border: 1px solid #0096ff;
}

.btn-cancelar:hover {
    background: #001d3d;
}

/* ==== Animación ==== */
@keyframes aparecer {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>