import type { CitationChipProps } from './types'

/**
 * An inline [n] citation marker rendered as a small clickable chip.
 * Superscript effect comes from a translate rather than <sup> so the
 * surrounding line-height stays stable.
 */
export function CitationChip({ n, onClick }: CitationChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open reference ${n}`}
      title={`Reference ${n}`}
      className="mx-0.5 inline-flex min-w-4 -translate-y-[0.35em] items-center justify-center rounded-md bg-chip px-1 text-[10px] leading-4 font-semibold text-chip-fg transition hover:bg-chip-hover"
    >
      {n}
    </button>
  )
}
