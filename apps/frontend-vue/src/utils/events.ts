// Valor de un campo de texto desde su evento de entrada, sin asertar tipos.
export function eventValue(event: Event) {
  const target = event.target

  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement ? target.value : ''
}
