import type { ReactNode } from 'react'

/**
 * The box every state of a diagram shares — drawing, drawn, or shown as
 * source — so switching between them never changes the block's outline.
 */
export function MermaidFrame({
  label,
  actions,
  busy,
  children,
}: {
  label: string
  actions?: ReactNode
  busy?: boolean
  children: ReactNode
}) {
  return (
    <figure
      aria-busy={busy || undefined}
      className="my-3 overflow-hidden rounded-xl border border-line bg-code-block"
    >
      <figcaption className="flex h-9 items-center gap-1 border-b border-line pr-1 pl-3.5 text-[11px] font-semibold tracking-wide text-ink-soft uppercase">
        <span className="flex-1 truncate">{label}</span>
        {actions}
      </figcaption>
      {children}
    </figure>
  )
}

/** Before the first frame is drawable — and while the renderer itself loads. */
export function MermaidPending({ label }: { label: string }) {
  return (
    <MermaidFrame label={label} busy>
      <div className="flex h-28 items-center justify-center">
        <span className="shimmer-text text-sm font-medium">Drawing diagram…</span>
      </div>
    </MermaidFrame>
  )
}
