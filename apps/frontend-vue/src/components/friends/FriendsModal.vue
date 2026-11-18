<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, Copy, Flame, Search, X } from 'lucide-vue-next'
import { searchUsers } from '../../api/friendsApi'
import { getApiErrorMessage } from '../../api/errors'
import { useFriends } from '../../composables/useFriends'
import { avatarInitials } from '../../settings/settings'
import { useToastStore } from '../../stores/toast'
import type { UserSearchResult } from '../../types/api'
import { copyText } from '../../utils/clipboard'
import Modal from '../ui/Modal.vue'

// Amigos: tu identificador para compartirlo, búsqueda para enviar solicitudes y la gestión de las recibidas.
const emit = defineEmits<{ close: [] }>()

const { me, friends, requests, error, send, respond } = useFriends()
const toast = useToastStore()
const query = ref('')
const results = ref<UserSearchResult[]>([])
const searching = ref(false)

const relationLabels: Record<UserSearchResult['relation'], string> = {
  none: '',
  friend: 'Ya sois amigos',
  outgoing: 'Solicitud enviada',
  incoming: 'Te envió una solicitud',
}

// Botones con el mismo gesto en toda la app: crecen al pasar el cursor y se encogen al pulsar.
const animatedButton = 'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition duration-200 hover:scale-105 active:scale-95 disabled:opacity-60'

const incoming = computed(() => requests.value.filter((request) => request.direction === 'incoming'))
const outgoing = computed(() => requests.value.filter((request) => request.direction === 'outgoing'))

function daysLabel(days: number) {
  return days === 1 ? '1 día' : `${days} días`
}

async function copyTag() {
  const tag = me.value?.uniqueTag
  if (!tag) return

  const copied = await copyText(tag)
  toast.notify(copied ? 'Identificador copiado' : 'No se pudo copiar', copied ? 'success' : 'error')
}

async function search() {
  searching.value = true
  try {
    results.value = await searchUsers(query.value.trim())
  } catch (err) {
    toast.notify(getApiErrorMessage(err, 'No se pudo buscar.'), 'error')
  } finally {
    searching.value = false
  }
}

async function sendTo(result: UserSearchResult) {
  if (!(await send(result.uniqueTag))) return

  results.value = results.value.map((item) => (item.id === result.id ? { ...item, relation: 'outgoing' } : item))
}
</script>

<template>
  <Modal title="Amigos" @close="emit('close')">
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-glass/10 bg-glass/5 p-4">
        <div>
          <p class="text-xs text-slate-400">Tu identificador</p>
          <p class="font-mono text-lg font-semibold text-slate-100">{{ me?.uniqueTag ?? '…' }}</p>
        </div>
        <button :class="`${animatedButton} border border-glass/20 text-slate-100 hover:bg-glass/10`" :disabled="!me" type="button" @click="copyTag">
          <Copy :size="15" />Copiar
        </button>
      </div>

      <section class="space-y-3">
        <h3 class="text-sm font-semibold text-slate-200">Buscar amigos</h3>
        <form class="flex gap-2" @submit.prevent="search">
          <input
            v-model="query"
            aria-label="Identificador a buscar"
            class="settings-field min-w-0 flex-1"
            maxlength="40"
            placeholder="@usuario_1a2b3c"
            type="text"
          />
          <button :class="`${animatedButton} border border-glass/20 text-slate-100 hover:bg-glass/10`" :disabled="searching || query.trim().length < 2" type="submit">
            <Search :size="15" />Buscar
          </button>
        </form>
        <ul v-if="results.length > 0" class="space-y-2">
          <li v-for="result in results" :key="result.id" class="flex items-center gap-3 rounded-xl border border-glass/10 bg-glass/5 px-3 py-2">
            <span class="min-w-0 flex-1 truncate font-medium text-slate-100">{{ result.uniqueTag }}</span>
            <button
              v-if="result.relation === 'none'"
              :class="`${animatedButton} bg-gradient-to-r from-indigo-600 to-violet-600 text-white`"
              type="button"
              @click="sendTo(result)"
            >
              Enviar solicitud
            </button>
            <span v-else class="text-xs text-slate-400">{{ relationLabels[result.relation] }}</span>
          </li>
        </ul>
      </section>

      <p v-if="error" aria-live="polite" class="text-sm text-coral">{{ error }}</p>

      <section class="space-y-3">
        <h3 class="text-sm font-semibold text-slate-200">Solicitudes recibidas</h3>
        <p v-if="incoming.length === 0" class="text-sm text-slate-400">No tienes solicitudes pendientes.</p>
        <ul v-else class="space-y-2">
          <li v-for="request in incoming" :key="request.id" class="flex flex-wrap items-center gap-3 rounded-xl border border-glass/10 bg-glass/5 p-3">
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium text-slate-100">{{ request.user.uniqueTag }}</p>
              <p class="text-xs text-amber-700 dark:text-amber-300">Caduca en {{ daysLabel(request.daysLeft) }}</p>
            </div>
            <button :class="`${animatedButton} bg-mint text-white`" type="button" @click="respond(request.id, 'accept')">
              <Check :size="15" />Aceptar
            </button>
            <button :class="`${animatedButton} border border-coral/40 text-coral`" type="button" @click="respond(request.id, 'reject')">
              <X :size="15" />Rechazar
            </button>
          </li>
        </ul>
        <p v-for="request in outgoing" :key="request.id" class="text-xs text-slate-400">
          Enviada a {{ request.user.uniqueTag }} · caduca en {{ daysLabel(request.daysLeft) }}
        </p>
      </section>

      <section class="space-y-3">
        <h3 class="text-sm font-semibold text-slate-200">Tus amigos ({{ friends.length }})</h3>
        <p v-if="friends.length === 0" class="text-sm text-slate-400">Aún no tienes amigos. Busca a alguien por su identificador.</p>
        <ul v-else class="space-y-2">
          <li v-for="item in friends" :key="item.friendshipId" class="flex items-center gap-3">
            <span aria-hidden class="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white">
              {{ avatarInitials('', item.friend.email) }}
            </span>
            <span class="min-w-0 flex-1 truncate text-sm text-slate-100">{{ item.friend.uniqueTag }}</span>
            <!-- Nivel y racha del amigo; si la API no los envía, no se muestran. -->
            <span v-if="item.friend.level !== undefined" class="flex shrink-0 items-center gap-1.5 text-xs font-semibold">
              <span class="rounded-full border border-indigo-400/40 bg-indigo-500/10 px-2 py-0.5 text-indigo-600 dark:text-indigo-300">Nvl {{ item.friend.level }}</span>
              <span class="inline-flex items-center gap-1 rounded-full border border-coral/30 bg-coral/10 px-2 py-0.5 text-coral">
                <Flame :size="12" />{{ item.friend.currentStreak ?? 0 }}
              </span>
            </span>
          </li>
        </ul>
      </section>
    </div>
  </Modal>
</template>
