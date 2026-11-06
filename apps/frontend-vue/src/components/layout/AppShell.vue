<script setup lang="ts">
import { Bot, Home, LogOut, Settings } from 'lucide-vue-next'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import Atmosphere from './Atmosphere.vue'

// Layout de las vistas protegidas: cápsula lateral, barra en píldora y el contenido de cada ruta.
const router = useRouter()
const auth = useAuthStore()

const navigation = [
  { label: 'Inicio', to: '/dashboard', icon: Home },
  { label: 'Chat IA', to: '/chat', icon: Bot },
]

const tabs = [
  { label: 'Resumen', to: '/dashboard' },
  { label: 'Chat IA', to: '/chat' },
]

function logout() {
  auth.clearSession()
  void router.replace('/login')
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
    <Atmosphere />
    <div class="relative z-10 mx-auto flex max-w-7xl flex-col gap-5 p-4 sm:p-6 md:grid md:grid-cols-[72px_minmax(0,1fr)] md:items-start">
      <nav aria-label="Navegación principal" class="nav-capsule flex-row self-start md:sticky md:top-6 md:flex-col">
        <RouterLink
          v-for="item in navigation"
          :key="item.to"
          :aria-label="item.label"
          :title="item.label"
          :to="item.to"
          active-class="nav-link-active"
          class="nav-icon"
        >
          <component :is="item.icon" :size="20" />
        </RouterLink>
        <span aria-disabled="true" aria-label="Configuración" class="nav-icon cursor-not-allowed opacity-40" title="Configuración (próximamente)">
          <Settings :size="20" />
        </span>
      </nav>

      <div class="flex min-w-0 flex-col gap-5">
        <header class="glass-pill flex flex-wrap items-center justify-between gap-3 py-2 pl-6 pr-2">
          <div class="flex flex-wrap items-center gap-6">
            <RouterLink class="font-display text-lg font-semibold tracking-wide" to="/dashboard">TaskMate</RouterLink>
            <nav aria-label="Pestañas principales" class="flex flex-wrap gap-1">
              <RouterLink v-for="tab in tabs" :key="tab.to" :to="tab.to" active-class="nav-link-active" class="nav-link">
                {{ tab.label }}
              </RouterLink>
            </nav>
          </div>
          <div class="flex items-center gap-3 text-sm">
            <span class="hidden text-slate-400 sm:inline">{{ auth.user?.email ?? 'Espacio personal' }}</span>
            <button aria-label="Cerrar sesión" class="icon-button" title="Cerrar sesión" type="button" @click="logout">
              <LogOut :size="18" />
            </button>
          </div>
        </header>

        <main class="min-w-0">
          <RouterView />
        </main>
      </div>
    </div>
  </div>
</template>
