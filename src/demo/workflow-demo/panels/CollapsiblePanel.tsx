// A side panel that collapses by animating its width.
//
// It animates rather than unmounting so the canvas between the panels reflows
// smoothly and React Flow re-measures as it goes; unmounting makes it snap. The
// inner element keeps the panel's full width throughout, so its contents don't
// reflow while the wrapper shrinks around them.
//
// `gutter` is for a panel sitting in a flex row with a gap: a closed panel still
// leaves its share of that gap behind, so the wrapper pulls it back with a
// negative margin on the side the gap is on.
export function CollapsiblePanel({
  open,
  width,
  gutter,
  children,
}: {
  open: boolean
  /** Tailwind width class, e.g. `w-72`. Applied to the wrapper and the inner element. */
  width: string
  /** Negative-margin class that swallows the flex gap when closed, e.g. `-mr-4`. */
  gutter?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`shrink-0 overflow-hidden transition-[width,margin] duration-300 ease-out ${
        open ? width : `w-0 ${gutter ?? ''}`
      }`}
    >
      <div className={`h-full ${width}`}>{children}</div>
    </div>
  )
}
