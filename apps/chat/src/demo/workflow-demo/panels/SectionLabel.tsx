// The small caps heading every panel in this section uses to name a block.
//
// It was written out five times across the three panels before this, which is
// exactly the kind of thing that drifts: one of them ends up semibold, or at
// 10px, and nobody notices until the panels sit side by side.
export function SectionLabel({
  children,
  className = '',
  tone = 'soft',
}: {
  children: React.ReactNode
  className?: string
  /* A prop rather than a caller-supplied `text-*`: two colour utilities on one
     element resolve by stylesheet order, not by the order they appear in the
     string, so a caller passing `text-caution` would win or lose at random. */
  tone?: 'soft' | 'caution'
}) {
  return (
    <span
      className={`text-[11px] font-bold tracking-[0.14em] uppercase ${
        tone === 'caution' ? 'text-caution' : 'text-ink-soft'
      } ${className}`}
    >
      {children}
    </span>
  )
}
