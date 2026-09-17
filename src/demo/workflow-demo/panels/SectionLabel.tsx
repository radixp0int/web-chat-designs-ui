// The small caps heading every panel in this section uses to name a block.
//
// It was written out five times across the three panels before this, which is
// exactly the kind of thing that drifts: one of them ends up semibold, or at
// 10px, and nobody notices until the panels sit side by side.
export function SectionLabel({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={`text-[11px] font-bold tracking-[0.14em] text-ink-soft uppercase ${className}`}
    >
      {children}
    </span>
  )
}
