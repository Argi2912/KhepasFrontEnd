<template>
  <div class="auth-page">
    <div class="wizard-card" role="form" aria-labelledby="wizardTitle">
      <div class="form-header">
        <h2 id="wizardTitle">Nueva Solicitud</h2>
      </div>

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

      <transition name="fade-slide" mode="out-in">
        <div :key="currentStep" class="step-panel" aria-live="polite">
          
          <template v-if="currentStep === 0">
            <div class="form-group">
              <label for="requestType">Tipo de Solicitud</label>
              <div class="input-with-button">
                <select id="requestType" class="input-field" v-model="form.request_type_id">
                  <option :value="null">Seleccione un tipo</option>
                  <option v-for="rt in requestStore.requestsTypes" :key="rt.id" :value="rt.id">
                    {{ rt.name }}
                  </option>
                </select>
                <button type="button" class="btn-agregar-inline" @click="abrirModalRequestType()">
                  Agregar +
                </button>
              </div>
              <span v-if="errors.request_type_id" class="error">{{ errors.request_type_id }}</span>
            </div>

            <div class="form-group">
              <label for="fecha">Fecha</label>
              <input id="fecha" type="date" v-model="form.fecha" class="input-field" />
              <span v-if="errors.fecha" class="error">{{ errors.fecha }}</span>
            </div>

            <div class="form-group">
              <label for="monto">Monto Recibido</label>
              <input id="monto" type="number" v-model.number="form.monto" placeholder="Ej. 1500" class="input-field" />
              <span v-if="errors.monto" class="error">{{ errors.monto }}</span>
            </div>
          </template>

          <template v-else-if="currentStep === 1">
            <div class="form-group">
              <label for="comisionCobrada">Comisión Cobrada</label>
              <input id="comisionCobrada" type="number" v-model.number="form.comisionCobrada" class="input-field" />
              <span v-if="errors.comisionCobrada" class="error">{{ errors.comisionCobrada }}</span>
            </div>

            <div class="form-group">
              <label for="comisionProveedor">Comisión Proveedor</label>
              <input id="comisionProveedor" type="number" v-model.number="form.comisionProveedor" class="input-field" />
              <span v-if="errors.comisionProveedor" class="error">{{ errors.comisionProveedor }}</span>
            </div>

            <div class="form-group">
              <label for="comisionAdmin">Comisión Admin</label>
              <input id="comisionAdmin" type="number" v-model.number="form.comisionAdmin" class="input-field" />
              <span v-if="errors.comisionAdmin" class="error">{{ errors.comisionAdmin }}</span>
            </div>
          </template>

          <template v-else-if="currentStep === 2">
            <div class="form-group">
              <label for="numero">Número de Referencia</label>
              <input id="numero" type="text" v-model="form.numero" placeholder="Ej. 0021-XYZ" class="input-field" />
              <span v-if="errors.numero" class="error">{{ errors.numero }}</span>
            </div>

            <div class="form-group">
              <label for="origen">Origen</label>
              <input id="origen" type="text" v-model="form.origen" class="input-field" />
              <span v-if="errors.origen" class="error">{{ errors.origen }}</span>
            </div>

            <div class="form-group">
              <label for="destino">Destino</label>
              <input id="destino" type="text" v-model="form.destino" class="input-field" />
              <span v-if="errors.destino" class="error">{{ errors.destino }}</span>
            </div>
          </template>

          <template v-else-if="currentStep === 3">
            <div class="form-group">
              <label for="cliente">Cliente</label>
              <div class="input-with-button">
                <select id="cliente" class="input-field" v-model="form.client_id">
                  <option :value="null">Seleccione un cliente</option>
                  <option v-for="client in clientStore.clients" :key="client.id" :value="client.id">
                    {{ client.name }}
                  </option>
                </select>
                <button type="button" class="btn-agregar-inline" @click="abrirModalCliente()">
                  Agregar +
                </button>
              </div>
              <span v-if="errors.client_id" class="error">{{ errors.client_id }}</span>
            </div>

            <div class="form-group">
              <label for="proveedor">Proveedor</label>
              <div class="input-with-button">
                <select id="proveedor" class="input-field" v-model="form.provider_id">
                  <option :value="null">Seleccione un proveedor</option>
                  <option v-for="p in providerStore.providers" :key="p.id" :value="p.id">
                    {{ p.name }}
                  </option>
                </select>
                <button type="button" class="btn-agregar-inline" @click="abrirModalProvider()">
                  Agregar +
                </button>
              </div>
              <span v-if="errors.provider_id" class="error">{{ errors.provider_id }}</span>
            </div>

            <div class="form-group">
              <label for="corredor">Corredor</label>
              <div class="input-with-button">
                <select id="corredor" class="input-field" v-model="form.corredor_id">
                  <option :value="null">Seleccione un corredor</option>
                  <option v-for="c in corredorStore.corredores" :key="c.id" :value="c.id">
                    {{ c.name }}
                  </option>
                </select>
                <button type="button" class="btn-agregar-inline" @click="abrirModalCorredor()">
                  Agregar +
                </button>
              </div>
              <span v-if="errors.corredor_id" class="error">{{ errors.corredor_id }}</span>
            </div>

            <div class="form-group">
              <label for="admin">Admin (Fuente de Fondos)</label>
              <div class="input-with-button">
                <select id="admin" class="input-field" v-model="form.admin_id">
                  <option :value="null">Seleccione un admin</option>
                  <option v-for="admin in adminStore.admins" :key="admin.id" :value="admin.id">
                    {{ admin.name }}
                  </option>
                </select>
                <button type="button" class="btn-agregar-inline" @click="abrirModalAdmin()">
                  Agregar +
                </button>
              </div>
              <span v-if="errors.admin_id" class="error">{{ errors.admin_id }}</span>
            </div>
          </template>
        </div>
      </transition>

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
          :disabled="solicitudStore.loading"
        >
          {{ solicitudStore.loading ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </div>

    <div v-if="mostrarModalRequestType" class="overlay" @click.self="cerrarModalRequestType">
      <div class="modal-contenido">
        <div class="modal-header">
          <h3>Nuevo Tipo de Solicitud</h3>
          <button class="btn-cerrar" @click="cerrarModalRequestType">×</button>
        </div>
        <div class="modal-body">
          <label class="form-label">Nombre:</label>
          <input v-model="nuevoForm.name" type="text" class="modal-input-field" placeholder="Ej: Solicitud de Compra" />
        </div>
        <div class="modal-footer">
          <button class="btn-guardar" @click="guardarNuevoRequestType()" :disabled="requestStore.loading">
            {{ requestStore.loading ? 'Guardando...' : 'Guardar' }}
          </button>
          <button class="btn-cancelar" @click="cerrarModalRequestType">Cancelar</button>
        </div>
      </div>
    </div>

    <div v-if="mostrarModalCliente" class="overlay" @click.self="cerrarModalCliente">
      <div class="modal-contenido">
        <div class="modal-header">
          <h3>Nuevo Cliente</h3>
          <button class="btn-cerrar" @click="cerrarModalCliente">×</button>
        </div>
        <div class="modal-body">
          <label class="form-label">Nombre del Cliente:</label>
          <input v-model="nuevoForm.name" type="text" class="modal-input-field" placeholder="Nombre del Cliente" />
        </div>
        <div class="modal-footer">
          <button class="btn-guardar" @click="guardarNuevoCliente()" :disabled="clientStore.loading">
            {{ clientStore.loading ? 'Guardando...' : 'Guardar' }}
          </button>
          <button class="btn-cancelar" @click="cerrarModalCliente">Cancelar</button>
        </div>
      </div>
    </div>

    <div v-if="mostrarModalProvider" class="overlay" @click.self="cerrarModalProvider">
      <div class="modal-contenido">
        <div class="modal-header">
          <h3>Nuevo Proveedor</h3>
          <button class="btn-cerrar" @click="cerrarModalProvider">×</button>
        </div>
        <div class="modal-body">
          <label class="form-label">Nombre del Proveedor:</label>
          <input v-model="nuevoForm.name" type="text" class="modal-input-field" placeholder="Nombre del Proveedor" />
        </div>
        <div class="modal-footer">
          <button class="btn-guardar" @click="guardarNuevoProvider()" :disabled="providerStore.loading">
            {{ providerStore.loading ? 'Guardando...' : 'Guardar' }}
          </button>
          <button class="btn-cancelar" @click="cerrarModalProvider">Cancelar</button>
        </div>
      </div>
    </div>

    <div v-if="mostrarModalCorredor" class="overlay" @click.self="cerrarModalCorredor">
      <div class="modal-contenido">
        <div class="modal-header">
          <h3>Nuevo Corredor</h3>
          <button class="btn-cerrar" @click="cerrarModalCorredor">×</button>
        </div>
        <div class="modal-body">
          <label class="form-label">Nombre del Corredor:</label>
          <input v-model="nuevoForm.name" type="text" class="modal-input-field" placeholder="Nombre del Corredor" />
        </div>
        <div class="modal-footer">
          <button class="btn-guardar" @click="guardarNuevoCorredor()" :disabled="corredorStore.loading">
            {{ corredorStore.loading ? 'Guardando...' : 'Guardar' }}
          </button>
          <button class="btn-cancelar" @click="cerrarModalCorredor">Cancelar</button>
        </div>
      </div>
    </div>

    <div v-if="mostrarModalAdmin" class="overlay" @click.self="cerrarModalAdmin">
      <div class="modal-contenido">
        <div class="modal-header">
          <h3>Nuevo Admin (Fuente)</h3>
          <button class="btn-cerrar" @click="cerrarModalAdmin">×</button>
        </div>
        <div class="modal-body">
          <label class="form-label">Nombre de la Fuente (Admin):</label>
          <input v-model="nuevoForm.name" type="text" class="modal-input-field" placeholder="Ej: Fondos Admin" />
        </div>
        <div class="modal-footer">
          <button class="btn-guardar" @click="guardarNuevoAdmin()" :disabled="adminStore.loading">
            {{ adminStore.loading ? 'Guardando...' : 'Guardar' }}
          </button>
          <button class="btn-cancelar" @click="cerrarModalAdmin">Cancelar</button>
        </div>
      </div>
    </div>

    </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { Notyf } from 'notyf' // Importar Notyf para los modales

// --- 1. IMPORTAR TODOS LOS STORES ---
import { useSolicitudStore } from '../stores/solicitudStore'
import { useRequestStore } from '../stores/RequestStore'
import { useClientStore } from '../stores/clientStore'
import { useProviderStore } from '../stores/providerStore'
import { useCorredorStore } from '../stores/corredorStore'
import { useAdminStore } from '../stores/adminStore'

// --- 2. INICIALIZAR STORES Y NOTYF ---
const notyf = new Notyf()
const solicitudStore = useSolicitudStore()
const requestStore = useRequestStore()
const clientStore = useClientStore()
const providerStore = useProviderStore()
const corredorStore = useCorredorStore()
const adminStore = useAdminStore()

// === 3. Definición de pasos (MODIFICADO) ===
const steps = [
  { title: 'Datos Básicos' }, // request_type_id, fecha, monto
  { title: 'Comisiones' },    // comisionCobrada, comisionProveedor, comisionAdmin
  { title: 'Ruta' },          // numero, origen, destino
  { title: 'Gestores' },      // client_id, provider_id, corredor_id, admin_id
]
const currentStep = ref(0)

// === 4. Datos del formulario (MODIFICADO) ===
const form = reactive({
  // Step 0
  request_type_id: null,
  fecha: '',
  monto: null,
  // Step 1
  comisionCobrada: null,
  comisionProveedor: null,
  comisionAdmin: null,
  // Step 2
  numero: '',
  origen: '',
  destino: '',
  // Step 3
  client_id: null,
  provider_id: null,
  corredor_id: null,
  admin_id: null,
})
const errors = reactive({})

// === 5. Estado de Modales ===
const nuevoForm = ref({ name: '' }) // Un solo formulario para todos los modales simples
const mostrarModalRequestType = ref(false)
const mostrarModalCliente = ref(false)
const mostrarModalProvider = ref(false)
const mostrarModalCorredor = ref(false)
const mostrarModalAdmin = ref(false)

// === 6. Lógica de Modales ===
// --- RequestType ---
function abrirModalRequestType() {
  nuevoForm.value = { name: '' }
  mostrarModalRequestType.value = true
}
function cerrarModalRequestType() {
  mostrarModalRequestType.value = false
}
async function guardarNuevoRequestType() {
  if (!nuevoForm.value.name) { notyf.error('El nombre es obligatorio'); return }
  try {
    const nuevo = await requestStore.create(nuevoForm.value)
    form.request_type_id = nuevo.id // Auto-seleccionar
    cerrarModalRequestType()
  } catch (err) { console.error(err) } // Store ya muestra notyf
}
// --- Cliente ---
function abrirModalCliente() {
  nuevoForm.value = { name: '' }
  mostrarModalCliente.value = true
}
function cerrarModalCliente() {
  mostrarModalCliente.value = false
}
async function guardarNuevoCliente() {
  if (!nuevoForm.value.name) { notyf.error('El nombre es obligatorio'); return }
  try {
    const nuevo = await clientStore.create(nuevoForm.value)
    form.client_id = nuevo.id // Auto-seleccionar
    cerrarModalCliente()
  } catch (err) { console.error(err) }
}
// --- Proveedor ---
function abrirModalProvider() {
  nuevoForm.value = { name: '' }
  mostrarModalProvider.value = true
}
function cerrarModalProvider() {
  mostrarModalProvider.value = false
}
async function guardarNuevoProvider() {
  if (!nuevoForm.value.name) { notyf.error('El nombre es obligatorio'); return }
  try {
    const nuevo = await providerStore.create(nuevoForm.value)
    form.provider_id = nuevo.id // Auto-seleccionar
    cerrarModalProvider()
  } catch (err) { console.error(err) }
}
// --- Corredor ---
function abrirModalCorredor() {
  nuevoForm.value = { name: '' }
  mostrarModalCorredor.value = true
}
function cerrarModalCorredor() {
  mostrarModalCorredor.value = false
}
async function guardarNuevoCorredor() {
  if (!nuevoForm.value.name) { notyf.error('El nombre es obligatorio'); return }
  try {
    const nuevo = await corredorStore.create(nuevoForm.value)
    form.corredor_id = nuevo.id // Auto-seleccionar
    cerrarModalCorredor()
  } catch (err) { console.error(err) }
}
// --- Admin ---
function abrirModalAdmin() {
  nuevoForm.value = { name: '' }
  mostrarModalAdmin.value = true
}
function cerrarModalAdmin() {
  mostrarModalAdmin.value = false
}
async function guardarNuevoAdmin() {
  if (!nuevoForm.value.name) { notyf.error('El nombre es obligatorio'); return }
  try {
    const nuevo = await adminStore.create(nuevoForm.value)
    form.admin_id = nuevo.id // Auto-seleccionar
    cerrarModalAdmin()
  } catch (err) { console.error(err) }
}

// === 7. Funciones del Wizard ===
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
function generarNumero() {
  const datePart = formatDate(new Date()).replace(/-/g, '')
  const randomPart = Math.floor(100 + Math.random() * 900) // 3 dígitos aleatorios
  return `REG-${datePart}-${randomPart}`
}

// ✅ Al montar el componente (MODIFICADO)
onMounted(() => {
  // Asignar valores por defecto al formulario
  if (!form.fecha) form.fecha = formatDate(new Date())
  if (!form.numero) form.numero = generarNumero()

  // Cargar TODAS las listas para los <select>
  requestStore.fetchList()
  clientStore.fetchList()
  providerStore.fetchList()
  corredorStore.fetchList()
  adminStore.fetchList()
})

/**
 * Validaciones (MODIFICADO)
 */
function validateStep(step) {
  // Campos por paso (actualizado)
  const stepFields = {
    0: ['request_type_id', 'fecha', 'monto'],
    1: ['comisionCobrada', 'comisionProveedor', 'comisionAdmin'],
    2: ['numero', 'origen', 'destino'],
    3: ['client_id', 'provider_id', 'corredor_id', 'admin_id'],
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

/**
 * Función de Guardado (MODIFICADO)
 */
async function submit() {
  let allValid = true
  for (let s = 0; s < steps.length; s++) {
    if (!validateStep(s)) allValid = false
  }

  if (!allValid) {
    const firstErrorField = Object.keys(errors).find((k) => errors[k])
    // Mapa de campos a pasos (actualizado)
    const fieldToStep = {
      request_type_id: 0, fecha: 0, monto: 0,
      comisionCobrada: 1, comisionProveedor: 1, comisionAdmin: 1,
      numero: 2, origen: 2, destino: 2,
      client_id: 3, provider_id: 3, corredor_id: 3, admin_id: 3,
    }
    currentStep.value = fieldToStep[firstErrorField] ?? 0
    notyf.error('Por favor, corrige los campos obligatorios.')
    return
  }

  // Si todo es válido, llamar al store
  try {
    const formData = JSON.parse(JSON.stringify(form))
    await solicitudStore.createSolicitud(formData)
    notyf.success('¡Solicitud guardada correctamente! 🎉') // Usamos Notyf
    // Opcional: resetear formulario
    // Object.assign(form, { ...valores_iniciales });
    // currentStep.value = 0;
  } catch (error) {
    // El store ya mostró la notificación de error
    console.error('Error al guardar la solicitud:', error)
  }
}
</script>

<style scoped>
/* ================================================ */
/* ==== INICIO: Tus Estilos del Wizard (INTACTOS) ==== */
/* ================================================ */
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
  max-width: 95%; /* Ajuste para móviles */
  border: 1px solid rgba(0, 180, 255, 0.22);
  box-shadow: 0 0 30px rgba(0, 150, 255, 0.12);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  animation: fadeInUp 0.6s ease-out forwards;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
.form-header { text-align: center; margin-bottom: 16px; }
.form-header h2 { color: #00bfff; font-size: 20px; margin: 0 0 6px; }
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
.step-panel { min-height: 180px; }
.form-group { margin-bottom: 14px; }
.form-group label { display:block; color:#cdd6f4; font-weight:500; margin-bottom:6px; }

/* CAMBIO: Aplicado a input y select con clase .input-field */
.input-field {
  width:100%;
  padding:10px 14px;
  border-radius: 10px;
  border:1px solid #243241;
  background:#0f1724;
  color:#fff;
  transition: all .18s ease;
  /* Añadido para que el select se vea bien */
  appearance: none; 
}
.input-field:focus { outline:none; border-color:#00bfff; box-shadow:0 0 8px rgba(0,170,255,0.15); }

.error { color:#ff8080; font-size:13px; margin-top:6px; display:block; }
.wizard-buttons { display:flex; align-items:center; gap:12px; margin-top:18px; }
.back-button, .next-button, .submit-button {
  padding:10px 18px; border-radius:10px; border:none; cursor:pointer; font-weight:600;
  background: linear-gradient(135deg,#007bff,#00bfff); color:#fff; box-shadow:0 6px 18px rgba(0,140,255,0.12);
  transition: transform .15s ease, box-shadow .15s ease;
}
.back-button[disabled] { opacity:.45; cursor:not-allowed; transform:none; box-shadow:none; }
.back-button:hover:not([disabled]), .next-button:hover, .submit-button:hover { transform:translateY(-3px); box-shadow:0 10px 28px rgba(0,140,255,0.16); }
.spacer { flex:1; }
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: opacity .35s ease, transform .35s ease;
}
.fade-slide-enter-from { opacity: 0; transform: translateY(12px); }
.fade-slide-enter-to { opacity: 1; transform: translateY(0); }
.fade-slide-leave-from { opacity: 1; transform: translateY(0); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-12px); }

@media (max-width: 600px) {
  .wizard-card { width: 92%; padding: 20px; }
  .steps { gap:6px; }
}

/* ================================================ */
/* ==== INICIO: Estilos NUEVOS para Modales y Selects ==== */
/* ================================================ */

/* Contenedor para el select y el botón "Agregar" */
.input-with-button {
  display: flex;
  gap: 10px;
}
.input-with-button .input-field {
  flex-grow: 1; /* El select ocupa el espacio restante */
  margin-bottom: 0;
}

/* Botón "Agregar +" al lado del select */
.btn-agregar-inline {
  background: #0096ff;
  color: #fff;
  border: none;
  border-radius: 10px; /* Coincide con el input-field */
  padding: 0 20px;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(0, 150, 255, 0.6);
  transition: all 0.3s ease;
  white-space: nowrap; /* Evita que el texto se parta */
  font-weight: 600;
  flex-shrink: 0; /* Evita que el botón se encoja */
}
.btn-agregar-inline:hover {
  background: #00bfff;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 150, 255, 0.4);
}

/* ==== Estilos del Modal (Tus estilos de RequestTypeView) ==== */
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
  margin-bottom: 25px; /* Más espacio */
}
.modal-header h3 {
  color: #00bfff;
  text-shadow: 0 0 10px #0096ff;
  margin: 0;
  font-size: 1.25rem;
}
.btn-cerrar {
  background: transparent;
  border: none;
  color: #0096ff;
  font-size: 28px; /* Más grande */
  cursor: pointer;
  line-height: 1;
  padding: 0;
}
.modal-body .form-label {
  display: block;
  color: #cdd6f4;
  font-weight: 500;
  margin-bottom: 6px;
}
/* Input de dentro del modal */
.modal-input-field {
  width: 100%;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid #0096ff;
  background: #001d3d;
  color: #ffffff;
  margin-bottom: 15px;
}
.modal-input-field:focus {
  outline: none;
  border-color: #00bfff;
  box-shadow: 0 0 8px rgba(0, 170, 255, 0.3);
}
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
  font-weight: 600;
  box-shadow: 0 0 10px #0096ff;
  transition: all 0.3s ease;
}
.btn-guardar:hover {
  background-color: #00bfff;
  transform: translateY(-2px);
}
.btn-cancelar {
  background: transparent;
  color: #ccc;
  border-radius: 25px;
  padding: 10px 20px;
  border: 1px solid #0096ff;
  font-weight: 600;
  transition: all 0.3s ease;
}
.btn-cancelar:hover {
  background: #001d3d;
  color: #fff;
}

@keyframes aparecer {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>