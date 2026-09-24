import { useEffect, useMemo, useRef } from 'react'
import { renderMermaidSVG } from 'beautiful-mermaid'
import type { RendererProps } from './types'
import { ErrorBox, SvgSurface } from './shared'
import { errorMessage } from './errorMessage'

/**
 * Candidate B — `beautiful-mermaid`.
 *
 * Synchronous and DOM-free: `renderMermaidSVG` returns a string, so there is no
 * effect, no async race, and no flash of empty space. Colors are passed through
 * as `var(--token)` references and land on the <svg> as custom properties,
 * which is why this component has no theme-epoch dependency — a light/dark flip
 * recolors the existing SVG with no re-render at all.
 */
const OPTIONS = {
  bg: 'var(--canvas)',
  fg: 'var(--ink-strong)',
  line: 'var(--ink-soft)',
  accent: 'var(--accent)',
  muted: 'var(--ink-soft)',
  surface: 'var(--panel-solid)',
  border: 'var(--line)',
  font: 'var(--font-brand)',
  transparent: true,
  padding: 16,
}

export function BeautifulMermaid({ code, keepLastGood, paused, onTiming }: RendererProps) {
  // Survives across failed renders so keepLastGood has something to show.
  const lastGood = useRef<string | null>(null)

  const { svg, error, ms } = useMemo(() => {
    if (paused || !code.trim()) return { svg: lastGood.current, error: null, ms: null }
    const started = performance.now()
    try {
      const out = renderMermaidSVG(code, OPTIONS)
      lastGood.current = out
      return { svg: out, error: null, ms: performance.now() - started }
    } catch (err) {
      return {
        svg: keepLastGood ? lastGood.current : null,
        error: errorMessage(err),
        ms: null,
      }
    }
  }, [code, paused, keepLastGood])

  useEffect(() => {
    if (ms !== null) onTiming?.(ms)
  }, [ms, onTiming])

  return (
    <div className="space-y-2">
      {svg && <SvgSurface html={svg} dim={!!error} />}
      {error && <ErrorBox message={error} stale={!!svg} />}
    </div>
  )
}
