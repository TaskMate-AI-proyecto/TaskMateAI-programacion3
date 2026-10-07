export interface HealthResponse {
  status: 'ok' | 'error'
  timestamp: string
  database: 'connected' | 'unavailable'
}

export interface AuthUser {
  id: string
  email: string
}

export interface AuthResponse {
  success: true
  token: string
  user: AuthUser
}

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
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
}

export interface TaskInput {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  dueDate?: string
  categoryId?: string
}

export interface TaskQuery {
  categoryId?: string
  completed?: boolean
}