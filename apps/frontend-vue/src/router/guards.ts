export interface AuthRouteMeta {
  requiresAuth?: boolean
  guestOnly?: boolean
}

// Decide a dónde debe ir una navegación según el estado de sesión. Devuelve null cuando puede continuar.
export function resolveAuthRedirect(meta: AuthRouteMeta, isAuthenticated: boolean): string | null {
  if (meta.requiresAuth && !isAuthenticated) return '/login'
  if (meta.guestOnly && isAuthenticated) return '/dashboard'

  return null
}
