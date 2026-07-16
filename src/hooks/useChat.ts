import { useCallback, useEffect, useRef, useState } from 'react'
import type { Message, Responder, ToolCall } from '../lib/chatEngine'

// Ids are unique across the whole session; they only ever move forward.
let nextId = 1

/** Insert or update a tool call in place, matched by toolCallId. Later
 *  events omit fields sent earlier (completed has no input), so missing
 *  fields keep their previous values. */
function upsertTool(tools: ToolCall[] | undefined, call: ToolCall): ToolCall[] {
  const list = tools ?? []
  const at = list.findIndex((t) => t.toolCallId === call.toolCallId)
  if (at === -1) return [...list, call]
  return list.map((t, i) =>
    i === at
      ? {
          ...t,
          status: call.status,
          input: call.input ?? t.input,
          output: call.output ?? t.output,
          error: call.error ?? t.error,
        }
      : t,
  )
}

/**
 * Drives a conversation from any Responder: appends the user turn, streams the
 * assistant reply (thinking, tool calls, then content), and tracks the busy
 * state. An in-flight stream is cancelled on reset or unmount via
 * AbortController.
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
              // Deltas carry their own whitespace; concatenate verbatim.
              // Reactivates the shimmer when thinking resumes after a tool call.
              patch(assistantId, (m) => ({
                thinking: (m.thinking ?? '') + event.delta,
                thinkingActive: true,
              }))
              break
            case 'thinking-done':
              patch(assistantId, (m) => ({
                thinking: event.fullText ?? m.thinking,
                thinkingActive: false,
                thinkingSec: Math.max(2, Math.round((Date.now() - thinkingStart) / 1000)),
                streaming: true,
              }))
              break
            case 'content':
              patch(assistantId, (m) => ({
                content: m.content + event.delta,
                // A response with no thinking phase jumps straight to streaming.
                thinkingActive: false,
                streaming: true,
              }))
              break
            case 'done':
              patch(assistantId, (m) => ({
                content: event.fullText ?? m.content,
                streaming: false,
                thinkingActive: false,
              }))
              break
            case 'tool':
              patch(assistantId, (m) => ({
                tools: upsertTool(m.tools, event.toolCall),
                // Tool activity means reasoning display is no longer "the" spinner.
                thinkingActive: false,
              }))
              break
            case 'sources':
              // Sources arrive once, whole — no merging needed.
              patch(assistantId, () => ({ sources: event.sources }))
              break
            case 'error':
              patch(assistantId, () => ({
                error: { message: event.message, recoverable: event.recoverable },
                streaming: false,
                thinkingActive: false,
              }))
              break
          }
        }
        if (!signal.aborted) patch(assistantId, () => ({ streaming: false, thinkingActive: false }))
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          // Surface unexpected responder failures in the conversation instead
          // of letting them escape as an unhandled rejection.
          patch(assistantId, () => ({
            error: {
              message: err instanceof Error ? err.message : String(err),
              recoverable: false,
            },
            streaming: false,
            thinkingActive: false,
          }))
        }
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
