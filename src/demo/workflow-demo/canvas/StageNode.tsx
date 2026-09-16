// The compact view's node: a whole stage in one card.
//
// This is the real performance lever, not the zoom tiers — a run is one node per
// stage instead of one per step, plus far fewer edges. Finished stages collapse
// to a list of step rows; the current stage and the next stay open.
import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { ChevronDownIcon, ChevronRightIcon } from '../../../lib/components/icons'
import { KindIcon } from './KindIcon'
import { StatusMark } from './StatusMark'
import { DEFAULT_STATUS_LABEL } from './types'
import { StageMarker } from './StageMarker'
import { useSelectStep } from './selection'
import type { StageNodeType } from './types'

const handleStyle = {
  width: 8,
  height: 8,
  background: 'var(--panel-solid)',
  border: '1.5px solid color-mix(in srgb, var(--ink-soft) 55%, transparent)',
}

function StageNodeView({ data }: NodeProps<StageNodeType>) {
  const { name, sub, status, steps, expanded, statuses, selectedId } = data
  const current = status === 'current'
  const selectStep = useSelectStep()
  const waitingStep = steps.find((s) => statuses[s.id] === 'waiting')

  return (
    <div
      className={`relative box-border flex flex-col rounded-2xl border border-line ${
        current
          ? 'bg-panel-solid/90 ring-2 ring-accent/35 shadow-lg shadow-(color:--shadow-raised)'
          : 'bg-panel shadow-sm shadow-(color:--shadow-soft)'
      }`}
    >
      <Handle type="target" position={Position.Left} style={handleStyle} />

      <div className="flex h-14 items-center gap-2.5 border-b border-line pr-4 pl-[18px]">
        <StageMarker status={status} />
        <div className="flex min-w-0 flex-col">
          <span className="text-[13.5px] leading-[18px] font-bold whitespace-nowrap text-ink-strong">
            {name}
          </span>
          <span className="text-[11.5px] leading-[15px] whitespace-nowrap text-ink-soft">
            {sub}
          </span>
        </div>
        <span className="ml-auto text-ink-soft">
          {expanded ? (
            <ChevronDownIcon width={16} height={16} />
          ) : (
            <ChevronRightIcon width={16} height={16} />
          )}
        </span>
      </div>

      <div className={expanded ? 'p-4' : 'px-4 py-1.5'}>
        {steps.map((step) => {
          const st = statuses[step.id]
          const selected = step.id === selectedId
          return (
            // The row is the click target — a stage card has no single step to
            // stand for it. `nodrag` stops mousedown from dragging the card
            // instead of clicking; stopPropagation keeps the canvas's own
            // node-click handler from firing afterwards.
            <button
              key={step.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                selectStep(step.id)
              }}
              aria-current={selected ? 'true' : undefined}
              className={`nodrag -mx-2 flex w-[calc(100%+1rem)] items-center gap-2.5 rounded-lg px-2 text-left transition hover:bg-tint/8 ${
                expanded ? 'min-h-11 py-1.5' : 'h-[38px]'
              } ${selected ? 'bg-chip' : ''}`}
            >
              <KindIcon kind={step.kind} initials={step.initials} size={expanded ? 20 : 18} />
              <span
                className={`min-w-0 flex-1 truncate text-[12.5px] ${
                  step.mono ? 'font-mono' : 'font-semibold'
                } ${selected ? 'text-ink-strong' : 'text-ink'}`}
              >
                {step.title}
              </span>
              <StatusMark status={st} text={step.statusLabel ?? DEFAULT_STATUS_LABEL[st]} />
            </button>
          )
        })}

        {/* The approval has to be actionable without leaving the compact view —
            the whole point is that you can work from here. */}
        {expanded && waitingStep && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              selectStep(waitingStep.id)
            }}
            className="nodrag mt-2 flex w-full items-center gap-2 border-t border-line pt-3 text-left"
          >
            <span className="inline-flex h-[22px] items-center rounded-md bg-notify px-2.5 text-[11px] font-bold text-on-notify">
              Needs approval
            </span>
            <span className="text-[11.5px] font-semibold text-accent-fg">Review and decide</span>
          </button>
        )}
      </div>

      <Handle type="source" position={Position.Right} style={handleStyle} />
    </div>
  )
}

export const StageNode = memo(StageNodeView)
