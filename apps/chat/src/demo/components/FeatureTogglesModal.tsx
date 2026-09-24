import { useEffect, useRef } from 'react'
import { IconButton } from '../../lib/components/icon-button'
import { XIcon } from '../../lib/components/icons'
import { FeatureToggles } from '../../lib/components/settings'
import { DEMO_CATALOGUE, useDemoFeatures } from '../demoFeatures'

/**
 * The demo's feature-toggle shell — and nothing but a shell.
 *
 * Everything inside it comes from `lib/components/settings`, driven by the
 * catalogue in demoFeatures.ts. That split is the point: the dialog, its
 * anchoring, the title and the reset footer are this app's opinions, while the
 * switch list is the library's. The two appearance pickers are the library's
 * too, but they are a viewer preference rather than presenter chrome, so they
 * sit in UserSettingsModal — which is exactly the regrouping a product does
 * when it drops these components into its own account settings.
 *
 * Anchored right rather than centred, with a light unblurred scrim: a centred
 * dialog would hide the very conversation these switches change. It is still a
 * true modal — a native <dialog> in the top layer, so focus trapping, Esc, and
 * inertness of the page behind it come from the platform.
 */
export function FeatureTogglesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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
      aria-labelledby="feature-toggles-title"
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
            <h2 id="feature-toggles-title" className="text-base font-semibold text-ink-strong">
              Feature toggles
            </h2>
            <p className="mt-1 text-[13px] leading-snug text-ink-soft">
              Choose what a response shows. Saved on this device.
            </p>
          </div>
          <IconButton size="md" onClick={onClose} aria-label="Close feature toggles" title="Close">
            <XIcon width={16} height={16} />
          </IconButton>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3">
          <FeatureToggles catalogue={DEMO_CATALOGUE} flags={flags} onChange={setFlag} />
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
