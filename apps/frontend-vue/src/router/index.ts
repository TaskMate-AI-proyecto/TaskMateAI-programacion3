import { createRouter, createWebHistory, type RouteRecordRaw, type RouterHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { resolveAuthRedirect, type AuthRouteMeta } from './guards'
import DashboardView from '../views/DashboardView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'

declare module 'vue-router' {
  interface RouteMeta extends AuthRouteMeta {}
}

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginView, meta: { guestOnly: true } },
  { path: '/register', component: RegisterView, meta: { guestOnly: true } },
  { path: '/dashboard', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
]

// Fábrica: cada app y cada test crean su propio router. Pinia debe estar instalado antes de navegar.
export function createAppRouter(history: RouterHistory = createWebHistory()) {
  const router = createRouter({ history, routes })

  router.beforeEach((to) => resolveAuthRedirect(to.meta, useAuthStore().isAuthenticated) ?? true)

  return router
}
