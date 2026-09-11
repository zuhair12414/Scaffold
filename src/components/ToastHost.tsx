import { useEffect, useState } from 'react'
import { onNotify } from '../state/toast'

export function ToastHost() {
  const [messages, setMessages] = useState<{ id: number; text: string }[]>([])

  useEffect(() => onNotify((text) => {
    const id = Date.now() + Math.random()
    setMessages((current) => [...current, { id, text }])
    window.setTimeout(() => setMessages((current) => current.filter((item) => item.id !== id)), 2800)
  }), [])

  if (!messages.length) return null
  return (
    <div className="toast-host" role="status" aria-live="polite">
      {messages.map((message) => (
        <p key={message.id} className="toast">{message.text}</p>
      ))}
    </div>
  )
}
