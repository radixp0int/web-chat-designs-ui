/**
 * Decision table. Bundle numbers are *measured*, not estimated — see the
 * method note under the table.
 */
const ROWS: { label: string; official: string; beautiful: string; markdown: string }[] = [
  {
    label: 'Diagram coverage',
    official: 'All types',
    beautiful: '6 types — no gantt / pie / mindmap / gitGraph / journey',
    markdown: 'All types (v10 grammar)',
  },
  {
    label: 'Isolated cost (gzip)',
    official: '919 kB',
    beautiful: '470 kB — of which elkjs is 441 kB',
    markdown: '1,085 kB',
  },
  {
    label: 'Widget IIFE delta (gzip)',
    official: '+920 kB → 1,108 kB total (5.9×)',
    beautiful: '+471 kB → 659 kB total (3.5×)',
    markdown: '+1,082 kB → 1,271 kB total (6.7×)',
  },
  {
    label: 'Page build behaviour',
    official: 'Code-splits — katex / cytoscape / per-diagram chunks load on demand',
    beautiful: 'Single static chunk, elkjs included',
    markdown: 'Single static chunk, mermaid v10 eager',
  },
  {
    label: 'Shadow DOM',
    official: 'Works — injects nothing into document.head, styles are inlined in the SVG',
    beautiful: 'Works — pure string output, nothing to leak',
    markdown: 'Renders, but with off-brand preset colors',
  },
  {
    label: 'Render model',
    official: 'async — needs a cancel guard per keystroke',
    beautiful: 'sync — plain useMemo, no race possible',
    markdown: 'async, inside render phase — needs an error boundary',
  },
  {
    label: 'Theme switching',
    official: 'Re-render: colors are baked into the SVG',
    beautiful: 'None: colors stay as var(--token) on the <svg>',
    markdown: 'Re-render, preset themes only (default / dark / forest / neutral)',
  },
  {
    label: 'Streaming resilience',
    official: 'Good — holds last good SVG, recovers when the source completes',
    beautiful: 'Best — never showed an error frame at all during replay',
    markdown: 'Broken — one failure sticks permanently (see below)',
  },
  {
    label: 'Error recovery',
    official: 'Recovers on the next valid source',
    beautiful: 'Recovers on the next valid source',
    markdown: 'Never clears its internal error state; only a remount resets it',
  },
  {
    label: 'Setup required',
    official: 'Resolve brand tokens to opaque hex — it rejects oklab() outright',
    beautiful: 'None — pass var(--token) straight through',
    markdown: 'One rehypePlugins entry on the renderer we already ship',
  },
  {
    label: 'Brand fit',
    official: 'themeVariables accept resolved brand.css tokens',
    beautiful: 'Consumes brand.css tokens directly, unresolved',
    markdown: 'Preset palettes only — no brand tokens',
  },
  {
    label: 'Maintenance',
    official: 'Upstream project, active',
    beautiful: 'Young (v1.1.3), small surface, 2 deps',
    markdown: 'v0.0.3, 8 stars, 33 commits — pins mermaid ^10',
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
              <th className="border-b border-line bg-tint/4 px-3 py-2 text-left font-semibold text-ink-strong">
                react-markdown-mermaid
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
                <td className="border-b border-line/60 px-3 py-2 align-top text-ink-soft">
                  {row.markdown}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line px-3 py-2 text-[11px] text-ink-soft">
        Bundle figures are measured, not estimated: each library was built alone as an IIFE, and
        again on top of the real widget entry, against a baseline widget of 188.73 kB gz. Timings in
        the column headers are live from this page.
      </p>
    </div>
  )
}

const FINDINGS = [
  {
    title: 'react-markdown-mermaid never recovers from a parse error',
    body: 'Its MermaidBlock sets an internal error state and has no path that clears it. Select Gantt (which fails on its mermaid v10 grammar), then switch to any valid diagram — the column still shows the Gantt error and renders nothing. During the streaming replay it stays broken for the whole run and after it completes. Only remounting resets it, which is why the dark-mode toggle appears to "fix" it. For a surface where a diagram arrives token by token and is invalid most of that time, this is disqualifying.',
  },
  {
    title: 'Its documented lifecycle callbacks are dead code',
    body: 'onLoad, onError and onRender are destructured from props and listed in effect dependency arrays, but never invoked. The timing shown in that column is measured by a MutationObserver watching for the <svg> to appear, because the library reports nothing.',
  },
  {
    title: 'Official mermaid rejects this codebase’s color tokens',
    body: 'brand.css builds its tokens from color-mix(in oklab, …). The browser resolves those to oklab() strings, and mermaid’s color library throws "Unsupported color format". Every token has to be flattened to opaque hex through a canvas first — see readPalette in useThemeEpoch.ts. It works, but it is a real integration tax that has to be maintained alongside the palette.',
  },
  {
    title: 'The shadow-DOM risk turned out not to be real',
    body: 'Mermaid v11 inlines its styles into the returned SVG string and injects nothing into document.head — measured at zero style tags. All three render correctly inside the widget’s shadow root. Bundle weight, not style isolation, is what the widget requirement actually decides.',
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
