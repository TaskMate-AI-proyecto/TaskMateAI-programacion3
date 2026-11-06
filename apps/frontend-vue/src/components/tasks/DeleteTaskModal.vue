<script setup lang="ts">
import type { Task } from '../../types/api'
import Modal from '../ui/Modal.vue'

defineProps<{
  task: Task
  isDeleting: boolean
}>()

defineEmits<{
  confirm: []
  close: []
}>()
</script>

<template>
  <Modal title="Eliminar tarea" @close="$emit('close')">
    <p class="text-sm leading-6 text-slate-400">
      Vas a eliminar <strong class="text-slate-100">{{ task.title }}</strong>. Esta acción no se puede deshacer.
    </p>
    <div class="flex justify-end gap-2 pt-6">
      <button
        :disabled="isDeleting"
        class="rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
        type="button"
        @click="$emit('close')"
      >
        Cancelar
      </button>
      <button
        :disabled="isDeleting"
        class="rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        type="button"
        @click="$emit('confirm')"
      >
        {{ isDeleting ? 'Eliminando...' : 'Eliminar' }}
      </button>
    </div>
  </Modal>
</template>
