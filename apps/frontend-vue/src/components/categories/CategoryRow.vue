<script setup lang="ts">
import { ref } from 'vue'
import { Pencil, Trash2 } from 'lucide-vue-next'
import type { Category } from '../../types/api'
import ConfirmDelete from '../ui/ConfirmDelete.vue'

defineProps<{ category: Category; isBusy: boolean }>()

const emit = defineEmits<{ edit: [category: Category]; delete: [category: Category] }>()

const confirming = ref(false)
const rowActionClass = 'inline-grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-100'
</script>

<template>
  <li class="glass-card flex items-center gap-3 px-3 py-2">
    <span aria-hidden class="h-4 w-4 shrink-0 rounded-full" :style="{ backgroundColor: category.color }" />
    <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ category.name }}</span>
    <ConfirmDelete
      v-if="confirming"
      :is-busy="isBusy"
      @cancel="confirming = false"
      @confirm="emit('delete', category)"
    />
    <template v-else>
      <button :aria-label="`Editar ${category.name}`" :class="rowActionClass" type="button" @click="emit('edit', category)">
        <Pencil :size="15" />
      </button>
      <button :aria-label="`Eliminar ${category.name}`" :class="rowActionClass" type="button" @click="confirming = true">
        <Trash2 :size="15" />
      </button>
    </template>
  </li>
</template>
