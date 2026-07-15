import { useCallback, useEffect, useRef, useState } from 'react'
import type { Message, Responder } from '../lib/chatEngine'

// Ids are unique across the whole session; they only ever move forward.
let nextId = 1

/**
 * Drives a conversation from any Responder: appends the user turn, streams the
 * assistant reply (thinking, then content), and tracks the busy state. An
 * in-flight stream is cancelled on reset or unmount via AbortController.
 */
export function useChat(responder: Responder) {
  const [messages, setMessages] = useState<Message[]>([])
  const [busy, setBusy] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const patch = useCallback((id: number, apply: (m: Message) => Partial<Message>) => {
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, ...apply(m) } : m)))
  }, [])

  const send = useCallback(
    async (text: string) => {
      if (busy || !text.trim()) return

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const { signal } = controller

      const userId = nextId++
      const assistantId = nextId++
      setMessages((ms) => [
        ...ms,
        { id: userId, role: 'user', content: text },
        { id: assistantId, role: 'assistant', content: '', thinking: '', thinkingActive: true },
      ])
      setBusy(true)

      const thinkingStart = Date.now()
      try {
        for await (const event of responder(text, signal)) {
          if (signal.aborted) break
          switch (event.type) {
            case 'thinking':
              patch(assistantId, (m) => ({
                thinking: m.thinking ? `${m.thinking} ${event.delta}` : event.delta,
              }))
              break
            case 'thinking-done':
              patch(assistantId, () => ({
                thinkingActive: false,
                thinkingSec: Math.max(2, Math.round((Date.now() - thinkingStart) / 1000)),
                streaming: true,
              }))
              break
            case 'content':
              patch(assistantId, (m) => ({
                content: m.content ? `${m.content} ${event.delta}` : event.delta,
              }))
              break
          }
        }
        if (!signal.aborted) patch(assistantId, () => ({ streaming: false }))
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) throw err
      } finally {
        // Only the most recent stream owns the busy flag.
        if (abortRef.current === controller) {
          setBusy(false)
          abortRef.current = null
        }
      }
    },
    [busy, responder, patch],
  )

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setMessages([])
    setBusy(false)
  }, [])

  useEffect(() => () => abortRef.current?.abort(), [])

  return { messages, busy, send, reset }
}
