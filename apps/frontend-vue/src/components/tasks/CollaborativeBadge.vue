<script setup lang="ts">
import { avatarInitials } from '../../settings/settings'
import type { AssignedUser } from '../../types/api'

// Badge "Colaborativa" con los avatares de los amigos con los que se comparte la tarea.
defineProps<{ users?: AssignedUser[] }>()
</script>

<template>
  <span
    v-if="users && users.length > 0"
    class="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/15 py-0.5 pl-1 pr-2.5 text-xs font-semibold text-indigo-700 dark:text-indigo-200"
  >
    <span class="flex -space-x-2">
      <span
        v-for="user in users"
        :key="user.id"
        aria-hidden
        class="grid h-5 w-5 place-items-center rounded-full border border-white/40 bg-gradient-to-br from-indigo-500 to-violet-600 text-[9px] text-white"
      >
        {{ avatarInitials('', user.email) }}
      </span>
    </span>
    Colaborativa
  </span>
</template>
