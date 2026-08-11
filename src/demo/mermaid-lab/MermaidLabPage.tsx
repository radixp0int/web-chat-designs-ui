import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ThemeToggle } from '../components/ThemeToggle'
import { RENDERER_META } from './renderers/types'
import { RendererColumn } from './RendererColumn'
import { SAMPLES, type Sample, type SampleKind } from './samples'
import { ShadowHost } from './ShadowHost'
import { Findings, Scorecard } from './Scorecard'
import { SupportMatrix } from './SupportMatrix'
import { useStreamReplay } from './useStreamReplay'

const KIND_LABEL: Record<SampleKind, string> = {
  common: 'Common six',
  probe: 'Coverage probes',
  realistic: 'LLM-style',
}

const KIND_HINT: Record<SampleKind, string> = {
  common: 'All three renderers claim support — this is the fidelity comparison.',
  probe: 'Not implemented by beautiful-mermaid. Expected to fail in that column.',
  realistic: 'Quoted labels, <br/>, subgraphs, emoji, style directives.',
}

export function MermaidLabPage() {
  const [sample, setSample] = useState<Sample>(SAMPLES[0])
  const [draft, setDraft] = useState(SAMPLES[0].code)
  const [keepLastGood, setKeepLastGood] = useState(true)
  const [gateUntilComplete, setGateUntilComplete] = useState(false)
  const [chunkSize, setChunkSize] = useState(12)
  const [showShadow, setShowShadow] = useState(false)

  useEffect(() => setDraft(sample.code), [sample])

  const replay = useStreamReplay(draft, chunkSize)
  const streaming = !replay.complete

  // What the renderers actually receive: the truncated prefix during replay.
  const code = replay.text
  const paused = gateUntilComplete && streaming

  const grouped = useMemo(() => {
    const map = new Map<SampleKind, Sample[]>()
    for (const s of SAMPLES) {
      const list = map.get(s.kind) ?? []
      list.push(s)
      map.set(s.kind, list)
    }
    return [...map.entries()]
  }, [])

  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto max-w-[1800px] px-6 py-8">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-chip px-2 py-0.5 text-[10px] font-semibold tracking-wide text-chip-fg uppercase">
                Lab
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-ink-strong">
                Mermaid renderer bake-off
              </h1>
            </div>
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-ink-soft">
              Three renderers, one diagram corpus. Temporary — once we pick one, this folder and the
              two losing dependencies get deleted, and the winner goes into the shared markdown
              renderer's <code className="font-mono text-ink-strong">code</code> override.{' '}
              <Link to="/" className="text-brand-fg underline underline-offset-2">
                Back to demos
              </Link>
            </p>
          </div>
          <ThemeToggle />
        </header>

        {/* ---- corpus picker ---- */}
        <div className="glass mb-4 rounded-2xl p-4">
          <div className="space-y-3">
            {grouped.map(([kind, list]) => (
              <div key={kind}>
                <div className="mb-1.5 flex flex-wrap items-baseline gap-2">
                  <h2 className="text-xs font-semibold tracking-wide text-ink-strong uppercase">
                    {KIND_LABEL[kind]}
                  </h2>
                  <span className="text-[11px] text-ink-soft">{KIND_HINT[kind]}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSample(s)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        sample.id === s.id
                          ? 'bg-brand-solid text-on-brand-solid'
                          : 'bg-tint/8 text-ink-soft hover:bg-tint/16 hover:text-ink-strong'
                      }`}
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---- source + controls ---- */}
        <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="glass rounded-2xl p-4">
            <label
              htmlFor="mermaid-source"
              className="mb-2 block text-xs font-semibold tracking-wide text-ink-strong uppercase"
            >
              Source — edit freely
            </label>
            <textarea
              id="mermaid-source"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              spellCheck={false}
              rows={12}
              className="w-full resize-y rounded-xl border border-line bg-code-block p-3 font-mono text-[12px] leading-relaxed text-ink-strong outline-none focus-visible:border-accent"
            />
          </div>

          <div className="glass space-y-4 rounded-2xl p-4">
            <div>
              <h2 className="text-xs font-semibold tracking-wide text-ink-strong uppercase">
                Streaming replay
              </h2>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
                Feeds a growing prefix to all three at once. Every intermediate value is invalid
                mermaid — the same thing that reaches the renderer while a message streams.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={replay.playing ? replay.pause : replay.play}
                className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent transition hover:bg-accent-hover"
              >
                {replay.playing ? 'Pause' : 'Replay stream'}
              </button>
              <span className="font-mono text-[11px] text-ink-soft tabular-nums">
                {replay.cursor}/{replay.total}
              </span>
              {streaming && (
                <span className="rounded-full bg-tint/10 px-2 py-0.5 text-[10px] font-semibold text-ink-soft">
                  streaming
                </span>
              )}
            </div>

            <input
              type="range"
              min={0}
              max={replay.total}
              value={replay.cursor}
              onChange={(e) => {
                replay.pause()
                replay.setCursor(Number(e.target.value))
              }}
              className="w-full accent-accent"
              aria-label="Stream position"
            />

            <label className="flex items-center justify-between gap-3 text-xs text-ink-soft">
              <span>Chunk size</span>
              <input
                type="number"
                min={1}
                max={200}
                value={chunkSize}
                onChange={(e) => setChunkSize(Math.max(1, Number(e.target.value)))}
                className="w-20 rounded-lg border border-line bg-code-block px-2 py-1 text-right font-mono text-[11px] text-ink-strong outline-none focus-visible:border-accent"
              />
            </label>

            <div className="space-y-2 border-t border-line pt-3">
              <Toggle
                checked={keepLastGood}
                onChange={setKeepLastGood}
                label="Hold last good render"
                hint="Keep the previous SVG on screen instead of flashing an error box."
              />
              <Toggle
                checked={gateUntilComplete}
                onChange={setGateUntilComplete}
                label="Gate until stream completes"
                hint="Render nothing until the source is whole. Compare against flicker."
              />
              <Toggle
                checked={showShadow}
                onChange={setShowShadow}
                label="Also render in a shadow root"
                hint="The widget's mount target. Reveals styles that can't cross the boundary."
              />
            </div>
          </div>
        </div>

        {/* ---- the comparison ---- */}
        <div className="mb-6 grid min-w-0 gap-4 xl:grid-cols-2">
          {RENDERER_META.map((meta) => (
            <RendererColumn
              key={meta.key}
              meta={meta}
              code={code}
              keepLastGood={keepLastGood}
              paused={paused}
            />
          ))}
        </div>

        {showShadow && (
          <div className="mb-6">
            <div className="mb-2 flex items-baseline gap-2">
              <h2 className="text-sm font-semibold text-ink-strong">Inside a shadow root</h2>
              <span className="text-[11px] text-ink-soft">
                Same three renderers, mounted the way <code className="font-mono">mount.tsx</code>{' '}
                mounts the widget: styles.css injected as a &lt;style&gt;, theme class on the inner
                root.
              </span>
            </div>
            <div className="rounded-2xl border border-dashed border-accent/40 p-3">
              <ShadowHost>
                <div className="grid min-w-0 gap-4 xl:grid-cols-2">
                  {RENDERER_META.map((meta) => (
                    <RendererColumn
                      key={meta.key}
                      meta={meta}
                      code={code}
                      keepLastGood={keepLastGood}
                      paused={paused}
                    />
                  ))}
                </div>
              </ShadowHost>
            </div>
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Scorecard />
          <Findings />
        </div>

        <div className="mt-4 max-w-3xl">
          <SupportMatrix />
        </div>
      </div>
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint: string
}) {
  return (
    <label className="flex cursor-pointer gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-3.5 shrink-0 accent-accent"
      />
      <span className="min-w-0">
        <span className="block text-xs font-medium text-ink-strong">{label}</span>
        <span className="block text-[11px] leading-snug text-ink-soft">{hint}</span>
      </span>
    </label>
  )
}
