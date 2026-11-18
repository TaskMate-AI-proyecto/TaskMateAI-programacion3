import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

// Avanza un paso cada intervalo mientras la acción está activa; se detiene al terminar o al desmontar.
export function useProgressStep(isActive: Ref<boolean>, lastStep: number, intervalMs = 2500) {
  const step = ref(0)
  let timer: number | undefined

  function stop() {
    if (timer === undefined) return
    window.clearInterval(timer)
    timer = undefined
  }

  watch(isActive, (active) => {
    stop()
    if (active) timer = window.setInterval(() => { step.value = Math.min(step.value + 1, lastStep) }, intervalMs)
  })

  onBeforeUnmount(stop)

  function reset() {
    step.value = 0
  }

  return { step, reset }
}
