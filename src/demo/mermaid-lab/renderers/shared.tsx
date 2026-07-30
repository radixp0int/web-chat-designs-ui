/** Error state shared by all three renderer panels. */
export function ErrorBox({ message, stale }: { message: string; stale?: boolean }) {
  return (
    <div className="rounded-xl border border-danger/30 bg-danger/8 p-3">
      <p className="text-xs font-semibold text-danger-fg">
        {stale ? 'Parse error (showing last good render)' : 'Render failed'}
      </p>
      <pre className="mt-1.5 overflow-x-auto font-mono text-[11px] leading-relaxed text-ink-soft">
        {message}
      </pre>
    </div>
  )
}

/** Placeholder while an async renderer has not produced anything yet. */
export function Pending({ label = 'Rendering…' }: { label?: string }) {
  return (
    <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-line text-xs text-ink-soft">
      {label}
    </div>
  )
}

/**
 * Wrapper for injected SVG. `[&>svg]:max-w-full` keeps wide diagrams from
 * blowing out the column, and the container scrolls instead of the page.
 */
export function SvgSurface({ html, dim }: { html: string; dim?: boolean }) {
  return (
    <div
      className={`overflow-x-auto rounded-xl border border-line bg-code-block p-3 transition-opacity [&>svg]:h-auto [&>svg]:max-w-full ${
        dim ? 'opacity-40' : ''
      }`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
