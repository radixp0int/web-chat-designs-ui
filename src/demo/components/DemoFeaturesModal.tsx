import { useEffect, useRef } from 'react'
import { IconButton } from '../../lib/components/icon-button'
import { XIcon } from '../../lib/components/icons'
import {
  DEMO_FEATURES,
  DEMO_FEATURE_GROUPS,
  useDemoFeatures,
  type DemoFeatureId,
} from '../demoFeatures'

/**
 * Presenter controls for what a response shows, grouped by where each feature
 * lands in a streamed turn — the order someone narrates a demo in.
 *
 * Anchored right rather than centred, with a light unblurred scrim: a centred
 * dialog would hide the very conversation these switches change. It is still a
 * true modal — a native <dialog> in the top layer, so focus trapping, Esc, and
 * inertness of the page behind it come from the platform.
 */
export function DemoFeaturesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const { flags, setFlag, reset } = useDemoFeatures()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby="demo-features-title"
      // Esc and the platform's own close paths land here too.
      onClose={onClose}
      // A click that lands on the dialog element itself is a backdrop click —
      // the card below stops anything inside it from reaching here.
      onClick={(e) => e.target === ref.current && onClose()}
      className="fixed top-1/2 right-4 left-auto m-0 max-w-none -translate-y-1/2 border-0 bg-transparent p-0 backdrop:bg-scrim/25"
    >
      <div className="glass flex max-h-[calc(100dvh-2rem)] w-[min(26rem,calc(100vw-2rem))] flex-col rounded-xl">
        <header className="flex items-start gap-3 px-5 pt-5 pb-4">
          <div className="min-w-0 flex-1">
            <h2 id="demo-features-title" className="text-base font-semibold text-ink-strong">
              Demo features
            </h2>
            <p className="mt-1 text-[13px] leading-snug text-ink-soft">
              Choose what a response shows. Saved on this device.
            </p>
          </div>
          <IconButton size="md" onClick={onClose} aria-label="Close demo features" title="Close">
            <XIcon width={16} height={16} />
          </IconButton>
        </header>

        {/* One spine for the whole turn, with a node marking each phase —
            the same branch language the follow-up chips use. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3">
          {/* ink-soft rather than --line: at 10% alpha in the light theme a
              --line hairline vanishes, and this one carries structure. */}
          <div className="ml-1 border-l border-ink-soft/25 pl-5">
            {DEMO_FEATURE_GROUPS.map(({ phase, features }) => (
              <section key={phase} className="relative pb-5 last:pb-0">
                {/* -left-6 puts the node's centre on the spine: pl-5 (20px)
                    plus the 1px border, less half the node. */}
                <span
                  aria-hidden
                  className="absolute top-[5px] -left-6 size-[7px] rounded-full border border-ink-soft/30 bg-panel-solid"
                />
                <h3 className="text-[11px] font-semibold tracking-[0.14em] text-ink-soft uppercase">
                  {phase}
                </h3>
                <div className="mt-1.5 -ml-2">
                  {features.map((id) => (
                    <FeatureRow key={id} id={id} on={flags[id]} onChange={setFlag} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <footer className="border-t border-line px-5 py-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg px-2 py-1 text-[13px] font-medium text-ink-soft transition hover:text-ink-strong"
          >
            Reset to defaults
          </button>
        </footer>
      </div>
    </dialog>
  )
}

function FeatureRow({
  id,
  on,
  onChange,
}: {
  id: DemoFeatureId
  on: boolean
  onChange: (id: DemoFeatureId, on: boolean) => void
}) {
  const { label, hint } = DEMO_FEATURES[id]

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(id, !on)}
      className="flex w-full items-start gap-4 rounded-xl px-2 py-2 text-left transition hover:bg-tint/6"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-medium text-ink-strong">{label}</span>
        <span className="mt-0.5 block text-xs leading-snug text-ink-soft">{hint}</span>
      </span>
      <span
        aria-hidden
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${
          on ? 'bg-accent' : 'bg-tint/25'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-panel-solid ring-1 shadow-sm transition-transform ${
            on ? 'translate-x-4 ring-accent/40' : 'ring-line'
          }`}
        />
      </span>
    </button>
  )
}
