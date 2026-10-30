import { getTasks } from '../api/tasksApi'
import { getApiErrorMessage } from '../api/errors'
import { ChatContextPanel } from '../components/chat/ChatContextPanel'
import { ChatThreadList } from '../components/chat/ChatThreadList'
import { ChatWindow } from '../components/chat/ChatWindow'
import { useAsyncData } from '../hooks/useAsyncData'
import { useAuth } from '../hooks/useAuth'
import { useChatThreads } from '../hooks/useChatThreads'
import type { Task } from '../types/api'

const describeError = (error: unknown) => getApiErrorMessage(error, 'No se pudieron cargar las tareas.')

function pendingTasks(tasks: Task[] | null) {
  return (tasks ?? []).filter((task) => task.status !== 'COMPLETED')
}

export function ChatPage() {
  const { user } = useAuth()
  const chat = useChatThreads()
  const { data: tasks } = useAsyncData(() => getTasks(), 'chat-tasks', { describeError })

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)_280px]">
      <ChatThreadList
        activeId={chat.activeId}
        onNew={chat.startConversation}
        onSearch={chat.setSearch}
        onSelect={chat.selectThread}
        search={chat.search}
        threads={chat.threads}
      />
      <ChatWindow isSending={chat.isSending} onSend={(text) => void chat.sendMessage(text)} thread={chat.active} />
      <ChatContextPanel email={user?.email} pending={pendingTasks(tasks)} />
    </div>
  )
}
