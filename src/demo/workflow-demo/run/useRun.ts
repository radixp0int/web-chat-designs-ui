// Wiring a RunSource to the reducer.
//
// The source must be stable across renders — a module constant, or something
// the caller memoises — the same discipline `responder` follows in demo/App.tsx.
// A new source object on every render would tear the subscription down and
// rebuild it, which for the WebSocket source means a new run.
import { useCallback, useEffect, useReducer } from 'react'
import { initialRunState, runReducer } from './runReducer'
import type { ControlAction, Decision, RunSource } from './types'

export function useRun(source: RunSource) {
  const [state, dispatch] = useReducer(runReducer, undefined, initialRunState)

  useEffect(() => source.subscribe(dispatch), [source])

  const decide = useCallback(
    (stepId: string, decision: Decision, note?: string) => {
      // Optimistic only to the extent of disabling the buttons: what the
      // decision *does* is the source's to say.
      dispatch({ type: 'local/busy', stepId })
      source.decide(stepId, decision, note)
    },
    [source],
  )

  const control = useCallback((action: ControlAction) => source.control(action), [source])
  const start = useCallback((variantId: string) => source.start(variantId), [source])

  return { ...state, decide, control, start, variants: source.variants }
}

export type Run = ReturnType<typeof useRun>
