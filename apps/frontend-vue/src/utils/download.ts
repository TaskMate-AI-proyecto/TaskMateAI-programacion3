// Nombre del reporte: Reporte_Productividad_TaskMate_AAAA-MM-DD.pdf (fecha local).
export function reportFileName(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

  return `Reporte_Productividad_TaskMate_${day}.pdf`
}

// Dispara la descarga de una URL (por ejemplo un blob) con el nombre indicado.
export function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
}
