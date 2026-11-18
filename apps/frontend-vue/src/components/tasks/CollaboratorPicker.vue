<script setup lang="ts">
import { useFriends } from '../../composables/useFriends'
import { avatarInitials } from '../../settings/settings'
import { cn } from '../../utils/cn'

// Selector de amigos colaboradores: cada amigo es una pastilla que se activa o desactiva.
const props = defineProps<{ modelValue: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [ids: string[]] }>()

const { friends } = useFriends()

function toggle(userId: string) {
  emit(
    'update:modelValue',
    props.modelValue.includes(userId) ? props.modelValue.filter((id) => id !== userId) : [...props.modelValue, userId],
  )
}
</script>

<template>
  <p v-if="friends.length === 0" class="text-xs text-slate-500">Aún no tienes amigos para compartir esta tarea.</p>
  <div v-else aria-label="Agregar amigo o colaborador" class="flex flex-wrap gap-2" role="group">
    <button
      v-for="item in friends"
      :key="item.friendshipId"
      :aria-pressed="modelValue.includes(item.friend.id)"
      :class="cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition', modelValue.includes(item.friend.id) ? 'border-transparent bg-gradient-to-r from-indigo-600 to-violet-600 text-white' : 'border-glass/20 bg-glass/5 text-slate-300 hover:bg-glass/10')"
      type="button"
      @click="toggle(item.friend.id)"
    >
      <span aria-hidden class="grid h-5 w-5 place-items-center rounded-full bg-white/20 text-[9px]">{{ avatarInitials('', item.friend.email) }}</span>
      {{ item.friend.uniqueTag }}
    </button>
  </div>
</template>
