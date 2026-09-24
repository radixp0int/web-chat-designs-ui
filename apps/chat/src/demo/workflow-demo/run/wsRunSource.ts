// A run driven by the workflow server.
//
// Same posture as lib/engine/wsResponder.ts — it never throws, and a socket it
// cannot reach becomes an ordinary error event rather than an exception. Two
// things differ, both because this channel is bi-directional:
//
//  1. The socket is long-lived. The chat responder opens one per message and
//     lets a close mean "cancel"; here a close means the run has lost its only
//     way of hearing that you approved something.
//  2. It is therefore shared and refcounted. StrictMode mounts every effect
//     twice, so a naive open-on-subscribe would produce two sockets, two
//     `run.start`s and two runs on the server — the second one invisible.
import { feeds, never, type EdgeSeed, type StatusMap } from '../canvas'
import { placeRun } from './layout'
import type { RunEvent, RunGraph, RunSource } from './types'
import type {
  ClientMessage,
  Decision,
  ServerMessage,
  VariantInfo,
  WireEdge,
  WireRun,
} from './wireProtocol'

/** Long enough to outlive a StrictMode remount, short enough to feel immediate. */
const CLOSE_GRACE_MS = 250
const RECONNECT_MIN_MS = 1_000
const RECONNECT_MAX_MS = 8_000
/** Survives a reload, dies with the tab — which is what "resume this run" means. */
const RUN_ID_KEY = 'workflow-run-id'
const VARIANT_KEY = 'workflow-variant-id'

/** sessionStorage throws in some embedding contexts; a demo must not care. */
function remember(key: string, value: string | null) {
  try {
    if (value === null) sessionStorage.removeItem(key)
    else sessionStorage.setItem(key, value)
  } catch {
    /* not worth a failure */
  }
}

function recall(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

/** Only the rule crosses the wire; the kit wants the function back. */
function rehydrateEdges(edges: WireEdge[]): EdgeSeed[] {
  return edges.map(({ from, to, rule }) => ({
    from,
    to,
    state: rule === 'never' ? never : feeds(to),
  }))
}

function toGraph(run: WireRun, epoch: number): RunGraph {
  const { steps, lanes, laneTop, laneBottom, stageLayout } = placeRun(run.steps, run.stages)
  return {
    runId: run.runId,
    variantId: run.variantId,
    title: run.title,
    header: run.header,
    actor: run.actor,
    stages: run.stages.map((s) => ({ id: s.id, name: s.name, sub: s.sub, status: s.status })),
    steps,
    stepById: new Map(steps.map((s) => [s.id, s])),
    edges: rehydrateEdges(run.edges),
    stageLayout,
    lanes,
    laneTop,
    laneBottom,
    focusStepId: run.focusStepId,
    epoch,
  }
}

export function createWsRunSource(url: string): RunSource {
  const listeners = new Set<(event: RunEvent) => void>()

  let socket: WebSocket | null = null
  let closeTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let backoff = RECONNECT_MIN_MS
  let variants: VariantInfo[] = []
  let runId: string | null = recall(RUN_ID_KEY)
  let wantedVariant = recall(VARIANT_KEY) ?? 'loan-review'
  /** Replayed to a late subscriber so a second panel needs no round trip. */
  let lastSnapshot: RunEvent | null = null
  let lastSeq = -1
  let epoch = 0
  /** Set while the user asked for something the socket wasn't up for yet. */
  let queued: ClientMessage | null = null

  const emit = (event: RunEvent) => {
    if (event.type === 'snapshot') lastSnapshot = event
    listeners.forEach((l) => l(event))
  }

  const send = (message: ClientMessage) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message))
      return
    }
    // The socket is still coming up (or coming back). Hold the last intent and
    // replay it on open, rather than dropping the click.
    queued = message
    open()
  }

  const translate = (message: ServerMessage): RunEvent[] => {
    switch (message.type) {
      case 'run.snapshot': {
        variants = message.variants
        runId = message.run.runId
        remember(RUN_ID_KEY, runId)
        remember(VARIANT_KEY, message.run.variantId)
        wantedVariant = message.run.variantId
        const statuses: StatusMap = { ...message.run.statuses }
        return [
          {
            type: 'snapshot',
            graph: toGraph(message.run, ++epoch),
            statuses,
            phase: message.run.phase,
            log: message.log,
            awaiting: message.run.awaiting,
          },
        ]
      }
      case 'step.update':
        return [{ type: 'step', stepId: message.stepId, change: message.patch }]
      case 'stage.update':
        return [{ type: 'stage', stageId: message.stageId, change: message.patch }]
      case 'log.append':
        return [{ type: 'log', entries: message.entries }]
      case 'run.awaiting':
        return [{ type: 'awaiting', stepId: message.stepId, decisions: message.decisions }]
      case 'run.phase':
        return [{ type: 'phase', phase: message.phase }]
      case 'run.error':
        return [
          {
            type: 'error',
            message: message.message,
            code: message.code,
            recoverable: message.recoverable,
          },
        ]
    }
  }

  function open() {
    if (socket && socket.readyState !== WebSocket.CLOSED) return
    if (reconnectTimer) return

    emit({ type: 'connection', state: 'connecting' })
    let ws: WebSocket
    try {
      ws = new WebSocket(url)
    } catch {
      emit({
        type: 'error',
        message: `Could not open a socket to ${url}. Start the workflow server with \`npm run dev\`.`,
        code: 'SOCKET_UNREACHABLE',
        recoverable: true,
      })
      return
    }
    socket = ws

    ws.onopen = () => {
      backoff = RECONNECT_MIN_MS
      emit({ type: 'connection', state: 'open' })
      // Resume the run this tab was already watching; otherwise begin one.
      const first: ClientMessage =
        queued ??
        (runId
          ? { type: 'run.attach', runId }
          : { type: 'run.start', variantId: wantedVariant as never })
      queued = null
      ws.send(JSON.stringify(first))
    }

    ws.onmessage = (raw) => {
      let message: ServerMessage
      try {
        message = JSON.parse(String(raw.data)) as ServerMessage
      } catch {
        return
      }
      // Monotonic per run, reset by every snapshot — which is what makes an
      // attach that lands mid-flight idempotent rather than a replay.
      if (message.type === 'run.snapshot') lastSeq = message.seq
      else if (message.seq <= lastSeq) return
      else lastSeq = message.seq

      // A run the server has forgotten is not an error the reader can act on;
      // start a fresh one instead of showing them a dead end.
      if (message.type === 'run.error' && message.code === 'RUN_NOT_FOUND') {
        runId = null
        remember(RUN_ID_KEY, null)
        ws.send(JSON.stringify({ type: 'run.start', variantId: wantedVariant }))
        return
      }
      translate(message).forEach(emit)
    }

    ws.onclose = () => {
      socket = null
      emit({ type: 'connection', state: 'closed' })
      // A socket that closed without ever delivering a run never connected. Say
      // so, or the page waits on a skeleton forever for a server that isn't there.
      if (!lastSnapshot) {
        emit({
          type: 'error',
          message: `No workflow server at ${url}. Start it with \`npm run dev\` in workflow-ws-server, or open /workflow-demo for the hard-coded run.`,
          code: 'SOCKET_UNREACHABLE',
          recoverable: true,
        })
      }
      // Nobody is watching any more; this close was the intended one.
      if (listeners.size === 0) return
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        open()
      }, backoff)
      backoff = Math.min(backoff * 2, RECONNECT_MAX_MS)
    }

    // A failed connection arrives as error-then-close; onclose does the retry,
    // so this only has to stop the default unhandled-rejection noise.
    ws.onerror = () => {}
  }

  return {
    get variants() {
      return variants
    },

    subscribe(listener) {
      listeners.add(listener)
      if (closeTimer) {
        // A StrictMode remount, or a second panel — the socket is still good.
        clearTimeout(closeTimer)
        closeTimer = null
      }
      if (lastSnapshot) listener(lastSnapshot)
      open()

      return () => {
        listeners.delete(listener)
        if (listeners.size > 0) return
        // Deferred, so the remount that is about to happen cancels it. Closing
        // immediately would tear down the run this tab is watching.
        closeTimer = setTimeout(() => {
          closeTimer = null
          if (listeners.size > 0) return
          if (reconnectTimer) {
            clearTimeout(reconnectTimer)
            reconnectTimer = null
          }
          socket?.close()
          socket = null
        }, CLOSE_GRACE_MS)
      }
    },

    start(variantId) {
      wantedVariant = variantId
      remember(VARIANT_KEY, variantId)
      // A new variant is a new run, so the old id must not be resumed.
      runId = null
      remember(RUN_ID_KEY, null)
      lastSeq = -1
      send({ type: 'run.start', variantId: variantId as never })
    },

    decide(stepId, decision: Decision, note) {
      if (!runId) return
      send({ type: 'run.decide', runId, stepId, decision, note })
    },

    control(action) {
      if (!runId) return
      send({ type: 'run.control', runId, action })
    },
  }
}

/** One source per url, because the socket behind it is shared. */
const sources = new Map<string, RunSource>()

export function wsRunSource(url: string): RunSource {
  const existing = sources.get(url)
  if (existing) return existing
  const made = createWsRunSource(url)
  sources.set(url, made)
  return made
}
