// vite.config.js (ACTUALIZADO)
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  // 💡 NUEVA SECCIÓN DE CONFIGURACIÓN DEL SERVIDOR/PROXY
  server: {
    proxy: {
      // Cuando la aplicación Vue solicite algo que comience con '/api'
      '/api': {
        // Redirigir la solicitud a su backend real (su API de Laravel, Express, etc.)
        target: 'http://127.0.0.1:8000',
        // Permite cambios de origen (necesario para la comunicación entre diferentes hosts/puertos)
        changeOrigin: true,
      },
    },
  },
})
