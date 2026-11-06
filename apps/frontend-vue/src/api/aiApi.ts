import { http } from './http'
import type { AiChatResponse, AiChatTurn } from '../types/api'

// El historial es la conversación previa del hilo; el backend acepta como máximo 20 turnos.
// Devuelve la respuesta y los cambios de tareas que el backend aplicó al ejecutar comandos.
export async function sendChatMessage(message: string, history: AiChatTurn[]) {
  const { data } = await http.post<AiChatResponse>('/api/ai/chat', { message, history })
  return { reply: data.reply, changes: data.changes }
}
