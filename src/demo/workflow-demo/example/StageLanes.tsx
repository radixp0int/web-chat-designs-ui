// The stage columns behind the normal view.
//
// They live in the viewport layer rather than as nodes, so they pan and zoom with
// the graph without adding anything for React Flow to measure or hit-test.
import { ViewportPortal } from '@xyflow/react'
import { StageMarker } from '../canvas'
import { STAGE_LANES, STAGES } from './loanRun'

const TOP = -90
const BOTTOM = 540

export function StageLanes() {
  return (
    <ViewportPortal>
      {STAGES.map((stage) => {
        const lane = STAGE_LANES[stage.id]
        const current = stage.status === 'current'
        return (
          <div
            key={stage.id}
            aria-hidden
            style={{
              position: 'absolute',
              transform: `translate(${lane.x}px, ${TOP}px)`,
              width: lane.w,
              height: BOTTOM - TOP,
            }}
            className={`pointer-events-none box-border border-l border-dashed border-ink-soft/25 ${
              current ? 'bg-chip/40' : ''
            }`}
          >
            <div className="flex h-[52px] items-center gap-2.5 border-b border-line bg-panel-solid/50 px-5">
              <StageMarker status={stage.status} />
              <span className="text-[13.5px] font-bold whitespace-nowrap text-ink-strong">
                {stage.name}
              </span>
              <span
                className={`text-xs whitespace-nowrap ${
                  current ? 'text-ink-strong' : 'text-ink-soft'
                }`}
              >
                {stage.sub}
              </span>
            </div>
          </div>
        )
      })}
    </ViewportPortal>
  )
}
