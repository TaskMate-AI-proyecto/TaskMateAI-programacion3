<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useSettingsStore } from '../../stores/settings'
import { avatarInitials, maxDisplayNameLength } from '../../settings/settings'
import { eventValue } from '../../utils/events'

// Perfil: avatar con iniciales, nombre de usuario guardado en el navegador y correo de la cuenta (sólo lectura).
const auth = useAuthStore()
const settingsStore = useSettingsStore()

const email = computed(() => auth.user?.email ?? '')
const initials = computed(() => avatarInitials(settingsStore.settings.displayName, email.value))
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-center gap-4">
      <span aria-hidden class="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 font-display text-xl font-semibold text-white">
        {{ initials }}
      </span>
      <div>
        <p class="font-semibold text-slate-100">{{ settingsStore.settings.displayName || 'Sin nombre' }}</p>
        <p class="text-sm text-slate-400">{{ email || 'Espacio personal' }}</p>
      </div>
    </div>

    <div class="flex flex-col">
      <label class="settings-label" for="settings-name">Nombre de usuario</label>
      <input
        id="settings-name"
        class="settings-field"
        :maxlength="maxDisplayNameLength"
        placeholder="Cómo quieres que te llamemos"
        type="text"
        :value="settingsStore.settings.displayName"
        @input="settingsStore.update({ displayName: eventValue($event) })"
      />
      <p class="settings-hint">{{ settingsStore.settings.displayName.length }}/{{ maxDisplayNameLength }} · Se guarda en este navegador.</p>
    </div>

    <div class="flex flex-col">
      <label class="settings-label" for="settings-email">Correo electrónico</label>
      <input id="settings-email" class="settings-field cursor-not-allowed opacity-70" readonly type="email" :value="email" />
      <p class="settings-hint">El correo lo gestiona tu cuenta.</p>
    </div>
  </section>
</template>
