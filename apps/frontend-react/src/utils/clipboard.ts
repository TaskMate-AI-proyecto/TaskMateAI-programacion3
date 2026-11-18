// Copia un texto al portapapeles. Devuelve false si el navegador no lo permite.
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
