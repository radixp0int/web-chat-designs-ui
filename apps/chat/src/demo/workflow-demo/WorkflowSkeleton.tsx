// The first paint, while React Flow and this section's chunk load.
//
// It lives OUTSIDE the lazy chunk on purpose — a fallback that had to be fetched
// before it could be shown would defeat the point. It draws the shell the real
// page resolves into (panel, canvas, inspector) so the layout doesn't jump, and
// it borrows the app's own motion: the drifting orb and the shimmer sweep.
import { AmbientGlow } from '../components/AmbientGlow'

export function WorkflowSkeleton() {
  return (
    <div className="relative flex h-dvh gap-4 overflow-hidden bg-canvas p-4" aria-hidden>
      <AmbientGlow />

      <aside className="glass flex w-72 shrink-0 flex-col rounded-xl">
        <div className="flex items-center gap-3 px-6 pt-6 pb-5">
          <span className="orb block size-[30px] shrink-0 animate-orb-drift rounded-full" />
          <Bar className="h-4 w-24" />
        </div>
        <div className="px-5">
          <div className="rounded-lg bg-panel-solid p-4 shadow-sm ring-1 ring-line">
            <Bar className="h-3.5 w-40" />
            <Bar className="mt-2 h-3 w-32" />
            <Bar className="mt-1.5 h-3 w-28" />
          </div>
        </div>
        <div className="flex flex-col gap-3 px-7 pt-7">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="size-[18px] shrink-0 rounded-full bg-tint/10" />
              <Bar className="h-3 flex-1" style={{ maxWidth: 120 + ((i * 23) % 60) }} />
            </div>
          ))}
        </div>
      </aside>

      <main className="glass relative flex min-w-0 flex-1 overflow-hidden rounded-xl">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-line px-6">
            <Bar className="h-4 w-52" />
            <div className="ml-auto flex items-center gap-2.5">
              <Bar className="h-8 w-44 rounded-full" />
              <Bar className="h-8 w-24 rounded-lg" />
            </div>
          </div>

          {/* Ghost stage columns — the shape the run resolves into. */}
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div className="flex h-full gap-6 px-8 pt-6">
              {[2, 3, 2, 2, 2].map((count, col) => (
                <div key={col} className="flex flex-1 flex-col gap-4 pt-[6%]">
                  <Bar className="mb-2 h-3.5 w-24" />
                  {Array.from({ length: count }).map((_, row) => (
                    <div
                      key={row}
                      className="h-[88px] rounded-lg border border-line bg-panel-solid/60 shadow-sm shadow-(color:--shadow-soft)"
                      style={{
                        animation: 'var(--animate-fade-up)',
                        animationDelay: `${(col * 3 + row) * 45}ms`,
                      }}
                    >
                      <div className="flex items-center gap-1.5 px-3.5 pt-3">
                        <span className="size-5 rounded-full bg-tint/12" />
                        <Bar className="h-5 w-16 rounded-md" />
                      </div>
                      <Bar className="mt-2.5 ml-3.5 h-3.5 w-28" />
                      <Bar className="mt-1.5 ml-3.5 h-3 w-20" />
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-2">
              <span className="shimmer-text text-[13px] font-semibold">Loading the run…</span>
            </div>
          </div>
        </div>

        <div className="hidden w-[400px] shrink-0 flex-col gap-5 border-l border-line bg-panel-solid/45 px-6 py-5 lg:flex">
          <Bar className="h-5 w-32 rounded-md" />
          <Bar className="h-6 w-56" />
          <div className="flex flex-col gap-2">
            <Bar className="h-3 w-full" />
            <Bar className="h-3 w-4/5" />
          </div>
          <div className="mt-2 h-28 rounded-lg bg-panel-solid ring-1 ring-line" />
        </div>
      </main>
    </div>
  )
}

/** A shimmering placeholder block. */
function Bar({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <span className={`block animate-pulse rounded bg-tint/12 ${className}`} style={style} />
}

/** Same wash the other pages use, so the load state is recognisably the app. */
