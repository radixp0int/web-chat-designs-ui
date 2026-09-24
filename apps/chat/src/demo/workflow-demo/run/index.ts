// The run seam. The page imports from here; nothing reaches inside.
export { useRun, type Run } from './useRun'
export { initialRunState, runReducer, LOG_CAP } from './runReducer'
export { createStaticRunSource, staticRunSource } from './staticSource'
export { createWsRunSource, wsRunSource } from './wsRunSource'
export { placeRun } from './layout'
export type {
  ConnectionState,
  ControlAction,
  Decision,
  Lane,
  LogEntry,
  RunAction,
  RunEvent,
  RunGraph,
  RunPhase,
  RunSource,
  RunState,
  StageChange,
  StepChange,
  VariantInfo,
} from './types'
export type { RunActor, RunDetail, RunHeader, VariantId } from './wireProtocol'
