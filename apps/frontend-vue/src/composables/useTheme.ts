import { onBeforeUnmount, ref } from 'vue'
import { applyTheme, changeTheme, followSystemTheme, nextTheme, onThemeChange, originOf, resolveTheme, type ThemeName } from '../theme/theme'

// Misma lógica que useTheme de React: estado, transición de tinta, seguimiento del sistema y sincronía entre controles.
export function useTheme() {
  const theme = ref<ThemeName>(resolveTheme())

  const stopFollowing = followSystemTheme((next) => {
    applyTheme(next)
    theme.value = next
  })
  const stopSyncing = onThemeChange((value) => {
    theme.value = value
  })
  onBeforeUnmount(() => {
    stopFollowing()
    stopSyncing()
  })

  function select(next: ThemeName, event?: MouseEvent) {
    changeTheme(next, originOf(event), (value) => {
      theme.value = value
    })
  }

  function toggle(event?: MouseEvent) {
    select(nextTheme(theme.value), event)
  }

  return { theme, toggle, select }
}
