// The stage columns behind the normal view.
//
// They live in the viewport layer rather than as nodes, so they pan and zoom with
// the graph without adding anything for React Flow to measure or hit-test.
//
// `top`/`bottom` are props rather than constants because a lane is only as tall
// as the run it stands behind: the onboarding variant's five-wide provisioning
// column is 720px, and a fixed height would leave its nodes hanging outside.
import { ViewportPortal } from '@xyflow/react'
import { StageMarker } from '../canvas'
import type { StageSeed } from '../canvas'

export type Lane = { x: number; w: number }

export function StageLanes({
  stages,
  lanes,
  top,
  bottom,
  selectedStageId,
  onSelectStage,
}: {
  stages: StageSeed[]
  lanes: Record<string, Lane>
  top: number
  bottom: number
  /** The stage being looked at, if any. */
  selectedStageId: string | null
  onSelectStage: (id: string) => void
}) {
  return (
    <ViewportPortal>
      {stages.map((stage) => {
        const lane = lanes[stage.id]
        if (!lane) return null
        const current = stage.status === 'current'
        const selected = stage.id === selectedStageId
        return (
          <div
            key={stage.id}
            style={{
              position: 'absolute',
              transform: `translate(${lane.x}px, ${top}px)`,
              width: lane.w,
              height: bottom - top,
            }}
            /* The lane body stays click-through so it never steals a click meant
               for a node or the pane; only its header bar is a target. */
            className={`pointer-events-none box-border border-l border-dashed transition-colors ${
              selected
                ? 'border-accent bg-chip/70'
                : current
                  ? 'border-ink-soft/25 bg-chip/40'
                  : 'border-ink-soft/25'
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectStage(stage.id)}
              aria-pressed={selected}
              className={`nodrag pointer-events-auto flex h-[52px] w-full items-center gap-2.5 border-b px-5 text-left transition ${
                selected
                  ? 'border-accent bg-panel-solid/80'
                  : 'border-line bg-panel-solid/50 hover:bg-panel-solid/70'
              }`}
            >
              <StageMarker status={stage.status} />
              <span className="text-[13.5px] font-bold whitespace-nowrap text-ink-strong">
                {stage.name}
              </span>
              <span
                className={`text-xs whitespace-nowrap ${
                  current || selected ? 'text-ink-strong' : 'text-ink-soft'
                }`}
              >
                {stage.sub}
              </span>
            </button>
          </div>
        )
      })}
    </ViewportPortal>
  )
}
