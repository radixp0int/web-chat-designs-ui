// Turning a wire run's {column, row} into pixels.
//
// This lives here rather than in ../canvas because it is a placement *policy*
// over a shape the kit has no concept of — the kit's contract is "you provide
// steps with x/y" (see canvas/README.md), and this is what provides them. The
// dependency runs one way: layout imports the kit's widths, never the reverse.
//
// The constants below are not arbitrary. Fed the loan run's columns they
// reproduce its authored x positions exactly, gate narrowing included:
//
//   col 0  trigger, intake        196 wide   x = 0
//   col 1  bureau, spread, kyc    196        x = 0    + 196 + 104 = 300
//   col 2  risk, memo             196        x = 300  + 196 + 104 = 600
//   col 3  policy (decision)      170        x = 600  + 196 + 104 = 900
//   col 4  approve, senior        196        x = 900  + 170 + 104 = 1174
//   col 5  letter, notify         196        x = 1174 + 196 + 104 = 1474
//
// The y values it derives are NOT the loan run's authored ones: those were
// hand-tuned per node, and a column here is simply centred on the axis. That is
// why /workflow-demo keeps its own positions and only the live routes come
// through this function — see ../DESIGN.md.
import { GATE_W, NODE_W, type StageLayout, type StepSeed } from '../canvas'
import type { Lane } from './types'
import type { RunDetail, WireStage, WireStep } from './wireProtocol'

/** Horizontal space between one column's right edge and the next column's left. */
export const COLUMN_GUTTER = 104
/** Vertical distance between two nodes in the same column. */
export const ROW_PITCH = 180
/** The line every column is centred on. */
export const ROW_AXIS = 200

/** How far the first and last lanes overhang the run. */
export const LANE_BLEED = 80
/** How far short of the next column an interior lane boundary stops. */
export const LANE_INSET = 50
/** Headroom above the highest node — the lane's own title bar sits in it. */
export const LANE_HEAD = 110
/** Room below the lowest node's top edge, so a node never touches the floor. */
export const LANE_FOOT = 160

/** Compact view: a stage card's base width, and the gap between cards. */
const CARD_W = 240
const CARD_SPAN = 234
const CARD_GUTTER = 72

export type PlacedRun = {
  steps: StepSeed<RunDetail>[]
  lanes: Record<string, Lane>
  laneTop: number
  laneBottom: number
  stageLayout: Record<string, StageLayout>
}

function widthOf(step: WireStep): number {
  return step.w ?? (step.kind === 'decision' ? GATE_W : NODE_W)
}

/** Left edge of every column, and how wide each one is. */
function columnGeometry(steps: WireStep[]): { x: number[]; w: number[] } {
  const last = steps.reduce((m, s) => Math.max(m, s.column), 0)
  const w: number[] = []
  for (let c = 0; c <= last; c++) {
    const inColumn = steps.filter((s) => s.column === c)
    // An empty column still occupies its slot, so a gap in the numbering reads
    // as deliberate space rather than silently closing up.
    w[c] = inColumn.length ? Math.max(...inColumn.map(widthOf)) : NODE_W
  }
  const x: number[] = [0]
  for (let c = 1; c <= last; c++) x[c] = x[c - 1] + w[c - 1] + COLUMN_GUTTER
  return { x, w }
}

/**
 * Places every step, then derives the lanes and the compact-view stage cards
 * from where the steps landed. A step with explicit `x`/`y` keeps them, and is
 * ignored when sizing its column — an escape hatch shouldn't move its neighbours.
 */
export function placeRun(steps: WireStep[], stages: WireStage[]): PlacedRun {
  const auto = steps.filter((s) => s.x === undefined || s.y === undefined)
  const { x: colX, w: colW } = columnGeometry(auto)

  /** Where each column's nth step sits, centred on the axis. */
  const yByColumn = new Map<number, Map<string, number>>()
  for (const c of new Set(auto.map((s) => s.column))) {
    // `row` orders; it is not an index. A script numbering rows 0/2/5 still gets
    // three evenly spaced nodes rather than two gaps.
    const ordered = auto.filter((s) => s.column === c).sort((a, b) => a.row - b.row)
    const ys = new Map<string, number>()
    ordered.forEach((s, i) => ys.set(s.id, ROW_AXIS + (i - (ordered.length - 1) / 2) * ROW_PITCH))
    yByColumn.set(c, ys)
  }

  const placed: StepSeed<RunDetail>[] = steps.map((s) => ({
    id: s.id,
    kind: s.kind,
    stageId: s.stageId,
    title: s.title,
    meta: s.meta,
    mono: s.mono,
    initials: s.initials,
    statusLabel: s.statusLabel,
    assignee: s.assignee,
    detail: s.detail,
    w: s.w ?? (s.kind === 'decision' ? GATE_W : undefined),
    x: s.x ?? colX[s.column] ?? 0,
    y: s.y ?? yByColumn.get(s.column)?.get(s.id) ?? ROW_AXIS,
  }))

  const ys = placed.map((s) => s.y)
  const laneTop = (ys.length ? Math.min(...ys) : ROW_AXIS) - LANE_HEAD
  const laneBottom = (ys.length ? Math.max(...ys) : ROW_AXIS) + LANE_FOOT

  // A stage spans the columns its steps occupy. Lanes butt up against each
  // other; only the outermost two bleed past the run.
  const columnsOf = (stageId: string) =>
    steps.filter((s) => s.stageId === stageId).map((s) => s.column)

  const lanes: Record<string, Lane> = {}
  const spans = stages.map((stage) => {
    const cs = columnsOf(stage.id)
    return { id: stage.id, first: Math.min(...cs), last: Math.max(...cs), empty: cs.length === 0 }
  })

  spans.forEach((span, i) => {
    if (span.empty) return
    const isFirst = i === 0
    const isLast = i === spans.length - 1
    const nextFirst = spans[i + 1] && !spans[i + 1].empty ? spans[i + 1].first : undefined
    const start = isFirst ? colX[span.first] - LANE_BLEED : colX[span.first] - LANE_INSET
    const end =
      isLast || nextFirst === undefined
        ? colX[span.last] + colW[span.last] + LANE_BLEED
        : colX[nextFirst] - LANE_INSET
    lanes[span.id] = { x: start, w: end - start }
  })

  // Compact view: one card per stage, finished ones collapsed to a step list.
  // Cards keep the stage order rather than the column geometry — the compact
  // view's whole point is that it is not to scale.
  const stageLayout: Record<string, StageLayout> = {}
  let cardX = 0
  spans.forEach((span, i) => {
    const stage = stages[i]
    const expanded = stage.status !== 'done'
    const colSpan = span.empty ? 1 : span.last - span.first + 1
    const w = expanded ? CARD_W + CARD_SPAN * (colSpan - 1) + 4 : CARD_W
    stageLayout[stage.id] = { x: cardX, y: expanded ? 20 : 124, w, expanded }
    cardX += w + CARD_GUTTER
  })

  return { steps: placed, lanes, laneTop, laneBottom, stageLayout }
}
