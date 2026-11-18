<script setup lang="ts">
import { ref, type Component } from 'vue'
import { Bot, Palette, ShieldCheck, User, type LucideIcon } from 'lucide-vue-next'
import AppearanceTab from '../components/settings/AppearanceTab.vue'
import AssistantTab from '../components/settings/AssistantTab.vue'
import ProfileTab from '../components/settings/ProfileTab.vue'
import SecurityTab from '../components/settings/SecurityTab.vue'
import type { SettingsTab } from '../settings/settings'
import { cn } from '../utils/cn'

const tabs: { id: SettingsTab; label: string; icon: LucideIcon }[] = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'assistant', label: 'Asistente IA', icon: Bot },
  { id: 'appearance', label: 'Apariencia', icon: Palette },
  { id: 'security', label: 'Seguridad & Datos', icon: ShieldCheck },
]

const panels: Record<SettingsTab, Component> = {
  profile: ProfileTab,
  assistant: AssistantTab,
  appearance: AppearanceTab,
  security: SecurityTab,
}

// Ajustes en una tarjeta Glassy: pestañas laterales en escritorio y horizontales en móvil.
const tab = ref<SettingsTab>('profile')
</script>

<template>
  <div class="space-y-6">
    <div>
      <p class="eyebrow">Ajustes</p>
      <h1 class="font-display text-4xl font-semibold text-slate-100">Tu espacio, a tu medida.</h1>
      <p class="mt-2 max-w-lg text-slate-400">Perfil, asistente, apariencia y datos de tu cuenta.</p>
    </div>

    <div class="glass-card grid overflow-hidden md:grid-cols-[220px_minmax(0,1fr)]">
      <nav aria-label="Secciones de ajustes" class="flex gap-1 overflow-x-auto border-b border-glass/10 p-3 md:flex-col md:border-b-0 md:border-r md:p-4" role="tablist">
        <button
          v-for="item in tabs"
          :id="`settings-tab-${item.id}`"
          :key="item.id"
          :aria-controls="`settings-panel-${item.id}`"
          :aria-selected="tab === item.id"
          :class="cn('flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition', tab === item.id ? 'nav-link-active' : 'text-slate-400 hover:bg-glass/5 hover:text-slate-100')"
          role="tab"
          type="button"
          @click="tab = item.id"
        >
          <component :is="item.icon" :size="16" />
          {{ item.label }}
        </button>
      </nav>
      <div :id="`settings-panel-${tab}`" :aria-labelledby="`settings-tab-${tab}`" class="min-w-0 p-6 md:p-8" role="tabpanel">
        <component :is="panels[tab]" />
      </div>
    </div>
  </div>
</template>
