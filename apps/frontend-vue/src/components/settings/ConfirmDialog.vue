<script setup lang="ts">
import Modal from '../ui/Modal.vue'

withDefaults(defineProps<{ title: string; message: string; confirmLabel: string; busy?: boolean }>(), { busy: false })

defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <Modal :title="title" @close="$emit('cancel')">
    <p class="text-sm leading-6 text-slate-400">{{ message }}</p>
    <div class="flex justify-end gap-2 pt-6">
      <button :disabled="busy" class="rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50" type="button" @click="$emit('cancel')">
        Cancelar
      </button>
      <button :disabled="busy" class="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" type="button" @click="$emit('confirm')">
        {{ confirmLabel }}
      </button>
    </div>
  </Modal>
</template>
