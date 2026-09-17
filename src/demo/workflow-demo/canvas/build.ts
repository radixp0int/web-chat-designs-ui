// Turning a run into React Flow nodes and edges.
//
// Everything here is driven by what the caller passes in, so a second recipe can
// reuse it by supplying its own steps, stages and edge list.
import { MarkerType, type Edge } from '@xyflow/react'
import type {
  EdgeState,
  StageLayout,
  StageNodeType,
  StageSeed,
  StatusMap,
  StepNodeType,
  StepSeed,
} from './types'

export const NODE_W = 196
export const GATE_W = 170

/**
 * The four line styles, as CSS variables so a host can theme them per mode.
 * Every one is contrast-checked against the canvas it sits on — see DESIGN.md.
 */
export const EDGE_STROKE: Record<EdgeState, string> = {
  done: 'var(--wf-done)',
  active: 'var(--wf-active)',
  pending: 'var(--wf-pending)',
  skipped: 'var(--wf-skipped)',
}

/** Dotted for "not reached", sparser dots for a branch that will never run. */
export const EDGE_DASH: Record<EdgeState, string | undefined> = {
  done: undefined,
  active: '6 5',
  pending: '0.1 5',
  skipped: '0.1 7',
}

export type EdgeSeed = { from: string; to: string; state: (s: StatusMap) => EdgeState }

/** An edge is "active" only while the step it feeds is the one being waited on. */
export const feeds =
  (target: string): EdgeSeed['state'] =>
  (s) => {
    const st = s[target]
    if (st === 'waiting') return 'active'
    if (st === 'skipped') return 'skipped'
    if (st === 'queued') return 'pending'
    return 'done'
  }

/** A branch the run will never take, whatever the statuses say. */
export const never = (): EdgeState => 'skipped'

export function edgeStyle(state: EdgeState, animated: boolean) {
  return {
    stroke: EDGE_STROKE[state],
    strokeWidth: state === 'done' ? 1.5 : 2,
    strokeLinecap: 'round' as const,
    strokeDasharray: animated && state === 'active' ? undefined : EDGE_DASH[state],
  }
}

export function buildStepNodes<D>(
  steps: StepSeed<D>[],
  statuses: StatusMap,
  selectedId: string | null,
): StepNodeType<D>[] {
  return steps.map((s) => ({
    id: s.id,
    type: 'step' as const,
    position: { x: s.x, y: s.y },
    selected: s.id === selectedId,
    style: { width: s.w ?? NODE_W },
    data: {
      kind: s.kind,
      title: s.title,
      meta: s.meta,
      mono: s.mono,
      initials: s.initials,
      statusLabel: s.statusLabel,
      assignee: s.assignee,
      stageId: s.stageId,
      detail: s.detail,
      status: statuses[s.id],
    },
  }))
}

/** The compact view: one node per stage instead of one per step. */
export function buildStageNodes<D>(
  stages: StageSeed[],
  steps: StepSeed<D>[],
  layout: Record<string, StageLayout>,
  statuses: StatusMap,
  selectedId: string | null,
  selectedStageId: string | null = null,
): StageNodeType[] {
  return stages.map((stage) => {
    const l = layout[stage.id]
    return {
      id: `stage-${stage.id}`,
      type: 'stage' as const,
      position: { x: l.x, y: l.y },
      style: { width: l.w },
      data: {
        stageId: stage.id,
        name: stage.name,
        sub: stage.sub,
        status: stage.status,
        expanded: l.expanded,
        selectedId,
        selected: stage.id === selectedStageId,
        statuses,
        steps: steps
          .filter((s) => s.stageId === stage.id)
          .map((s) => ({
            id: s.id,
            kind: s.kind,
            title: s.title,
            mono: s.mono,
            initials: s.initials,
            statusLabel: s.statusLabel,
          })),
      },
    }
  })
}

export function buildStepEdges(seeds: EdgeSeed[], statuses: StatusMap, animate: boolean): Edge[] {
  return seeds.map(({ from, to, state }) => {
    const s = state(statuses)
    const active = animate && s === 'active'
    return {
      id: `${from}-${to}`,
      source: from,
      target: to,
      // The dash animation repaints every frame; it is the first thing to drop
      // when zoomed out (see DESIGN.md).
      animated: active,
      style: edgeStyle(s, active),
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: EDGE_STROKE[s] },
    }
  })
}

/** One edge per stage boundary, solid once anything in the next stage has run. */
export function buildStageEdges<D>(
  stages: StageSeed[],
  steps: StepSeed<D>[],
  statuses: StatusMap,
): Edge[] {
  const order = stages.map((s) => s.id)
  return order.slice(0, -1).map((id, i) => {
    const next = order[i + 1]
    const reached = steps
      .filter((s) => s.stageId === next)
      .some((s) => statuses[s.id] === 'done' || statuses[s.id] === 'approved')
    const s: EdgeState = reached ? 'done' : 'pending'
    return {
      id: `stage-${id}-${next}`,
      source: `stage-${id}`,
      target: `stage-${next}`,
      style: edgeStyle(s, false),
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: EDGE_STROKE[s] },
    }
  })
}
