export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface Category {
  id: string
  name: string
  color: string
}

export interface CategoryInput {
  name: string
  color?: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  categoryId: string | null
  category: Category | null
  // Espacio compartido al que pertenece la tarea, si lo tiene.
  workspaceId?: string | null
  // Amigos colaboradores de la tarea (si los hay).
  assignedUsers?: AssignedUser[]
}

export interface TaskInput {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  dueDate?: string
  categoryId?: string
  workspaceId?: string
  collaboratorIds?: string[]
}

export interface TaskQuery {
  categoryId?: string
  workspaceId?: string
  completed?: boolean
}

export interface AiChatTurn {
  role: 'user' | 'assistant'
  text: string
}

export interface AiSubtasksResponse {
  success: true
  subtasks: string[]
}

export interface AiSummaryResponse {
  success: true
  summary: string
}

// Tareas que el asistente creó, editó o eliminó al ejecutar comandos de la conversación.
export interface AiTaskChanges {
  created: Task[]
  updated: Task[]
  deletedIds: string[]
}

export interface AiChatResponse {
  success: true
  reply: string
  changes: AiTaskChanges
}

// Mensajería directa: contactos con su último mensaje y los no leídos.
export interface MessageContact {
  id: string
  email: string
  unreadCount: number
  lastMessage: { content: string; createdAt: string; fromMe: boolean } | null
}

// Mensaje directo (receiverId) o del canal grupal de un espacio (workspaceId, sin receptor).
export interface DirectMessage {
  id: string
  senderId: string
  receiverId: string | null
  workspaceId?: string | null
  content: string
  readAt: string | null
  createdAt: string
  sender?: { id: string; uniqueTag: string }
}

// Espacio compartido (proyecto) con amigos.
export interface Workspace {
  id: string
  name: string
  icon: string
  color: string
  ownerId: string
  createdAt: string
  role: 'OWNER' | 'MEMBER' | null
  shared: boolean
  memberCount: number
  pendingTasks: number
  members: { id: string; uniqueTag: string; role: 'OWNER' | 'MEMBER' }[]
}

// Amistades y tareas colaborativas.
export interface UserSummary {
  id: string
  email: string
  uniqueTag: string
}

export interface AssignedUser {
  id: string
  email: string
  uniqueTag: string
}

export interface Friend {
  friendshipId: string
  // Nivel y racha actual del amigo: el backend los envía siempre, pero se marcan opcionales para no romper mocks antiguos.
  friend: UserSummary & { level?: number; currentStreak?: number }
  since: string
}

// Gamificación: lo que devuelve PUT /api/tasks/:id cuando una tarea pasa a COMPLETED.
export interface CompletionReward {
  xpGained: number
  xp: number
  level: number
  currentStreak: number
  longestStreak: number
  newAchievements: { key: string; title: string }[]
}

export type TaskWithReward = Task & { reward?: CompletionReward | null }

export interface AchievementStatus {
  key: string
  title: string
  description: string
  unlocked: boolean
  unlockedAt: string | null
}

export interface GamificationProfile {
  xp: number
  level: number
  levelStartXp: number
  nextLevelXp: number
  currentStreak: number
  longestStreak: number
  achievements: AchievementStatus[]
}

export interface FriendRequest {
  id: string
  direction: 'incoming' | 'outgoing'
  user: UserSummary
  createdAt: string
  expiresAt: string
  daysLeft: number
}

export interface UserSearchResult {
  id: string
  uniqueTag: string
  relation: 'none' | 'friend' | 'outgoing' | 'incoming'
}
