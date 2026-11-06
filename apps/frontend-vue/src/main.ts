import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import { createAppRouter } from './router'

// Pinia primero: los guards de navegación leen el estado de sesión del store.
createApp(App).use(createPinia()).use(createAppRouter()).mount('#app')
