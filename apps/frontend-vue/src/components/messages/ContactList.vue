<script setup lang="ts">
import { previewOf } from '../../messages/messageUtils'
import { avatarInitials } from '../../settings/settings'
import type { MessageContact } from '../../types/api'
import { cn } from '../../utils/cn'

// Barra lateral: contactos con su avatar, la vista previa del último mensaje y los no leídos.
defineProps<{ contacts: MessageContact[]; selectedId: string | null }>()

defineEmits<{ select: [userId: string] }>()
</script>

<template>
  <aside aria-label="Contactos" class="flex min-h-0 max-h-48 flex-col border-b border-glass/10 md:max-h-none md:border-b-0 md:border-r">
    <p class="px-4 pb-2 pt-4 text-sm font-semibold text-slate-200">Contactos</p>
    <p v-if="contacts.length === 0" class="px-4 py-6 text-sm text-slate-400">Aún no hay otros usuarios.</p>
    <ul v-else class="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
      <li v-for="contact in contacts" :key="contact.id">
        <button
          :aria-pressed="contact.id === selectedId"
          :class="cn('flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition', contact.id === selectedId ? 'border-glass/40 bg-glass/10' : 'border-transparent hover:bg-glass/5')"
          type="button"
          @click="$emit('select', contact.id)"
        >
          <span aria-hidden class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-semibold text-white">
            {{ avatarInitials('', contact.email) }}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium text-slate-100">{{ contact.email }}</span>
            <span class="block truncate text-xs text-slate-400">{{ previewOf(contact) }}</span>
          </span>
          <span
            v-if="contact.unreadCount > 0"
            :aria-label="`${contact.unreadCount} sin leer`"
            class="rounded-full bg-indigo-500 px-2 py-0.5 text-xs font-semibold text-white"
          >
            {{ contact.unreadCount }}
          </span>
        </button>
      </li>
    </ul>
  </aside>
</template>
