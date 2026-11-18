import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import { createAppRouter } from './router'
import { applyTheme, resolveTheme } from './theme/theme'
import { applyStoredSettings } from './settings/settings'

// Antes del primer render: la clase .dark ya está puesta y no hay parpadeo de tema.
applyTheme(resolveTheme())
applyStoredSettings()

// Pinia primero: los guards de navegación leen el estado de sesión del store.
createApp(App).use(createPinia()).use(createAppRouter()).mount('#app')
