import { useEffect, useRef, useState } from 'react'
import type { RendererProps } from './types'
import { ErrorBox, Pending, SvgSurface } from './shared'
import { errorMessage } from './errorMessage'
import { readPalette, useThemeEpoch } from '../useThemeEpoch'

/**
 * Candidate A — the official `mermaid` package, lazily imported.
 *
 * The dynamic import keeps ~500 kB of d3/cytoscape/katex out of the entry
 * chunk; nothing renders until the first diagram is on screen.
 */
let mermaidPromise: Promise<typeof import('mermaid').default> | null = null

function loadMermaid() {
  mermaidPromise ??= import('mermaid').then((m) => m.default)
  return mermaidPromise
}

let idCounter = 0

export function OfficialMermaid({ code, keepLastGood, paused, onTiming }: RendererProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const epoch = useThemeEpoch()

  useEffect(() => {
    if (paused || !code.trim()) return
    let cancelled = false

    void (async () => {
      const started = performance.now()
      try {
        const mermaid = await loadMermaid()
        if (cancelled) return

        // themeVariables are parsed in JS to derive shades, so they must be
        // concrete colors — `var(--canvas)` never survives this path.
        const palette = readPalette(hostRef.current ?? document.body)
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'base',
          fontFamily: 'inherit',
          themeVariables: {
            background: palette.canvas,
            primaryColor: palette.panel,
            primaryBorderColor: palette.line,
            primaryTextColor: palette.ink,
            secondaryColor: palette.code,
            tertiaryColor: palette.canvas,
            lineColor: palette.inkSoft,
            textColor: palette.ink,
            mainBkg: palette.panel,
            nodeBorder: palette.line,
            clusterBkg: palette.code,
            clusterBorder: palette.line,
            titleColor: palette.ink,
            edgeLabelBackground: palette.canvas,
          },
        })

        // parse() validates without leaving mermaid's error node in the DOM,
        // which matters when the streaming replay feeds it broken source ~40x.
        const ok = await mermaid.parse(code, { suppressErrors: true })
        if (cancelled) return
        if (!ok) throw new Error('Incomplete or invalid mermaid source')

        const { svg: out } = await mermaid.render(`mmd-official-${++idCounter}`, code)
        if (cancelled) return
        onTiming?.(performance.now() - started)
        setSvg(out)
        setError(null)
      } catch (err) {
        if (cancelled) return
        setError(errorMessage(err))
        if (!keepLastGood) setSvg(null)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [code, epoch, paused, keepLastGood, onTiming])

  return (
    <div ref={hostRef} className="space-y-2">
      {svg && <SvgSurface html={svg} dim={!!error} />}
      {error && <ErrorBox message={error} stale={!!svg} />}
      {!svg && !error && <Pending />}
    </div>
  )
}
