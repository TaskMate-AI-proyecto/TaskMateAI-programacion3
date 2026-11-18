// Entradas de la paleta: comandos fijos (navegación y acciones) y datos dinámicos (tareas y amigos).
// Este archivo es idéntico en apps/frontend-react y apps/frontend-vue; solo cambian las rutas de los tipos de la API.
import type { Friend, Task, TaskStatus } from '../types/api'
import type { CommandItem } from './commandSearch'

export interface PaletteEntry extends CommandItem {
  run: () => void
}

// Lo que la app sabe hacer desde la paleta; cada framework lo implementa con su router y su estado.
export interface CommandActions {
  go: (path: string) => void
  openKanban: () => void
  openFriends: () => void
  newTask: () => void
  toggleTheme: () => void
  exportReport: () => void
}

// Navegación y acciones rápidas: siempre disponibles, aunque los datos todavía no hayan llegado.
export function staticEntries(actions: CommandActions): PaletteEntry[] {
  return [
    { id: 'nav:inicio', category: 'Vistas', label: 'Inicio', shortcut: 'G I', keywords: ['panel', 'resumen', 'dashboard', 'home'], run: () => actions.go('/dashboard') },
    { id: 'nav:tareas', category: 'Vistas', label: 'Tareas', shortcut: 'G T', keywords: ['lista', 'pendientes', 'tasks', 'todo'], run: () => actions.go('/tasks') },
    { id: 'nav:kanban', category: 'Vistas', label: 'Kanban', shortcut: 'G K', keywords: ['tablero', 'columnas', 'board'], run: () => actions.openKanban() },
    { id: 'nav:mensajes', category: 'Vistas', label: 'Mensajes', shortcut: 'G M', keywords: ['chat directo', 'conversaciones', 'dm'], run: () => actions.go('/messages') },
    { id: 'nav:amigos', category: 'Vistas', label: 'Amigos', shortcut: 'G A', keywords: ['contactos', 'solicitudes', 'friends'], run: () => actions.openFriends() },
    { id: 'nav:logros', category: 'Vistas', label: 'Logros', shortcut: 'G L', keywords: ['nivel', 'racha', 'xp', 'insignias', 'progreso', 'achievements'], run: () => actions.go('/achievements') },
    { id: 'nav:chat', category: 'Vistas', label: 'Chat IA', shortcut: 'G C', keywords: ['asistente', 'ia', 'bot', 'chat', 'ai'], run: () => actions.go('/chat') },
    { id: 'nav:ajustes', category: 'Vistas', label: 'Ajustes', shortcut: 'G S', keywords: ['configuración', 'preferencias', 'settings'], run: () => actions.go('/settings') },
    { id: 'act:nueva-tarea', category: 'Acciones', label: 'Nueva tarea', shortcut: 'N', keywords: ['crear', 'añadir', 'agregar'], run: () => actions.newTask() },
    { id: 'act:tema', category: 'Acciones', label: 'Alternar tema (Ink Drop)', keywords: ['tema', 'modo oscuro', 'modo claro', 'dark', 'light'], run: () => actions.toggleTheme() },
    { id: 'act:reporte', category: 'Acciones', label: 'Exportar reporte PDF', keywords: ['pdf', 'informe', 'productividad', 'exportar'], run: () => actions.exportReport() },
  ]
}

const statusLabels: Record<TaskStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En curso',
  IN_REVIEW: 'En revisión',
  COMPLETED: 'Completada',
}

export interface TaskHandlers {
  open: (task: Task) => void
  toggle: (task: Task) => void
}

// Cada tarea ofrece dos entradas: abrirla o completarla (o reabrirla si ya está completada).
export function taskEntries(tasks: Task[], handlers: TaskHandlers): PaletteEntry[] {
  return tasks.flatMap((task): PaletteEntry[] => [
    { id: `task:open:${task.id}`, category: 'Tareas', label: `Abrir: ${task.title}`, hint: statusLabels[task.status], run: () => handlers.open(task) },
    {
      id: `task:toggle:${task.id}`,
      category: 'Tareas',
      label: `${task.status === 'COMPLETED' ? 'Reabrir' : 'Completar'}: ${task.title}`,
      run: () => handlers.toggle(task),
    },
  ])
}

// Amigos aceptados: abrir la conversación directa con cada uno, buscando por su identificador.
export function friendEntries(friends: Friend[], openDirectMessage: (friendId: string) => void): PaletteEntry[] {
  return friends.map((item): PaletteEntry => ({
    id: `friend:${item.friend.id}`,
    category: 'Amigos',
    label: `Mensaje a ${item.friend.uniqueTag}`,
    hint: 'Iniciar DM',
    run: () => openDirectMessage(item.friend.id),
  }))
}

// Espacios activos: cambiar el filtro de tareas y del canal. "Todos" quita el filtro.
export interface WorkspaceOption {
  id: string
  name: string
}

export function workspaceEntries(workspaces: WorkspaceOption[], select: (id: string | null) => void): PaletteEntry[] {
  // Sin espacios no hay nada que cambiar: la sección no aparece.
  if (workspaces.length === 0) return []

  return [
    { id: 'space:todos', category: 'Espacios', label: 'Espacio: Todos', keywords: ['todos', 'sin filtro', 'personal'], run: () => select(null) },
    ...workspaces.map((workspace): PaletteEntry => ({
      id: `space:${workspace.id}`,
      category: 'Espacios',
      label: `Espacio: ${workspace.name}`,
      hint: 'Cambiar de espacio',
      run: () => select(workspace.id),
    })),
  ]
}
