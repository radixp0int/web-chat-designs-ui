import { useCallback, useEffect, useRef, useState } from 'react'
import type { Responder } from '../engine/chatEngine'
import type { Message, ToolCall } from '../types'

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
 * state.
 *
 * Sends funnel through a FIFO queue drained by a single pump, so messages
 * submitted mid-stream wait their turn (rendered with `queued: true`) instead
 * of being dropped. `stop` aborts the in-flight stream and pauses the queue;
 * `steer` aborts it and jumps a new message ahead of the queue. An interrupted
 * assistant message keeps its partial content, flagged `stopped: true`.
 */
export function useChat(responder: Responder) {
  const [messages, setMessages] = useState<Message[]>([])
  const [busy, setBusy] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  // Source of truth for the drain loop — the async pump can't read fresh React
  // state mid-flight. The `queued` flags on messages exist only to render.
  const queueRef = useRef<{ id: number; text: string }[]>([])
  // Synchronous re-entrancy guard: only one pump drains at a time.
  const busyRef = useRef(false)
  // Set by stop(): the queue holds until the next send/steer resumes it.
  const pausedRef = useRef(false)

  const patch = useCallback((id: number, apply: (m: Message) => Partial<Message>) => {
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, ...apply(m) } : m)))
  }, [])

  /** Run one full turn: dispatch the queued user bubble, stream the reply. */
  const runTurn = useCallback(
    async (text: string, userId: number) => {
      const controller = new AbortController()
      abortRef.current = controller
      const { signal } = controller

      const assistantId = nextId++
      // Move the dispatched user message to the end (it may have queued behind
      // other turns) and clear its queued flag, so its reply lands beneath it.
      setMessages((ms) => {
        const user = ms.find((m) => m.id === userId)
        const rest = ms.filter((m) => m.id !== userId)
        return [
          ...rest,
          user ? { ...user, queued: false } : { id: userId, role: 'user', content: text },
          { id: assistantId, role: 'assistant', content: '', thinking: '', thinkingActive: true },
        ]
      })

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
              // Sources (and their highlights) arrive once, whole — no merging.
              patch(assistantId, () => ({
                sources: event.sources,
                highlights: event.highlights,
              }))
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
        // An aborted turn keeps its partial content, marked as stopped.
        patch(assistantId, () =>
          signal.aborted
            ? { streaming: false, thinkingActive: false, stopped: true }
            : { streaming: false, thinkingActive: false },
        )
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          patch(assistantId, () => ({ streaming: false, thinkingActive: false, stopped: true }))
        } else {
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
        // Only the most recent turn owns the controller slot.
        if (abortRef.current === controller) abortRef.current = null
      }
    },
    [responder, patch],
  )

  /** Single consumer: drains the queue in FIFO order until empty or paused. */
  const pump = useCallback(async () => {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    try {
      while (queueRef.current.length > 0 && !pausedRef.current) {
        const next = queueRef.current.shift()!
        await runTurn(next.text, next.id)
      }
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }, [runTurn])

  const send = useCallback(
    (text: string) => {
      if (!text.trim()) return
      const id = nextId++
      // Rendered as queued when it can't dispatch immediately (a turn is
      // streaming, or stale queued messages are ahead of it).
      const queued = busyRef.current || queueRef.current.length > 0
      setMessages((ms) => [...ms, { id, role: 'user', content: text, queued }])
      queueRef.current.push({ id, text })
      pausedRef.current = false
      void pump()
    },
    [pump],
  )

  /** Abort the in-flight stream and hold the queue until the next send/steer. */
  const stop = useCallback(() => {
    pausedRef.current = true
    abortRef.current?.abort()
  }, [])

  /** Interrupt the current stream and answer this message next, ahead of the queue. */
  const steer = useCallback(
    (text: string) => {
      if (!text.trim()) return
      const id = nextId++
      setMessages((ms) => [...ms, { id, role: 'user', content: text }])
      queueRef.current.unshift({ id, text })
      pausedRef.current = false
      // A running pump picks this up as soon as the aborted turn unwinds; the
      // trailing pump() call covers the idle case and no-ops otherwise.
      abortRef.current?.abort()
      void pump()
    },
    [pump],
  )

  /** Remove a message from the queue before it sends. */
  const removeQueued = useCallback((id: number) => {
    queueRef.current = queueRef.current.filter((q) => q.id !== id)
    setMessages((ms) => ms.filter((m) => !(m.id === id && m.queued)))
  }, [])

  const reset = useCallback(() => {
    queueRef.current = []
    pausedRef.current = false
    abortRef.current?.abort()
    abortRef.current = null
    setMessages([])
    setBusy(false)
  }, [])

  useEffect(
    () => () => {
      queueRef.current = []
      abortRef.current?.abort()
    },
    [],
  )

  return { messages, busy, send, stop, steer, removeQueued, reset }
}
