<script setup lang="ts">
import { computed } from 'vue'
import { Moon, Sun } from 'lucide-vue-next'
import { useTheme } from '../../composables/useTheme'

// Botón de icono que alterna claro y oscuro con la transición de tinta desde el punto del clic.
const { theme, toggle } = useTheme()
const isDark = computed(() => theme.value === 'dark')
const label = computed(() => (isDark.value ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'))
</script>

<template>
  <button :aria-label="label" :title="label" class="icon-button" type="button" @click="toggle($event)">
    <Sun v-if="isDark" :size="18" />
    <Moon v-else :size="18" />
  </button>
</template>
