// Applying run events to run state. Pure — no React, no sockets, no clock.
//
// Two of the rules here exist for performance rather than correctness, and both
// are load-bearing enough to be worth stating:
//
//  1. `statuses` keeps its identity when a patch doesn't change a status. The
//     page memoises its whole node and edge build on that object, and most
//     patches are meta/detail-only, so returning a fresh map every time would
//     rebuild the graph several times a second for no visible change.
//  2. `graph.epoch` moves only on a snapshot. The canvas refits on epoch, and
//     the node set only ever changes when a whole new graph arrives.
import type { StatusMap } from '../canvas'
import type { RunAction, RunState, StepChange } from './types'

/** Rows past this are dropped from the head; the log says how many. */
export const LOG_CAP = 500

export function initialRunState(): RunState {
  return {
    graph: null,
    statuses: {},
    phase: 'idle',
    log: [],
    logTrimmed: 0,
    awaiting: [],
    decisionsFor: {},
    busyStepId: null,
    connection: 'idle',
    error: null,
  }
}

/** Step ids at `waiting`, in graph order. Returns `prev` when nothing moved. */
function awaitingIn(state: RunState, statuses: StatusMap): string[] {
  const next = (state.graph?.steps ?? [])
    .filter((s) => statuses[s.id] === 'waiting')
    .map((s) => s.id)
  const prev = state.awaiting
  if (next.length === prev.length && next.every((id, i) => id === prev[i])) return prev
  return next
}

function appendLog(
  state: RunState,
  entries: RunState['log'],
): Pick<RunState, 'log' | 'logTrimmed'> {
  if (entries.length === 0) return { log: state.log, logTrimmed: state.logTrimmed }
  const merged = state.log.concat(entries)
  if (merged.length <= LOG_CAP) return { log: merged, logTrimmed: state.logTrimmed }
  const overflow = merged.length - LOG_CAP
  return { log: merged.slice(overflow), logTrimmed: state.logTrimmed + overflow }
}

/** Applies a step change to the graph's copy of that step, keeping identity when it can. */
function patchGraph(state: RunState, stepId: string, change: StepChange): RunState['graph'] {
  const graph = state.graph
  if (!graph) return graph
  // `status` lives in the status map, not on the seed — so a status-only patch
  // leaves the graph untouched and the memoised node build sees a stable object.
  const touchesSeed =
    change.meta !== undefined ||
    change.statusLabel !== undefined ||
    change.assignee !== undefined ||
    change.detail !== undefined
  if (!touchesSeed) return graph

  const old = graph.stepById.get(stepId)
  if (!old) return graph
  const next = {
    ...old,
    ...(change.meta !== undefined && { meta: change.meta }),
    ...(change.statusLabel !== undefined && { statusLabel: change.statusLabel }),
    ...(change.assignee !== undefined && { assignee: change.assignee }),
    ...(change.detail !== undefined && { detail: change.detail }),
  }
  const stepById = new Map(graph.stepById)
  stepById.set(stepId, next)
  return {
    ...graph,
    steps: graph.steps.map((s) => (s.id === stepId ? next : s)),
    stepById,
    // Structure is unchanged, so the canvas must not refit.
    epoch: graph.epoch,
  }
}

export function runReducer(state: RunState, event: RunAction): RunState {
  switch (event.type) {
    // Local, not from the source: a decision has been sent and the buttons are
    // disabled until a step update or an error says what came of it.
    case 'local/busy':
      return state.busyStepId === event.stepId ? state : { ...state, busyStepId: event.stepId }

    case 'snapshot': {
      const base: RunState = {
        ...state,
        graph: event.graph,
        statuses: event.statuses,
        phase: event.phase,
        log: event.log.slice(-LOG_CAP),
        logTrimmed: Math.max(0, event.log.length - LOG_CAP),
        // Restated by every snapshot rather than accumulated: an attach to a
        // run already at a gate has to learn what that gate accepts.
        decisionsFor: Object.fromEntries(event.awaiting.map((g) => [g.stepId, g.decisions])),
        busyStepId: null,
        error: null,
      }
      return { ...base, awaiting: awaitingIn(base, event.statuses) }
    }

    case 'step': {
      const { stepId, change } = event
      const statuses =
        change.status !== undefined && state.statuses[stepId] !== change.status
          ? { ...state.statuses, [stepId]: change.status }
          : state.statuses
      const graph = patchGraph(state, stepId, change)
      if (statuses === state.statuses && graph === state.graph) return state

      const next: RunState = { ...state, statuses, graph }
      // A step that has left `waiting` has had its answer; drop the in-flight mark.
      if (change.status !== undefined && change.status !== 'waiting') {
        if (state.busyStepId === stepId) next.busyStepId = null
        if (state.decisionsFor[stepId]) {
          const { [stepId]: _gone, ...rest } = state.decisionsFor
          next.decisionsFor = rest
        }
      }
      next.awaiting = awaitingIn(next, statuses)
      return next
    }

    case 'stage': {
      const graph = state.graph
      if (!graph) return state
      const stages = graph.stages.map((s) =>
        s.id === event.stageId ? { ...s, ...event.change } : s,
      )
      return { ...state, graph: { ...graph, stages } }
    }

    case 'log':
      return { ...state, ...appendLog(state, event.entries) }

    case 'awaiting':
      return {
        ...state,
        decisionsFor: { ...state.decisionsFor, [event.stepId]: event.decisions },
        busyStepId: state.busyStepId === event.stepId ? null : state.busyStepId,
      }

    case 'phase':
      return state.phase === event.phase ? state : { ...state, phase: event.phase }

    case 'connection':
      return state.connection === event.state ? state : { ...state, connection: event.state }

    case 'error':
      return {
        ...state,
        error: { message: event.message, code: event.code },
        // A failed decision has to give the buttons back.
        busyStepId: null,
        phase: event.recoverable ? state.phase : 'failed',
      }
  }
}
