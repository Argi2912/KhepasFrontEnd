<template>
  <div class="auth-page">
    <div class="wizard-card" role="form" aria-labelledby="wizardTitle">
      <div class="form-header">
       
        <h2 id="wizardTitle">Tipo De Solicitud</h2>
      </div>

      <!-- Barra de pasos -->
      <div class="steps" aria-hidden="false">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="step"
          :class="{ active: currentStep === index, done: index < currentStep }"
        >
          <span class="step-index">{{ index + 1 }}</span>
          <p class="step-title">{{ step.title }}</p>
        </div>
      </div>

      <!-- CONTENEDOR TRANSICIONAL: animación entre pasos -->
      <transition name="fade-slide" mode="out-in">
        <div :key="currentStep" class="step-panel" aria-live="polite">
          <!-- STEP 1 -->
          <template v-if="currentStep === 0">
            <div class="form-group">
              <label for="fecha">Fecha</label>
              <input id="fecha" type="date" v-model="form.fecha" />
              <span v-if="errors.fecha" class="error">{{ errors.fecha }}</span>
            </div>

            <div class="form-group">
              <label for="monto">Monto Recibido</label>
              <input id="monto" type="number" v-model.number="form.monto" placeholder="Ej. 1500" />
              <span v-if="errors.monto" class="error">{{ errors.monto }}</span>
            </div>

            <div class="form-group">
              <label for="comisionCobrada">Comisión Cobrada</label>
              <input id="comisionCobrada" type="number" v-model.number="form.comisionCobrada" />
              <span v-if="errors.comisionCobrada" class="error">{{ errors.comisionCobrada }}</span>
            </div>
          </template>

          <!-- STEP 2 -->
          <template v-else-if="currentStep === 1">
            <div class="form-group">
              <label for="comisionProveedor">Comisión Proveedor</label>
              <input id="comisionProveedor" type="number" v-model.number="form.comisionProveedor" />
              <span v-if="errors.comisionProveedor" class="error">{{ errors.comisionProveedor }}</span>
            </div>

            <div class="form-group">
              <label for="comisionAdmin">Comisión Admin</label>
              <input id="comisionAdmin" type="number" v-model.number="form.comisionAdmin" />
              <span v-if="errors.comisionAdmin" class="error">{{ errors.comisionAdmin }}</span>
            </div>

            <div class="form-group">
              <label for="numero">Número</label>
              <input id="numero" type="text" v-model="form.numero" placeholder="Ej. 0021-XYZ" />
              <span v-if="errors.numero" class="error">{{ errors.numero }}</span>
            </div>
          </template>

          <!-- STEP 3 -->
          <template v-else-if="currentStep === 2">
            <div class="form-group">
              <label for="origen">Origen</label>
              <input id="origen" type="text" v-model="form.origen" />
              <span v-if="errors.origen" class="error">{{ errors.origen }}</span>
            </div>

            <div class="form-group">
              <label for="destino">Destino</label>
              <input id="destino" type="text" v-model="form.destino" />
              <span v-if="errors.destino" class="error">{{ errors.destino }}</span>
            </div>

            <div class="form-group">
              <label for="nombreCliente">Nombre Cliente</label>
              <input id="nombreCliente" type="text" v-model="form.nombreCliente" />
              <span v-if="errors.nombreCliente" class="error">{{ errors.nombreCliente }}</span>
            </div>
          </template>

          <!-- STEP 4 -->
          <template v-else-if="currentStep === 3">
            <div class="form-group">
              <label for="corredor">Corredor</label>
              <input id="corredor" type="text" v-model="form.corredor" />
              <span v-if="errors.corredor" class="error">{{ errors.corredor }}</span>
            </div>

            <div class="form-group">
              <label for="proveedor">Proveedor</label>
              <input id="proveedor" type="text" v-model="form.proveedor" />
              <span v-if="errors.proveedor" class="error">{{ errors.proveedor }}</span>
            </div>

            <div class="form-group">
              <label for="admin">Admin</label>
              <input id="admin" type="text" v-model="form.admin" />
              <span v-if="errors.admin" class="error">{{ errors.admin }}</span>
            </div>
          </template>
        </div>
      </transition>

      <!-- Botones -->
      <div class="wizard-buttons">
        <button
          type="button"
          class="back-button"
          @click="prevStep"
          :disabled="currentStep === 0"
        >
          Atrás
        </button>

        <div class="spacer"></div>

        <button
          v-if="currentStep < steps.length - 1"
          type="button"
          class="next-button"
          @click="nextStep"
        >
          Siguiente
        </button>

        <button
          v-else
          type="button"
          class="submit-button"
          @click="submit"
        >
          Guardar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'

// === Definición de pasos ===
const steps = [
  { title: 'Datos Básicos' },
  { title: 'Comisiones' },
  { title: 'Ruta' },
  { title: 'Gestores' },
]

const currentStep = ref(0)

// === Datos del formulario ===
const form = reactive({
  fecha: '',
  monto: null,
  comisionCobrada: null,
  comisionProveedor: null,
  comisionAdmin: null,
  origen: '',
  destino: '',
  nombreCliente: '',
  corredor: '',
  proveedor: '',
  admin: '',
  numero: '',
})

const errors = reactive({})

// ✅ Función para formatear fecha a YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ✅ Generar número automático
function generarNumero() {
  const datePart = formatDate(new Date()).replace(/-/g, '')
  const randomPart = Math.floor(100 + Math.random() * 900) // 3 dígitos aleatorios
  return `REG-${datePart}-${randomPart}`
}

// ✅ Al montar el componente
onMounted(() => {
  // Solo asignar si están vacíos (por si el usuario regresa al wizard)
  if (!form.fecha) form.fecha = formatDate(new Date())
  if (!form.numero) form.numero = generarNumero()
})

/**
 * Validaciones simples por paso.
 */
function validateStep(step) {
  const stepFields = {
    0: ['fecha', 'monto', 'comisionCobrada'],
    1: ['comisionProveedor', 'comisionAdmin', 'numero'],
    2: ['origen', 'destino', 'nombreCliente'],
    3: ['corredor', 'proveedor', 'admin'],
  }[step]

  stepFields.forEach((f) => (errors[f] = null))
  let valid = true

  stepFields.forEach((f) => {
    const val = form[f]
    if (val === '' || val === null || (typeof val === 'number' && isNaN(val))) {
      errors[f] = 'Este campo es obligatorio.'
      valid = false
    } else if ((f === 'monto' || f.includes('comision')) && Number(val) < 0) {
      errors[f] = 'No puede ser negativo.'
      valid = false
    }
  })

  return valid
}

function nextStep() {
  if (validateStep(currentStep.value)) {
    if (currentStep.value < steps.length - 1) currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 0) currentStep.value--
}

function submit() {
  let allValid = true
  for (let s = 0; s < steps.length; s++) {
    if (!validateStep(s)) allValid = false
  }

  if (!allValid) {
    const firstErrorField = Object.keys(errors).find((k) => errors[k])
    const fieldToStep = {
      fecha: 0, monto: 0, comisionCobrada: 0,
      comisionProveedor: 1, comisionAdmin: 1, numero: 1,
      origen: 2, destino: 2, nombreCliente: 2,
      corredor: 3, proveedor: 3, admin: 3,
    }
    currentStep.value = fieldToStep[firstErrorField] ?? 0
    return
  }

  console.log('Formulario completo:', JSON.parse(JSON.stringify(form)))
  alert('Datos guardados correctamente 🎉')
}
</script>

<style scoped>
/* ===== Fondo que ocupa toda la ventana ===== */

/* ===== Card del wizard ===== */
.wizard-card {
  position: relative;
  z-index: 2;
  background: rgba(15, 23, 42, 0.98);
  border-radius: 18px;
  padding: 30px 28px;
  margin-top: 30px;
  margin-left: auto;
  margin-right: auto;
   width: 960px;
  max-width: auto;
  border: 1px solid rgba(0, 180, 255, 0.22);
  box-shadow: 0 0 30px rgba(0, 150, 255, 0.12);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  animation: fadeInUp 0.6s ease-out forwards;
}

/* card appear */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* header */
.form-header { text-align: center; margin-bottom: 16px; }
.form-logo { width: 64px; filter: drop-shadow(0 0 8px rgba(0,200,255,0.6)); display:block; margin: 0 auto 8px; }
.form-header h2 { color: #00bfff; font-size: 20px; margin: 0 0 6px; }

/* steps bar */
.steps { display:flex; gap:8px; justify-content:space-between; margin: 12px 0 18px; }
.step { flex:1; text-align:center; color:#9ca3af; position:relative; }
.step .step-index {
  display:inline-block;
  width:30px; height:30px; line-height:30px;
  border-radius:50%;
  border:2px solid rgba(255,255,255,0.08);
  background:transparent;
  color:#cbd5e1;
  font-weight:600;
  transition: all .25s ease;
}
.step.active .step-index {
  background:#00bfff; color:#fff; box-shadow:0 0 8px rgba(0,180,255,0.45); border-color:#00bfff;
}
.step.done .step-index { background: linear-gradient(135deg,#00bfff,#007bff); color:#fff; border-color:transparent; box-shadow:0 0 10px rgba(0,160,255,0.45); }
.step .step-title { font-size:11px; margin-top:6px; }

/* step panel container */
.step-panel { min-height: 180px; }

/* input styles */
.form-group { margin-bottom: 14px; }
.form-group label { display:block; color:#cdd6f4; font-weight:500; margin-bottom:6px; }
.form-group input {
  width:100%;
  padding:10px 14px;
  border-radius: 10px;
  border:1px solid #243241;
  background:#0f1724;
  color:#fff;
  transition: all .18s ease;
}
.form-group input:focus { outline:none; border-color:#00bfff; box-shadow:0 0 8px rgba(0,170,255,0.15); }

/* errors */
.error { color:#ff8080; font-size:13px; margin-top:6px; display:block; }

/* buttons layout */
.wizard-buttons { display:flex; align-items:center; gap:12px; margin-top:18px; }
.back-button, .next-button, .submit-button {
  padding:10px 18px; border-radius:10px; border:none; cursor:pointer; font-weight:600;
  background: linear-gradient(135deg,#007bff,#00bfff); color:#fff; box-shadow:0 6px 18px rgba(0,140,255,0.12);
  transition: transform .15s ease, box-shadow .15s ease;
}
.back-button[disabled] { opacity:.45; cursor:not-allowed; transform:none; box-shadow:none; }
.back-button:hover:not([disabled]), .next-button:hover, .submit-button:hover { transform:translateY(-3px); box-shadow:0 10px 28px rgba(0,140,255,0.16); }

/* spacer to push next/submit right */
.spacer { flex:1; }

/* TRANSICIÓN: fade + slide */
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: opacity .35s ease, transform .35s ease;
}
.fade-slide-enter-from {
  opacity: 0; transform: translateY(12px);
}
.fade-slide-enter-to {
  opacity: 1; transform: translateY(0);
}
.fade-slide-leave-from {
  opacity: 1; transform: translateY(0);
}
.fade-slide-leave-to {
  opacity: 0; transform: translateY(-12px);
}

/* responsivo */
@media (max-width: 600px) {
  .wizard-card { width: 92%; padding: 20px; }
  .steps { gap:6px; }
  .form-logo { width: 56px; }
}
</style>
