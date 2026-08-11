/**
 * Diagram-type support, measured by parsing one minimal example of every
 * mermaid diagram type through each engine — not taken from any README.
 *
 * mermaid 11.16.0 via `parse(code, { suppressErrors: true })`; beautiful-mermaid
 * via `renderMermaidSVG`, which throws on what it can't do.
 */
type Support = { type: string; v11: boolean; bm: boolean }

const TYPES: Support[] = [
  { type: 'flowchart', v11: true, bm: true },
  { type: 'graph (legacy)', v11: true, bm: true },
  { type: 'sequenceDiagram', v11: true, bm: true },
  { type: 'classDiagram', v11: true, bm: true },
  { type: 'stateDiagram-v2', v11: true, bm: true },
  { type: 'erDiagram', v11: true, bm: true },
  { type: 'xychart-beta', v11: true, bm: true },
  { type: 'pie', v11: true, bm: false },
  { type: 'gantt', v11: true, bm: false },
  { type: 'journey', v11: true, bm: false },
  { type: 'gitGraph', v11: true, bm: false },
  { type: 'mindmap', v11: true, bm: false },
  { type: 'timeline', v11: true, bm: false },
  { type: 'quadrantChart', v11: true, bm: false },
  { type: 'requirementDiagram', v11: true, bm: false },
  { type: 'C4Context', v11: true, bm: false },
  { type: 'sankey-beta', v11: true, bm: false },
  { type: 'block-beta', v11: true, bm: false },
  { type: 'packet-beta', v11: true, bm: false },
  { type: 'kanban', v11: true, bm: false },
  { type: 'architecture-beta', v11: true, bm: false },
  { type: 'radar-beta', v11: true, bm: false },
  { type: 'treemap-beta', v11: true, bm: false },
]

const TOTAL = TYPES.length

function Cell({ ok }: { ok: boolean }) {
  return (
    <td className="border-b border-line/60 px-3 py-1.5 text-center">
      <span className={ok ? 'text-accent-fg' : 'text-ink-soft/50'}>{ok ? '●' : '—'}</span>
    </td>
  )
}

export function SupportMatrix() {
  const counts = {
    v11: TYPES.filter((t) => t.v11).length,
    bm: TYPES.filter((t) => t.bm).length,
  }

  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="px-4 pt-4">
        <h2 className="text-sm font-semibold text-ink-strong">Diagram-type support</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
          Measured by parsing a minimal example of every mermaid diagram type through each engine.
          The first seven rows are the overlap — everything both renderers can draw.
        </p>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-y border-line bg-tint/4 px-3 py-2 text-left font-semibold whitespace-nowrap text-ink-strong">
                Diagram type
              </th>
              <th className="border-y border-line bg-tint/4 px-3 py-2 text-center font-semibold whitespace-nowrap text-ink-strong">
                mermaid 11
                <span className="block text-[10px] font-normal text-ink-soft">
                  {counts.v11}/{TOTAL}
                </span>
              </th>
              <th className="border-y border-line bg-tint/4 px-3 py-2 text-center font-semibold whitespace-nowrap text-ink-strong">
                beautiful
                <span className="block text-[10px] font-normal text-ink-soft">
                  {counts.bm}/{TOTAL}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {TYPES.map((t, i) => (
              <tr
                key={t.type}
                className={i === 6 ? '[&>td]:border-b-2 [&>td]:border-b-accent/30' : ''}
              >
                <td className="border-b border-line/60 px-3 py-1.5 font-mono text-[12px] whitespace-nowrap text-ink-strong">
                  {t.type}
                </td>
                <Cell ok={t.v11} />
                <Cell ok={t.bm} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="border-t border-line px-4 py-2 text-[11px] leading-relaxed text-ink-soft">
        Everything below the rule falls back to a plain code block under beautiful-mermaid. The
        question that decides it is how often the assistant actually emits those types.
      </p>
    </div>
  )
}
