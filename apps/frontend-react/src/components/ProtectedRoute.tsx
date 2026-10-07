import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute() {
  const { isLoading, token } = useAuth()
  const location = useLocation()

  if (isLoading) return <div className="auth-page"><p>Comprobando sesión...</p></div>

  return token ? <Outlet /> : <Navigate replace state={{ from: location }} to="/login" />
}

export function PublicOnlyRoute() {
  const { isLoading, token } = useAuth()

  if (isLoading) return <div className="auth-page"><p>Comprobando sesión...</p></div>

  return token ? <Navigate replace to="/dashboard" /> : <Outlet />
}