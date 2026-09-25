import { useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { renderMermaidSVG } from 'beautiful-mermaid'
import { CopyButton, useUiSize } from '@chat/ui'
import { MermaidFrame, MermaidPending } from './frame'
import { completeLines, describeDiagram, hasBody } from './source'
import type { MermaidBlockProps } from './types'

/**
 * Colours go in as `var(--token)` and stay that way on the <svg>, so a palette
 * or light/dark switch recolours a drawn diagram with no re-render. Inside the
 * widget's shadow root the tokens resolve against the widget's own root, so
 * its palette applies too.
 */
const OPTIONS = {
  bg: 'var(--code-block)',
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

/**
 * Model output decides what goes into this SVG, and a retrieved document can
 * steer the model — so the markup is untrusted even though the renderer
 * escapes label text. Checked against beautiful-mermaid 1.1.3: labels and
 * attribute break-outs are escaped, but a `style` statement passes
 * `javascript:` into a fill url(). Browsers don't run that, and it is still
 * the kind of gap one version bump could widen.
 *
 * DOMPurify's SVG profile drops scripts, handlers and foreign content, and
 * vets URL attributes (href, xlink:href) — but not presentation attributes
 * like `fill`, which is where that url() lands. The hook covers those. A
 * private instance, so the hook never reaches anything else on the page that
 * uses DOMPurify (official mermaid bundles it). About a millisecond per
 * finished line.
 */
const purify = DOMPurify(window)
purify.addHook('uponSanitizeAttribute', (_node, data) => {
  if (/javascript:/i.test(data.attrValue.replace(/\s+/g, ''))) data.keepAttr = false
})

function draw(source: string): string | null {
  try {
    return purify.sanitize(renderMermaidSVG(source, OPTIONS), {
      USE_PROFILES: { svg: true, svgFilters: true },
    })
  } catch {
    return null
  }
}

/** Loaded on demand by MermaidBlock — this module carries the renderer. */
export default function MermaidDiagram({ code, streaming }: MermaidBlockProps) {
  const { label, drawable } = describeDiagram(code)
  const compact = useUiSize() === 'compact'
  const [showSource, setShowSource] = useState(false)

  const source = streaming ? completeLines(code) : code
  const svg = useMemo(() => (drawable && hasBody(source) ? draw(source) : null), [source, drawable])

  // The last diagram that drew. Mid-stream, a finished line can still leave the
  // source invalid for a moment — an edge to a node declared further down —
  // and holding the previous frame reads far better than flashing an error.
  // Set during render (React's derived-state pattern), not in an effect, so
  // the held frame never lags a render behind.
  const [held, setHeld] = useState<string | null>(null)
  if (svg && svg !== held) setHeld(svg)

  if (streaming) {
    const shown = svg ?? held
    if (!shown) return <MermaidPending label={label} />
    return (
      <MermaidFrame label={label} busy>
        <Drawing svg={shown} label={label} />
      </MermaidFrame>
    )
  }

  const copy = (
    <CopyButton
      text={code}
      label="Copy diagram source"
      copiedLabel="Copied"
      size="sm"
      iconSize={14}
    />
  )

  // Finished but not drawable — an unsupported type, or a real error. Either
  // way the reader gets the source and one plain sentence, never the parser's
  // message: beautiful-mermaid's names only flowcharts, whatever the type.
  if (!svg) {
    return (
      <MermaidFrame label={label} actions={copy}>
        <p className="border-b border-line px-3.5 py-2 text-xs text-ink-soft">
          {drawable
            ? 'This diagram has an error, so here is its source.'
            : `This ${label.toLowerCase()} can’t be drawn here yet, so here is its source.`}
        </p>
        <Source code={code} compact={compact} />
      </MermaidFrame>
    )
  }

  return (
    <MermaidFrame
      label={label}
      actions={
        <>
          <button
            type="button"
            onClick={() => setShowSource((s) => !s)}
            aria-label={showSource ? 'Show diagram' : 'Show diagram source'}
            className="rounded-md px-2 py-1 text-[11px] font-semibold tracking-wide text-ink-soft uppercase transition hover:bg-tint/8 hover:text-ink-strong"
          >
            {showSource ? 'Diagram' : 'Source'}
          </button>
          {copy}
        </>
      }
    >
      {showSource ? <Source code={code} compact={compact} /> : <Drawing svg={svg} label={label} />}
    </MermaidFrame>
  )
}

function Drawing({ svg, label }: { svg: string; label: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="overflow-x-auto p-4 [&>svg]:mx-auto [&>svg]:h-auto [&>svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

function Source({ code, compact }: { code: string; compact: boolean }) {
  return (
    <pre
      className={`overflow-x-auto p-3.5 font-mono leading-relaxed text-ink-strong ${compact ? 'text-xs' : 'text-[13px]'}`}
    >
      <code>{code}</code>
    </pre>
  )
}
