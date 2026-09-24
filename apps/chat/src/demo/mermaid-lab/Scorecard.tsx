/**
 * Decision table. Bundle numbers are *measured*, not estimated — see the
 * method note under the table.
 */
const ROWS: { label: string; official: string; beautiful: string }[] = [
  {
    label: 'Diagram coverage',
    official: '23 / 23 — everything',
    beautiful: '7 / 23 — flowchart, graph, sequence, class, state, ER, xychart',
  },
  {
    label: 'Isolated cost (gzip)',
    official: '919 kB',
    beautiful: '470 kB — of which elkjs is 441 kB',
  },
  {
    label: 'Widget IIFE delta (gzip)',
    official: '+920 kB → 1,108 kB total (5.9×)',
    beautiful: '+471 kB → 659 kB total (3.5×)',
  },
  {
    label: 'Page build behaviour',
    official: 'Code-splits — katex / cytoscape / per-diagram chunks load on demand',
    beautiful: 'Single static chunk, elkjs included',
  },
  {
    label: 'Shadow DOM',
    official: 'Works — injects nothing into document.head, styles are inlined in the SVG',
    beautiful: 'Works — pure string output, nothing to leak',
  },
  {
    label: 'Render model',
    official: 'async — needs a cancel guard per keystroke',
    beautiful: 'sync — plain useMemo, no race possible',
  },
  {
    label: 'Theme switching',
    official: 'Re-render: colors are baked into the SVG',
    beautiful: 'None: colors stay as var(--token) on the <svg>',
  },
  {
    label: 'Streaming resilience',
    official: 'Good — holds last good SVG, recovers when the source completes',
    beautiful: 'Best — never showed an error frame at all during replay',
  },
  {
    label: 'Error recovery',
    official: 'Recovers on the next valid source',
    beautiful: 'Recovers on the next valid source',
  },
  {
    label: 'Setup required',
    official: 'Resolve brand tokens to opaque hex — it rejects oklab() outright',
    beautiful: 'None — pass var(--token) straight through',
  },
  {
    label: 'Brand fit',
    official: 'themeVariables accept resolved brand.css tokens',
    beautiful: 'Consumes brand.css tokens directly, unresolved',
  },
  {
    label: 'Maintenance',
    official: 'Upstream project, active',
    beautiful: 'Young (v1.1.3), small surface, 2 deps',
  },
]

export function Scorecard() {
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b border-line bg-tint/4 px-3 py-2 text-left font-semibold whitespace-nowrap text-ink-strong">
                Criterion
              </th>
              <th className="border-b border-line bg-tint/4 px-3 py-2 text-left font-semibold text-ink-strong">
                Official Mermaid
              </th>
              <th className="border-b border-line bg-tint/4 px-3 py-2 text-left font-semibold text-ink-strong">
                beautiful-mermaid
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label}>
                <td className="border-b border-line/60 px-3 py-2 align-top font-medium whitespace-nowrap text-ink-strong">
                  {row.label}
                </td>
                <td className="border-b border-line/60 px-3 py-2 align-top text-ink-soft">
                  {row.official}
                </td>
                <td className="border-b border-line/60 px-3 py-2 align-top text-ink-soft">
                  {row.beautiful}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line px-3 py-2 text-[11px] leading-relaxed text-ink-soft">
        Bundle figures are measured, not estimated: each library was built alone as an IIFE, and
        again on top of the real widget entry, against a baseline widget of 188.73 kB gz. Timings in
        the column headers are live from this page. Removing react-markdown-mermaid took the page
        entry chunk from 794.50 to 689.50 kB gz.
      </p>
    </div>
  )
}

const FINDINGS = [
  {
    title: 'Rejected and removed: react-markdown-mermaid',
    body: 'Evaluated as a third candidate, then uninstalled — kept here so it is not re-proposed without re-doing the work. Three findings, all observed rather than read: (1) its MermaidBlock sets an internal error state with no code path that clears it, so one bad diagram breaks that message permanently — a valid diagram selected right after a failing one still rendered nothing, and it stayed broken through an entire streaming replay and after it completed; only a remount reset it. (2) onLoad, onError and onRender are destructured and listed in effect dependency arrays but never invoked. (3) It pinned mermaid ^10, installing a second engine beside v11 — the heaviest option at +1,082 kB gz, and 18/23 diagram types against v11’s 23/23.',
  },
  {
    title: 'beautiful-mermaid’s parse error under-reports what it supports',
    body: "Every unsupported header falls through to its flowchart parser, so the message is always \"Invalid mermaid header: … Expected 'graph TD', 'flowchart LR', 'stateDiagram-v2', etc.\" — it never names sequence, class, ER or xychart even though all four render fine. Verified directly against the library: the six claimed types all work; gitGraph and pie genuinely do not. The message is a wart, not a narrower capability, but it should not be surfaced to end users as-is if we ship this.",
  },
  {
    title: 'Official mermaid rejects this codebase’s color tokens',
    body: 'brand.css builds its tokens from color-mix(in oklab, …). The browser resolves those to oklab() strings, and mermaid’s color library throws "Unsupported color format". Every token has to be flattened to opaque hex through a canvas first — see readPalette in useThemeEpoch.ts. It works, but it is a real integration tax that has to be maintained alongside the palette.',
  },
  {
    title: 'The shadow-DOM risk turned out not to be real',
    body: 'Mermaid v11 inlines its styles into the returned SVG string and injects nothing into document.head — measured at zero style tags. Both renderers work correctly inside the widget’s shadow root. Bundle weight, not style isolation, is what the widget requirement actually decides.',
  },
  {
    title: 'beautiful-mermaid is 94% elkjs',
    body: 'Its "2 MB, two dependencies" framing is misleading in bundle terms: elkjs alone is 441 kB gz of the 470 kB total, so the library’s own code is only ~28 kB gz. It is still half the weight of official mermaid, but it is not a lightweight dependency.',
  },
]

export function Findings() {
  return (
    <div className="glass rounded-2xl p-4">
      <h2 className="text-sm font-semibold text-ink-strong">What the lab actually found</h2>
      <p className="mt-1 text-[11px] text-ink-soft">
        Observed on this page, not taken from documentation.
      </p>
      <ul className="mt-3 space-y-3">
        {FINDINGS.map((f) => (
          <li key={f.title}>
            <h3 className="text-xs font-semibold text-ink-strong">{f.title}</h3>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-soft">{f.body}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
