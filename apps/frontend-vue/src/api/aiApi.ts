import { http } from './http'
import { getTaskById } from './tasksApi'
import type { AiChatResponse, AiChatTurn, AiSubtasksResponse, AiSummaryResponse } from '../types/api'
import { assistantStyle, loadSettings } from '../settings/settings'

// El backend recibe título y descripción, no el id: se resuelven desde la tarea guardada.
export async function generateSubtasks(taskId: string) {
  const task = await getTaskById(taskId)
  const { data } = await http.post<AiSubtasksResponse>('/api/ai/generate-subtasks', {
    title: task.title,
    description: task.description ?? undefined,
  })
  return data.subtasks
}

// Resumen del día: el backend genera el texto a partir de las tareas del usuario.
export async function getDailySummary() {
  const { data } = await http.post<AiSummaryResponse>('/api/ai/summarize', {})
  return data.summary
}

// El historial es la conversación previa del hilo; el backend acepta como máximo 20 turnos.
// Devuelve la respuesta y los cambios de tareas que el backend aplicó al ejecutar comandos.
export async function sendChatMessage(message: string, history: AiChatTurn[]) {
  // La personalidad y las instrucciones de Ajustes viajan con cada mensaje.
  const { data } = await http.post<AiChatResponse>('/api/ai/chat', { message, history, assistant: assistantStyle(loadSettings()) })
  return { reply: data.reply, changes: data.changes }
}
