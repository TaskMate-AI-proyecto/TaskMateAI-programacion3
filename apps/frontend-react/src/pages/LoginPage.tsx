import { Link } from 'react-router-dom'

export function LoginPage() {
  return <div className="auth-page"><p className="eyebrow">TaskMate</p><h1 className="font-display text-4xl font-semibold">Bienvenido de nuevo.</h1><p>El flujo de acceso con código estará conectado a la API en la siguiente iteración.</p><Link className="text-link" to="/">Ir al tablero</Link></div>
}