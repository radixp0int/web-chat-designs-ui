import { useCallback, useState } from 'react'
import { OfficialMermaid } from './renderers/OfficialMermaid'
import { BeautifulMermaid } from './renderers/BeautifulMermaid'
import { MarkdownMermaid } from './renderers/MarkdownMermaid'
import type { RendererMeta } from './renderers/types'

type Props = {
  meta: RendererMeta
  code: string
  keepLastGood: boolean
  paused: boolean
}

export function RendererColumn({ meta, code, keepLastGood, paused }: Props) {
  const [ms, setMs] = useState<number | null>(null)
  const onTiming = useCallback((value: number) => setMs(value), [])

  const shared = { code, keepLastGood, paused, onTiming }

  return (
    <section className="glass flex flex-col rounded-2xl p-4">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-ink-strong">{meta.name}</h3>
          <p className="mt-0.5 font-mono text-[11px] text-ink-soft">
            {meta.pkg}@{meta.version}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              meta.mode === 'sync' ? 'bg-chip text-chip-fg' : 'bg-tint/10 text-ink-soft'
            }`}
          >
            {meta.mode}
          </span>
          <span className="font-mono text-[10px] text-ink-soft tabular-nums">
            {ms === null ? '—' : `${ms.toFixed(1)} ms`}
          </span>
        </div>
      </header>

      <p className="mb-3 text-[11px] leading-relaxed text-ink-soft">{meta.note}</p>

      <div className="min-w-0 flex-1">
        {meta.key === 'official' && <OfficialMermaid {...shared} />}
        {meta.key === 'beautiful' && <BeautifulMermaid {...shared} />}
        {meta.key === 'markdown' && <MarkdownMermaid {...shared} />}
      </div>
    </section>
  )
}
