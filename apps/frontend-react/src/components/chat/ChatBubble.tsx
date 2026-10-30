import { cn } from '../../lib/cn'
import type { ChatMessage } from '../../hooks/useChatThreads'

// Burbuja glassmorphic: el usuario en índigo translúcido, la IA en slate oscuro.
export function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <li className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'glass-card max-w-[80%] px-4 py-3 text-sm leading-6 shadow-none',
          isUser ? 'border-indigo-400/30 bg-indigo-500/25 text-indigo-50' : 'bg-slate-800/50 text-slate-200',
        )}
      >
        {message.text}
      </div>
    </li>
  )
}
