import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { MermaidBlock, rehypeMermaid } from 'react-markdown-mermaid'
import type { RendererProps } from './types'
import { errorMessage } from './errorMessage'
import { useThemeEpoch } from '../useThemeEpoch'

/**
 * Candidate C — `react-markdown-mermaid`.
 *
 * The only candidate whose unit of work is a *markdown document*, not a bare
 * diagram: its rehype plugin rewrites ```mermaid fences into a <MermaidBlock>
 * node, so integration is one `rehypePlugins` entry on the renderer we already
 * ship. The bare source is wrapped back into a fence here to feed it.
 *
 * It resolves `mermaid` to ^10 — a second copy of the engine alongside the v11
 * candidate A uses. Its own preset themes are the only theming hook.
 */
export function MarkdownMermaid({ code, keepLastGood, paused, onTiming }: RendererProps) {
  const epoch = useThemeEpoch()
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const startedRef = useRef(0)
  const lastGood = useRef('')

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [epoch])

  const source = useMemo(() => {
    if (paused || !code.trim()) return keepLastGood ? lastGood.current : ''
    lastGood.current = '```mermaid\n' + code + '\n```'
    return lastGood.current
  }, [code, paused, keepLastGood])

  const plugins = useMemo(
    () => [[rehypeMermaid, { mermaidConfig: { theme: dark ? 'dark' : 'default' } }]],
    [dark],
  )

  const components = useMemo(
    () => ({
      // The plugin emits a <MermaidBlock> element; react-markdown looks the tag
      // up in this map. Wrapping it lets the lab attach framing.
      MermaidBlock: (props: { code?: string }) => (
        <div className="overflow-x-auto rounded-xl border border-line bg-code-block p-3 [&_svg]:h-auto [&_svg]:max-w-full [&_.error-message]:text-xs [&_.error-message]:text-danger-fg [&_.loading-spinner]:text-xs [&_.loading-spinner]:text-ink-soft">
          <MermaidBlock
            code={props.code ?? ''}
            loadingText="Rendering…"
            errorText="Render failed"
          />
        </div>
      ),
    }),
    [],
  )

  startedRef.current = performance.now()

  // MermaidBlock declares onLoad / onError / onRender props and even lists them
  // in its effect dependencies, but never invokes them — so timing has to be
  // observed from the DOM instead of reported by the library.
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = containerRef.current
    if (!el || !source) return
    const start = startedRef.current
    if (el.querySelector('svg')) return

    const observer = new MutationObserver(() => {
      if (el.querySelector('svg')) {
        onTiming?.(performance.now() - start)
        observer.disconnect()
      }
    })
    observer.observe(el, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [source, dark, onTiming])

  if (!source) return null

  return (
    <div ref={containerRef}>
      <MermaidErrorBoundary resetKey={source}>
        <ReactMarkdown
          key={dark ? 'dark' : 'light'}
          rehypePlugins={plugins as never}
          components={components as never}
        >
          {source}
        </ReactMarkdown>
      </MermaidErrorBoundary>
    </div>
  )
}

/**
 * The rehype plugin runs during render, so malformed source throws inside
 * React's render phase where a try/catch in the component cannot reach it.
 * Mid-stream source is malformed constantly, so this boundary is required.
 */
type BoundaryProps = { children: ReactNode; resetKey: string }
type BoundaryState = { error: string | null; seenKey: string }

class MermaidErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null, seenKey: this.props.resetKey }

  static getDerivedStateFromError(err: unknown): Partial<BoundaryState> {
    return { error: errorMessage(err) }
  }

  // New source clears the previous failure during the render pass, so a
  // recovering stream doesn't need an extra commit to drop the error box.
  static getDerivedStateFromProps(props: BoundaryProps, state: BoundaryState) {
    if (props.resetKey !== state.seenKey) return { error: null, seenKey: props.resetKey }
    return null
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-xl border border-danger/30 bg-danger/8 p-3">
          <p className="text-xs font-semibold text-danger-fg">Render failed</p>
          <pre className="mt-1.5 overflow-x-auto font-mono text-[11px] text-ink-soft">
            {this.state.error}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
