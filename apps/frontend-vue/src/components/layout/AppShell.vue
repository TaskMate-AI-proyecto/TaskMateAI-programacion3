<script setup lang="ts">
import { Bot, Home, ListTodo, LogOut, MessageCircle, Search, Settings, Users } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import StreakIndicator from '../gamification/StreakIndicator.vue'
import WorkspaceSidebar from '../workspaces/WorkspaceSidebar.vue'
import { useAuthStore } from '../../stores/auth'
import { useCommandPaletteStore } from '../../stores/commandPalette'
import { useGamificationStore } from '../../stores/gamification'
import { useWorkspacesStore } from '../../stores/workspaces'
import CommandPaletteHost from '../command-palette/CommandPaletteHost.vue'
import FriendsModal from '../friends/FriendsModal.vue'
import Atmosphere from './Atmosphere.vue'
import ThemeToggle from './ThemeToggle.vue'

// Layout de las vistas protegidas: cápsula lateral, barra en píldora y el contenido de cada ruta.
// La paleta de comandos (Ctrl/Cmd+K) se monta aquí porque necesita el router y todas las vistas protegidas.
const router = useRouter()
const auth = useAuthStore()
const gamification = useGamificationStore()
const workspaces = useWorkspacesStore()
const palette = useCommandPaletteStore()
const friendsOpen = ref(false)

// El indicador de racha y nivel de la cápsula necesita el perfil una vez por sesión de la shell.
onMounted(() => {
  void gamification.load()
  void workspaces.load()
})

const navigation = [
  { label: 'Inicio', to: '/dashboard', icon: Home },
  { label: 'Tareas', to: '/tasks', icon: ListTodo },
  { label: 'Mensajes', to: '/messages', icon: MessageCircle },
  { label: 'Chat IA', to: '/chat', icon: Bot },
  { label: 'Ajustes', to: '/settings', icon: Settings },
]

const tabs = [
  { label: 'Resumen', to: '/dashboard' },
  { label: 'Tareas', to: '/tasks' },
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
    <CommandPaletteHost />
    <div class="relative z-10 mx-auto flex max-w-7xl flex-col gap-5 p-4 sm:p-6 md:grid md:grid-cols-[96px_minmax(0,1fr)] md:items-start">
      <nav aria-label="Navegación principal" class="nav-capsule flex-row self-start md:sticky md:top-6 md:flex-col md:w-[88px] md:px-2.5">
        <button
          aria-label="Buscar comandos"
          class="nav-icon"
          title="Buscar comandos (Ctrl+K / ⌘K)"
          type="button"
          @click="palette.open()"
        >
          <Search :size="20" />
        </button>
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
        <StreakIndicator />
        <WorkspaceSidebar />
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
            <button aria-label="Amigos" class="icon-button" title="Amigos" type="button" @click="friendsOpen = true">

              <Users :size="18" />

            </button>
            <ThemeToggle />
            <button aria-label="Cerrar sesión" class="icon-button" title="Cerrar sesión" type="button" @click="logout">
              <LogOut :size="18" />
            </button>
          </div>
        </header>

        <FriendsModal v-if="friendsOpen" @close="friendsOpen = false" />

        <main class="min-w-0">
          <RouterView />
        </main>
      </div>
    </div>
  </div>
</template>
