// The two floating clusters on the canvas: what the symbols mean, and where the
// zoom is. The zoom readout names the tier, so a node shedding its subtitle
// never looks like a bug.
import { Panel, useReactFlow } from '@xyflow/react'
import { ExpandDiagonalIcon, MinusIcon, PlusIcon } from '../../../lib/components/icons'
import { KindIcon } from './KindIcon'
import { EDGE_DASH, EDGE_STROKE } from './build'
import { TIER_LABEL, useZoomPercent, useZoomTier } from './zoom'
import type { EdgeState, StepKind } from './types'

const KINDS: [StepKind, string][] = [
  ['agent', 'Agent'],
  ['human', 'Person'],
  ['tool', 'System call'],
  ['decision', 'Decision'],
]

const EDGES: [EdgeState, string][] = [
  ['done', 'Done'],
  ['active', 'Waiting on this step'],
  ['pending', 'Not reached yet'],
  ['skipped', 'Skipped branch'],
]

function LegendLine({ state }: { state: EdgeState }) {
  return (
    <svg width="30" height="10" viewBox="0 0 30 10" className="block shrink-0" aria-hidden>
      <path
        d="M1 5 H28"
        fill="none"
        stroke={EDGE_STROKE[state]}
        strokeWidth={state === 'done' ? 1.5 : 2}
        strokeLinecap="round"
        strokeDasharray={EDGE_DASH[state]}
      />
    </svg>
  )
}

export function CanvasLegend() {
  return (
    <Panel position="bottom-left">
      <div className="glass grid grid-cols-2 gap-x-7 gap-y-2.5 rounded-xl px-4 py-3.5">
        {KINDS.map(([kind, label], i) => (
          <div key={kind} className="contents">
            <div className="flex items-center gap-2.5 text-xs whitespace-nowrap text-ink">
              <KindIcon kind={kind} size={16} />
              {label}
            </div>
            <div className="flex items-center gap-2.5 text-xs whitespace-nowrap text-ink">
              <LegendLine state={EDGES[i][0]} />
              {EDGES[i][1]}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

export function ZoomCluster() {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const pct = useZoomPercent()
  const tier = useZoomTier()

  const btn =
    'grid size-[34px] place-items-center rounded-lg text-ink-soft transition hover:bg-tint/8 hover:text-ink-strong'

  return (
    <Panel position="bottom-right">
      <div className="glass flex flex-col items-center gap-0.5 rounded-xl p-1.5">
        <div className="flex flex-col items-center px-0.5 pt-1 pb-0.5">
          <span className="text-xs leading-[15px] font-bold text-ink-strong tabular-nums">
            {pct}%
          </span>
          <span className="text-[10px] leading-[13px] font-semibold text-ink-soft">
            {TIER_LABEL[tier]}
          </span>
        </div>
        <button type="button" onClick={() => zoomIn()} className={btn} aria-label="Zoom in">
          <PlusIcon width={16} height={16} />
        </button>
        <button type="button" onClick={() => zoomOut()} className={btn} aria-label="Zoom out">
          <MinusIcon width={16} height={16} />
        </button>
        <button
          type="button"
          onClick={() => fitView({ padding: 0.12, duration: 300 })}
          className={btn}
          aria-label="Fit the run on screen"
        >
          <ExpandDiagonalIcon width={16} height={16} />
        </button>
      </div>
    </Panel>
  )
}
