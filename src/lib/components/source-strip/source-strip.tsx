import { useState } from 'react'
import { useUiSize } from '../../uiSize'
import type { SourceStripProps } from './types'

// Past this many sources, collapse the strip behind a "+N more" toggle so a
// large corpus doesn't swallow the conversation.
const VISIBLE_LIMIT = 8

/** Compact row of numbered source pills under an assistant message. */
export function SourceStrip({ sources, onCite }: SourceStripProps) {
  const compact = useUiSize() === 'compact'
  const [showAll, setShowAll] = useState(false)
  const overflow = sources.length - VISIBLE_LIMIT
  const visible = showAll || overflow < 2 ? sources : sources.slice(0, VISIBLE_LIMIT)

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {visible.map((source) => (
        <button
          key={source.id}
          type="button"
          onClick={() => onCite(source.id)}
          title={source.title}
          className={`flex items-center gap-1.5 rounded-lg border border-(--panel-border) font-medium text-(--text-soft) transition hover:bg-brand-600/6 hover:text-(--text-strong) dark:hover:bg-white/6 ${
            compact ? 'px-2 py-1 text-xs' : 'px-2.5 py-1 text-[13px]'
          }`}
        >
          <span className="grid size-4 shrink-0 place-items-center rounded bg-brand-600/10 text-[10px] font-semibold text-brand-600 dark:bg-brand-300/15 dark:text-brand-300">
            {source.id}
          </span>
          <span className="max-w-[18ch] truncate">{source.title}</span>
        </button>
      ))}
      {overflow >= 2 && (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className={`rounded-lg border border-dashed border-(--panel-border) font-medium text-(--text-soft) transition hover:bg-brand-600/6 hover:text-(--text-strong) dark:hover:bg-white/6 ${
            compact ? 'px-2 py-1 text-xs' : 'px-2.5 py-1 text-[13px]'
          }`}
        >
          {showAll ? 'Show fewer' : `+${overflow} more`}
        </button>
      )}
    </div>
  )
}
