import { Link } from 'react-router-dom'

export function RegisterPage() {
  return <div className="auth-page"><p className="eyebrow">TaskMate</p><h1 className="font-display text-4xl font-semibold">Crea tu espacio.</h1><p>Usa tu correo para recibir un código de acceso seguro.</p><Link className="text-link" to="/login">Ya tengo una cuenta</Link></div>
}