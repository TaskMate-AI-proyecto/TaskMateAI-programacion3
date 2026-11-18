import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { applyTheme, resolveTheme } from './theme/theme'
import { applyStoredSettings } from './settings/settings'

// Antes del primer render: la clase .dark ya está puesta y no hay parpadeo de tema.
applyTheme(resolveTheme())
applyStoredSettings()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter>
  </StrictMode>,
)
