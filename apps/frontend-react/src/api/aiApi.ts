import axiosClient from './axiosClient'
import { getTaskById } from './tasksApi'
import type { AiChatResponse, AiChatTurn, AiSubtasksResponse, AiSummaryResponse } from '../types/api'

// El backend recibe título y descripción, no el id: se resuelven desde la tarea guardada.
export async function generateSubtasks(taskId: string) {
  const task = await getTaskById(taskId)
  const { data } = await axiosClient.post<AiSubtasksResponse>('/api/ai/generate-subtasks', {
    title: task.title,
    description: task.description ?? undefined,
  })
  return data.subtasks
}

export async function getDailySummary() {
  const { data } = await axiosClient.post<AiSummaryResponse>('/api/ai/summarize', {})
  return data.summary
}

// El historial es la conversación previa del hilo; el backend recibe como máximo 20 turnos.
export async function sendChatMessage(message: string, history: AiChatTurn[]) {
  const { data } = await axiosClient.post<AiChatResponse>('/api/ai/chat', { message, history })
  return data.reply
}
