import { useState } from 'react'
import { ChevronRightIcon } from './Icons'
import { useUiSize } from './uiSize'

type ThinkingBlockProps = {
  text: string
  active: boolean
  durationSec?: number
}

export function ThinkingBlock({ text, active, durationSec }: ThinkingBlockProps) {
  const compact = useUiSize() === 'compact'
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded-lg px-1.5 py-1 font-medium transition hover:bg-brand-600/6 dark:hover:bg-white/6 ${compact ? 'text-xs' : 'text-[13px]'}`}
      >
        <ChevronRightIcon
          width={14}
          height={14}
          className={`text-(--text-soft) transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
        {active ? (
          <span className="shimmer-text">Thinking…</span>
        ) : (
          <span className="text-(--text-soft)">
            Thought for {durationSec ?? 4}s
          </span>
        )}
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`mt-1.5 ml-[7px] border-l-2 border-accent-500/40 ${compact ? 'pl-3' : 'pl-4'}`}
          >
            <p
              className={`leading-relaxed whitespace-pre-line text-(--text-soft) italic ${compact ? 'text-xs' : 'text-[13px]'}`}
            >
              {text}
              {active && <span className="not-italic">▍</span>}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
