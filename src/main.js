import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import 'datatables.net-dt'

import 'notyf/notyf.min.css'

import 'notyf/notyf.min.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
