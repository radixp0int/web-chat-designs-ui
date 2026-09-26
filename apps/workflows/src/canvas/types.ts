// The vocabulary a workflow canvas is built from. No example content lives here —
// see ../example for the run this demo happens to draw.
import type { Node } from '@xyflow/react'

/** Who does the work. The canvas draws each of these differently. */
export type StepKind = 'trigger' | 'agent' | 'tool' | 'human' | 'decision'

export type StepStatus =
  | 'done'
  | 'running'
  | 'waiting'
  | 'queued'
  | 'skipped'
  | 'failed'
  | 'approved'
  | 'changes'

export type EdgeState = 'done' | 'active' | 'pending' | 'skipped'

export type StageStatus = 'done' | 'current' | 'upcoming'

/**
 * Status NAMES are kit vocabulary, so they have defaults. `waiting` has none: a
 * countdown is one run's content, and comes in per step as `statusLabel`.
 */
export const DEFAULT_STATUS_LABEL: Record<StepStatus, string | undefined> = {
  done: undefined,
  running: 'Running',
  waiting: undefined,
  queued: 'Queued',
  skipped: 'Skipped',
  failed: 'Failed',
  approved: 'Approved',
  changes: 'Sent back',
}

/** Which step is at which status, keyed by step id. */
export type StatusMap = Record<string, StepStatus>

export type View = 'normal' | 'compact'

/**
 * Whatever the host wants to show in its own detail panel. The canvas never
 * reads inside this — it only carries it — so a different recipe can put its own
 * shape here without touching a node component.
 */
export type StepDetail = Record<string, unknown>

/*
 * React Flow wants node data to be indexable, but an index signature *here*
 * would widen every named field to `unknown` the moment the type passes through
 * Omit or a .map(). So the named fields live on a clean base and the index
 * signature is added at the Node boundary.
 */
export type StepBase<D = StepDetail> = {
  kind: StepKind
  title: string
  /** The result line under the title. Dropped below the detail tier. */
  meta: string
  /** Tool names render in the mono face, the way engineers see them. */
  mono?: boolean
  /** Initials for a named person; omit for a step routed to a role. */
  initials?: string
  stageId: string
  detail: D
  /**
   * What the status marker says in words, e.g. "3h 40m" or "Queued". Supplied
   * per step, because a node component has no business knowing one example's
   * SLA. Omit and the marker renders without a label.
   */
  statusLabel?: string
  /** Shown beside the "Needs approval" pill on a waiting step. */
  assignee?: string
}

export type StageBase = {
  stageId: string
  name: string
  sub: string
  status: StageStatus
  steps: {
    id: string
    kind: StepKind
    title: string
    mono?: boolean
    initials?: string
    statusLabel?: string
  }[]
  expanded: boolean
  statuses: StatusMap
  /** So a stage card can mark which of its rows is the one open in the panel. */
  selectedId: string | null
  /** Whether this whole stage is the one being looked at. */
  selected: boolean
}

export type StepData<D = StepDetail> = StepBase<D> & { status: StepStatus } & Record<
    string,
    unknown
  >
export type StageData = StageBase & Record<string, unknown>

export type StepNodeType<D = StepDetail> = Node<StepData<D>, 'step'>
export type StageNodeType = Node<StageData, 'stage'>
export type AppNode<D = StepDetail> = StepNodeType<D> | StageNodeType

/** What a host supplies to lay a run out. Positions are flow coordinates. */
export type StepSeed<D = StepDetail> = StepBase<D> & {
  id: string
  x: number
  y: number
  /** Decision nodes are narrower than the rest. */
  w?: number
}

export type StageSeed = {
  id: string
  name: string
  sub: string
  status: StageStatus
}

/** Where a stage card sits in the compact view. */
export type StageLayout = { x: number; y: number; w: number; expanded: boolean }
