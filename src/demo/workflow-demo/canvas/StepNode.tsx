// One step on the canvas, at three levels of detail.
//
// The icon says who does the work — the orb for an agent, initials for a person,
// a plug for a system call, a diamond for routing. That is what survives all the
// way down to the glyph tier, along with the status marker: at 40% zoom you can
// still see that a person is blocked.
import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { KindIcon } from './KindIcon'
import { StatusMark } from './StatusMark'
import { DEFAULT_STATUS_LABEL } from './types'
import { useZoomTier } from './zoom'
import type { StepKind, StepNodeType, StepStatus } from './types'

const KIND_LABEL: Record<StepKind, string> = {
  agent: 'Agent',
  human: 'Approval',
  tool: 'System call',
  decision: 'Decision',
  trigger: 'Trigger',
}

/* One hue, four weights of emphasis. A person's step is the loudest because it
   is the one that stops the run. */
const KIND_CHIP: Record<StepKind, string> = {
  agent: 'bg-chip text-chip-fg',
  human: 'bg-brand-solid text-on-brand-solid',
  tool: 'bg-tint/12 text-ink',
  decision: 'text-ink-soft ring-1 ring-inset ring-line',
  trigger: 'bg-chip text-chip-fg',
}

function shellFor(status: StepStatus, selected: boolean) {
  const dim = status === 'queued' || status === 'skipped'
  const base = dim
    ? 'bg-panel border border-dashed border-ink-soft/45'
    : 'bg-panel-solid border border-line shadow-sm shadow-(color:--shadow-soft)'
  const state =
    status === 'waiting'
      ? 'border-notify/60 ring-4 ring-notify/12'
      : status === 'failed'
        ? 'border-danger/40'
        : ''
  return `${base} ${state} ${selected ? 'ring-2 ring-accent' : ''}`
}

const handleStyle = {
  width: 8,
  height: 8,
  background: 'var(--panel-solid)',
  border: '1.5px solid color-mix(in srgb, var(--ink-soft) 55%, transparent)',
}

function StepNodeView({ data, selected }: NodeProps<StepNodeType>) {
  const tier = useZoomTier()
  const { kind, title, meta, mono, initials, status, statusLabel, assignee } = data
  const dim = status === 'queued' || status === 'skipped'
  const statusText = statusLabel ?? DEFAULT_STATUS_LABEL[status]

  return (
    <div
      className={`relative box-border rounded-lg transition-colors ${shellFor(status, !!selected)} ${
        tier === 'detail' ? 'px-3.5 py-3' : 'px-3.5'
      }`}
      style={tier === 'detail' ? undefined : { height: tier === 'simplified' ? 64 : 48 }}
    >
      <Handle type="target" position={Position.Left} style={handleStyle} />

      {tier === 'detail' ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex h-5 items-center gap-1.5">
            <KindIcon kind={kind} initials={initials} size={20} />
            <span
              className={`inline-flex h-5 items-center rounded-md px-2 text-[11px] font-bold whitespace-nowrap ${KIND_CHIP[kind]}`}
            >
              {KIND_LABEL[kind]}
            </span>
            <StatusMark status={status} text={statusText} />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span
              className={`truncate leading-[18px] ${
                mono ? 'font-mono text-[12.5px] font-medium' : 'text-[13.5px] font-bold'
              } ${dim ? 'text-ink' : 'text-ink-strong'}`}
            >
              {title}
            </span>
            <span className="truncate text-[11.5px] leading-4 text-ink-soft">{meta}</span>
          </div>
          {status === 'waiting' && (
            <div className="mt-0.5 flex items-center gap-2">
              <span className="inline-flex h-[22px] items-center rounded-md bg-notify px-2.5 text-[11px] font-bold whitespace-nowrap text-on-notify">
                Needs approval
              </span>
              {assignee && (
                <span className="truncate text-[11.5px] font-semibold text-ink-soft">
                  {assignee}
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Simplified drops the result line and the chip text, and grows the title
           to 17px so it still lands near 10px on screen. Glyph drops text
           entirely — the icon and the marker are the whole node. */
        <div className="flex h-full items-center gap-2.5">
          <KindIcon kind={kind} initials={initials} size={tier === 'simplified' ? 24 : 28} />
          {tier === 'simplified' && (
            <span
              className={`min-w-0 truncate leading-[22px] ${
                mono ? 'font-mono text-[15px] font-medium' : 'text-[17px] font-bold'
              } ${dim ? 'text-ink' : 'text-ink-strong'}`}
            >
              {title}
            </span>
          )}
          <StatusMark status={status} tier={tier} />
        </div>
      )}

      <Handle type="source" position={Position.Right} style={handleStyle} />
    </div>
  )
}

export const StepNode = memo(StepNodeView)
