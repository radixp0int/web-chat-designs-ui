import { useState } from 'react'
import { CheckIcon, ChevronRightIcon, XIcon } from '../icons'
import { useUiSize } from '../../uiSize'
import type { ToolCallChipProps } from './types'

/**
 * One tool call as a status chip: pulsing while running, check when done,
 * red with the failure reason when it fails. Finished calls expand to show
 * their input/output JSON.
 */
export function ToolCallChip({ tool }: ToolCallChipProps) {
  const compact = useUiSize() === 'compact'
  const [open, setOpen] = useState(false)

  const running = tool.status === 'started'
  const failed = tool.status === 'failed'
  const expandable = !running && (tool.input !== undefined || tool.output !== undefined)

  return (
    <div>
      <button
        type="button"
        onClick={() => expandable && setOpen((o) => !o)}
        aria-expanded={expandable ? open : undefined}
        className={`flex items-center gap-1.5 rounded-lg border font-medium transition ${
          compact ? 'px-2 py-1 text-xs' : 'px-2.5 py-1 text-[13px]'
        } ${
          failed
            ? 'border-red-500/30 bg-red-500/8 text-red-600 dark:text-red-400'
            : 'border-(--panel-border) text-(--text-soft)'
        } ${expandable ? 'cursor-pointer hover:bg-brand-600/6 dark:hover:bg-white/6' : 'cursor-default'}`}
      >
        {running ? (
          <span className="size-1.5 animate-pulse rounded-full bg-accent-500" aria-hidden />
        ) : failed ? (
          <XIcon width={13} height={13} aria-hidden />
        ) : (
          <CheckIcon width={13} height={13} className="text-accent-500" aria-hidden />
        )}

        {running ? (
          <span className="shimmer-text">Running {tool.name}…</span>
        ) : (
          <span className="font-mono">{tool.name}</span>
        )}

        {expandable && (
          <ChevronRightIcon
            width={12}
            height={12}
            className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
            aria-hidden
          />
        )}
      </button>

      {failed && tool.error && (
        <p
          className={`mt-1 pl-1 text-red-600/90 dark:text-red-400/90 ${compact ? 'text-xs' : 'text-[13px]'}`}
        >
          {tool.error}
        </p>
      )}

      {expandable && open && (
        <div
          className={`mt-1.5 ml-[7px] space-y-1.5 border-l-2 border-accent-500/40 ${compact ? 'pl-3' : 'pl-4'}`}
        >
          {tool.input !== undefined && <ToolPayload label="Input" value={tool.input} />}
          {tool.output !== undefined && <ToolPayload label="Output" value={tool.output} />}
        </div>
      )}
    </div>
  )
}

function ToolPayload({ label, value }: { label: string; value: unknown }) {
  const compact = useUiSize() === 'compact'
  return (
    <div>
      <span className={`font-medium text-(--text-soft) ${compact ? 'text-[11px]' : 'text-xs'}`}>
        {label}
      </span>
      <pre
        className={`overflow-x-auto font-mono whitespace-pre-wrap text-(--text-soft) ${compact ? 'text-[11px]' : 'text-xs'}`}
      >
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  )
}
