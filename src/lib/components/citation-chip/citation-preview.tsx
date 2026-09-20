// What a citation marker shows on hover: the passage it actually points at.
//
// The number alone asks the reader to open a panel — and lose their place in
// the answer — to find out whether the citation says what the sentence claims.
// This is that answer without the trip.

import { useUiSize } from '../../uiSize'
import type { CitationPreview } from '../../highlights'

export function CitationPreviewCard({ preview }: { preview: CitationPreview }) {
  const compact = useUiSize() === 'compact'
  const body = compact ? 'text-xs' : 'text-[13px]'

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel-solid shadow-xl shadow-(color:--shadow-menu)">
      {/* The same numbered square SourceStrip uses, so a marker, a source pill
          and this card read as one object at three sizes. */}
      <div
        className={`flex items-center gap-1.5 border-b border-line px-3 ${compact ? 'py-1.5' : 'py-2'}`}
      >
        <span className="grid size-4 shrink-0 place-items-center rounded bg-chip text-[10px] font-semibold text-chip-fg">
          {preview.sourceId}
        </span>
        <span
          className={`truncate font-semibold text-ink-strong ${compact ? 'text-xs' : 'text-[13px]'}`}
        >
          {preview.title}
        </span>
      </div>

      {/* The only scroller. Its cap is set by HoverCard from the space between
          the marker and the nearer viewport edge, so the box grows with the
          passage until it would run off screen and then scrolls.
          overscroll-contain stops a wheel at the end of the card from scrolling
          the transcript — which would drag the marker out from under the
          pointer mid-read. */}
      <div
        style={{ maxHeight: 'var(--hover-card-max-h)' }}
        className={`overflow-y-auto overscroll-contain px-3 ${compact ? 'py-2' : 'py-2.5'}`}
      >
        {preview.passages.length > 0 ? (
          <ul className="space-y-2">
            {preview.passages.map((text, i) => (
              <li key={i} className={`leading-relaxed text-ink ${body}`}>
                {/* The reference panel's highlight treatment, verbatim — the
                    reader should recognise this passage when the panel opens. */}
                <mark className="highlight-wash rounded px-0.5 text-ink-strong">{text}</mark>
              </li>
            ))}
          </ul>
        ) : (
          // Not every cited source has a highlighted passage. The document's
          // opening stands in, deliberately unmarked: a <mark> here would claim
          // the assistant cited this text, which it didn't.
          <p className={`leading-relaxed text-ink-soft ${body}`}>{preview.lead}</p>
        )}

        {preview.more > 0 && (
          <p className={`mt-2 text-ink-soft ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
            +{preview.more} more {preview.more === 1 ? 'passage' : 'passages'}
          </p>
        )}
      </div>

      <p
        className={`border-t border-line px-3 py-1.5 text-ink-soft ${compact ? 'text-[10px]' : 'text-[11px]'}`}
      >
        Click to open the reference
      </p>
    </div>
  )
}
