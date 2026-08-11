import { useCallback, useEffect, useRef, useState } from 'react'
import type { Responder } from '../engine/chatEngine'
import type { Message, ToolCall, TurnFault, TurnStep, TurnTrace } from '../types'

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

// --- Turn trace -------------------------------------------------------------
// Pure updates over a turn's trace, in the same spirit as upsertTool above.
// Every step's `at` and `ms` are relative to the trace's startedAt, so the
// whole timeline stays valid no matter when it's rendered.

/** Start a timed step. No-op if one with this id is already open, so a repeated
 *  delta (every `thinking` chunk, say) only opens its phase once. */
function openStep(trace: TurnTrace, step: Omit<TurnStep, 'at' | 'ms'>, now: number): TurnTrace {
  if (trace.steps.some((s) => s.id === step.id)) return trace
  return { ...trace, steps: [...trace.steps, { ...step, at: now - trace.startedAt }] }
}

/** Stop the clock on an open step. Already-closed steps keep their duration. */
function closeStep(trace: TurnTrace, id: string, now: number): TurnTrace {
  return {
    ...trace,
    steps: trace.steps.map((s) =>
      s.id === id && s.ms === undefined && s.at !== undefined
        ? { ...s, ms: now - trace.startedAt - s.at }
        : s,
    ),
  }
}

/** Record a fault the turn survived. Never downgrades a turn that already
 *  failed — a fatal error is the more specific outcome. `now` is omitted for a
 *  fault the responder only reported at the end, which leaves `at` unset so the
 *  panel can render it without a timestamp instead of inventing one. */
function addFault(trace: TurnTrace, fault: TurnFault, now?: number): TurnTrace {
  return {
    ...trace,
    status: trace.status === 'failed' ? 'failed' : 'recovered',
    steps: [
      ...trace.steps,
      {
        id: `fault-${trace.steps.length}`,
        label: 'Interrupted',
        kind: 'fault',
        ...(now === undefined ? {} : { at: now - trace.startedAt, ms: 0 }),
        fault,
      },
    ],
  }
}

/** Merge the faults a responder reports on `done` into a trace that may already
 *  hold streamed ones. A fault carrying a `code` already seen is dropped: the
 *  streamed copy is the same problem and knows when it happened. */
function mergeReportedFaults(trace: TurnTrace, faults: TurnFault[]): TurnTrace {
  const seen = new Set(
    trace.steps
      .filter((s) => s.kind === 'fault')
      .map((s) => s.fault?.code)
      .filter(Boolean),
  )
  return faults.reduce((acc, fault) => {
    if (fault.code && seen.has(fault.code)) return acc
    if (fault.code) seen.add(fault.code)
    return addFault(acc, fault)
  }, trace)
}

/** Mark a turn the reader ended themselves. Stopping is not a fault, but the
 *  trace still must not claim the turn was answered — a stopped message says
 *  "Stopped" right above the panel. A turn that already failed keeps that. */
function asStopped(trace: TurnTrace): TurnTrace {
  return trace.status === 'failed' ? trace : { ...trace, status: 'stopped' }
}

/** Close the trace and every step still open. Idempotent: a turn that ends
 *  fatally and then unwinds through the loop's tail can call this twice. */
function endTrace(trace: TurnTrace, now: number): TurnTrace {
  const total = trace.ms ?? now - trace.startedAt
  return {
    ...trace,
    ms: total,
    // An untimed step (`at` unset) has nothing to close — leave it alone.
    steps: trace.steps.map((s) =>
      s.ms === undefined && s.at !== undefined ? { ...s, ms: total - s.at } : s,
    ),
  }
}

/** Lift a trace update into a Message patch, skipping messages that have none. */
function traced(m: Message, fn: (t: TurnTrace) => TurnTrace): Partial<Message> {
  return m.trace ? { trace: fn(m.trace) } : {}
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
      const startedAt = Date.now()
      // Move the dispatched user message to the end (it may have queued behind
      // other turns) and clear its queued flag, so its reply lands beneath it.
      setMessages((ms) => {
        const user = ms.find((m) => m.id === userId)
        const rest = ms.filter((m) => m.id !== userId)
        return [
          ...rest,
          user ? { ...user, queued: false } : { id: userId, role: 'user', content: text },
          {
            id: assistantId,
            role: 'assistant',
            content: '',
            thinking: '',
            thinkingActive: true,
            trace: { status: 'ok', startedAt, steps: [] },
          },
        ]
      })

      const thinkingStart = startedAt
      try {
        for await (const event of responder(text, signal)) {
          if (signal.aborted) break
          const now = Date.now()
          switch (event.type) {
            case 'thinking':
              // Deltas carry their own whitespace; concatenate verbatim.
              // Reactivates the shimmer when thinking resumes after a tool call.
              patch(assistantId, (m) => ({
                thinking: (m.thinking ?? '') + event.delta,
                thinkingActive: true,
                ...traced(m, (t) =>
                  openStep(t, { id: 'thinking', label: 'Reasoning', kind: 'thinking' }, now),
                ),
              }))
              break
            case 'thinking-done':
              patch(assistantId, (m) => ({
                thinking: event.fullText ?? m.thinking,
                thinkingActive: false,
                thinkingSec: Math.max(2, Math.round((Date.now() - thinkingStart) / 1000)),
                streaming: true,
                ...traced(m, (t) => closeStep(t, 'thinking', now)),
              }))
              break
            case 'content':
              patch(assistantId, (m) => ({
                content: m.content + event.delta,
                // A response with no thinking phase jumps straight to streaming.
                thinkingActive: false,
                streaming: true,
                ...traced(m, (t) =>
                  openStep(t, { id: 'content', label: 'Answering', kind: 'content' }, now),
                ),
              }))
              break
            case 'done':
              patch(assistantId, (m) => ({
                content: event.fullText ?? m.content,
                streaming: false,
                thinkingActive: false,
                ...traced(m, (t) => {
                  const withMeta = { ...t, model: event.model, tokens: event.tokens }
                  // Reported faults land before the trace closes, so they're
                  // included in the status but never get a fabricated timestamp.
                  const merged = event.errors?.length
                    ? mergeReportedFaults(withMeta, event.errors)
                    : withMeta
                  return endTrace(merged, now)
                }),
              }))
              break
            case 'tool':
              patch(assistantId, (m) => ({
                tools: upsertTool(m.tools, event.toolCall),
                // Tool activity means reasoning display is no longer "the" spinner.
                thinkingActive: false,
                ...traced(m, (t) => {
                  const { toolCallId, name, status } = event.toolCall
                  if (status === 'started')
                    return openStep(t, { id: toolCallId, label: name, kind: 'tool' }, now)
                  const closed = closeStep(t, toolCallId, now)
                  // A failed tool the model worked around still leaves the turn
                  // answerable — the chip carries the failure on its own.
                  return status === 'failed' && closed.status === 'ok'
                    ? { ...closed, status: 'recovered' }
                    : closed
                }),
              }))
              break
            case 'sources':
              // Sources (and their highlights) arrive once, whole — no merging.
              patch(assistantId, () => ({
                sources: event.sources,
                highlights: event.highlights,
              }))
              break
            case 'followups':
              patch(assistantId, () => ({ followups: event.items }))
              break
            case 'error':
              // A recoverable error is a fact about the stream, not a problem
              // the reader has to act on: the answer is still coming. It lands
              // on the trace and leaves `streaming` alone so content resumes.
              if (event.recoverable) {
                patch(assistantId, (m) => traced(m, (t) => addFault(t, event.fault, now)))
                break
              }
              patch(assistantId, (m) => ({
                error: event.fault,
                streaming: false,
                thinkingActive: false,
                ...traced(m, (t) => endTrace({ ...t, status: 'failed' }, now)),
              }))
              break
          }
        }
        // An aborted turn keeps its partial content, marked as stopped.
        patch(assistantId, (m) => ({
          streaming: false,
          thinkingActive: false,
          ...(signal.aborted ? { stopped: true } : {}),
          ...traced(m, (t) => endTrace(signal.aborted ? asStopped(t) : t, Date.now())),
        }))
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          patch(assistantId, (m) => ({
            streaming: false,
            thinkingActive: false,
            stopped: true,
            ...traced(m, (t) => endTrace(asStopped(t), Date.now())),
          }))
        } else {
          // Surface unexpected responder failures in the conversation instead
          // of letting them escape as an unhandled rejection.
          patch(assistantId, (m) => ({
            error: {
              message: err instanceof Error ? err.message : String(err),
              code: 'RESPONDER_THREW',
              source: 'responder',
            },
            streaming: false,
            thinkingActive: false,
            ...traced(m, (t) => endTrace({ ...t, status: 'failed' }, Date.now())),
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

  /**
   * Re-run the turn that produced an assistant message. Drops that answer and
   * re-queues the user message that prompted it; `runTurn` re-finds the user
   * bubble by id and moves it back to the end, so no id bookkeeping is needed.
   */
  const retry = useCallback(
    (assistantId: number) => {
      const at = messages.findIndex((m) => m.id === assistantId)
      if (at === -1) return
      const user = messages.slice(0, at).findLast((m) => m.role === 'user')
      if (!user) return
      setMessages((ms) => ms.filter((m) => m.id !== assistantId))
      queueRef.current.push({ id: user.id, text: user.content })
      pausedRef.current = false
      void pump()
    },
    [messages, pump],
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

  return { messages, busy, send, stop, steer, retry, removeQueued, reset }
}
