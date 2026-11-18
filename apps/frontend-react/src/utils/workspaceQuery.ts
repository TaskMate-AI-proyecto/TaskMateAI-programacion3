// Parte de la consulta de tareas que filtra por espacio. Cadena vacía = sin filtro.
export function workspaceQuery(workspaceId: string) {
  return { workspaceId: workspaceId || undefined }
}
