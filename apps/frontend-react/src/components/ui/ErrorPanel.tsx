import { RefreshCw } from 'lucide-react'

export function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="empty-state rounded-md" role="alert">
      <p className="text-coral">{message}</p>
      <button className="command-button" onClick={onRetry} type="button"><RefreshCw size={16} />Reintentar</button>
    </div>
  )
}
