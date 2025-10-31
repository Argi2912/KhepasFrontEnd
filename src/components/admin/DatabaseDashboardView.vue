<script setup>
import { ref } from 'vue';
import DatabaseTable from '../admin/DatabaseTable.vue';

// Estado local para saber qué pestaña está activa
const activeTab = ref('clients'); // 'clients', 'providers', 'brokers', 'admins', 'requests'

// --- Definiciones de Columnas para CADA tabla ---
// La 'key' debe coincidir con el nombre del campo en la API de Laravel

const clientColumns = ref([
  { key: 'id', label: 'ID' },
  { key: 'first_name', label: 'Nombre' },
  { key: 'last_name', label: 'Apellido' },
  { key: 'email', label: 'Email' },
  { key: 'company_name', label: 'Compañía' },
  { key: 'status', label: 'Estatus' },
]);

const providerColumns = ref([
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Nombre' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'type', label: 'Tipo' },
  { key: 'status', label: 'Estatus' },
]);

const brokerColumns = ref([
  // Asegúrate de que las 'key' coincidan con tu modelo 'Corredor'
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Nombre' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'status', label: 'Estatus' },
]);

const adminColumns = ref([
  // Asegúrate de que las 'key' coincidan con tu modelo 'Admin'
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Nombre' },
  { key: 'email', label: 'Email' },
  { key: 'created_at', label: 'Fecha Creación' },
]);

const requestColumns = ref([
  // Asegúrate de que las 'key' coincidan con tu modelo 'Request'
  { key: 'id', label: 'ID' },
  { key: 'client_id', label: 'ID Cliente' }, // (Sería mejor mostrar el nombre con un 'with()' en el backend)
  { key: 'provider_id', label: 'ID Proveedor' },
  { key: 'amount', label: 'Monto' },
  { key: 'status', label: 'Estatus' },
  { key: 'created_at', label: 'Fecha Creación' },
]);
</script>

<template>
  <main class="database-dashboard">
    <div class="tabs-navigation">
      <button @click="activeTab = 'clients'" :class="{ active: activeTab === 'clients' }">
        Clientes
      </button>
      <button @click="activeTab = 'providers'" :class="{ active: activeTab === 'providers' }">
        Proveedores
      </button>
      <button @click="activeTab = 'brokers'" :class="{ active: activeTab === 'brokers' }">
        Corredores
      </button>
      <button @click="activeTab = 'admins'" :class="{ active: activeTab === 'admins' }">
        Admins
      </button>
      <button @click="activeTab = 'requests'" :class="{ active: activeTab === 'requests' }">
        Solicitudes
      </button>
    </div>

   <div class="tab-content">
      <DatabaseTable
        v-if="activeTab === 'clients'"
        key="clients-table"
        title="Base de Datos de Clientes"
        data-type="clients"
        :columns="clientColumns"
      />

      <DatabaseTable
        v-if="activeTab === 'providers'"
        key="providers-table"
        title="Base de Datos de Proveedores"
        data-type="providers"
        :columns="providerColumns"
      />

      <DatabaseTable
        v-if="activeTab === 'brokers'"
        key="brokers-table"
        title="Base de Datos de Corredores"
        data-type="brokers"
        :columns="brokerColumns"
      />

      <DatabaseTable
        v-if="activeTab === 'admins'"
        key="admins-table"
        title="Base de Datos de Administradores"
        data-type="admins"
        :columns="adminColumns"
      />

      <DatabaseTable
        v-if="activeTab === 'requests'"
        key="requests-table"
        title="Historial de Solicitudes"
        data-type="requests"
        :columns="requestColumns"
      />
    </div>
  </main>
</template>

<style scoped>

/* === Navegación de pestañas === */
.tabs-navigation {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 35px;
  border-bottom: 2px solid rgba(0, 150, 255, 0.2);
  padding-bottom: 10px;
}

.tabs-navigation button {
  background: transparent;
  border: 2px solid transparent;
  color: #a8d8ff;
  padding: 12px 25px;
  border-radius: 25px;
  font-size: 1rem;
  letter-spacing: 0.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.tabs-navigation button::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0%;
  height: 2px;
  background: #00bfff;
  transition: width 0.3s ease;
}

.tabs-navigation button:hover::after {
  width: 100%;
}

.tabs-navigation button:hover {
  color: #00bfff;
  text-shadow: 0 0 8px rgba(0, 180, 255, 0.6);
}

.tabs-navigation button.active {
  color: #00bfff;
  border-color: #00bfff;
  background: rgba(0, 180, 255, 0.08);
  box-shadow: 0 0 15px rgba(0, 180, 255, 0.3);
  text-shadow: 0 0 10px rgba(0, 180, 255, 0.8);
}

.tabs-navigation button.active::after {
  width: 100%;
}

/* === Contenedor del contenido === */
.tab-content {
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  max-width: 1400px;
  background: rgba(0, 13, 40, 0.75);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 0 30px rgba(0, 150, 255, 0.15);
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
}

.tab-content:hover {
  box-shadow: 0 0 40px rgba(0, 180, 255, 0.25);
}

/* === Animación de entrada suave === */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tab-content > * {
  animation: fadeIn 0.4s ease-in-out;
}

/* === Scrollbar personalizada === */
::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}

::-webkit-scrollbar-thumb {
  background-color: #00bfff;
  border-radius: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 13, 40, 0.5);
}

</style>