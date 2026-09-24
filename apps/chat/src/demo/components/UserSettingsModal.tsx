import { useEffect, useRef } from 'react'
import { IconButton } from '../../lib/components/icon-button'
import { XIcon } from '../../lib/components/icons'
import { HighlightPicker, PalettePicker } from '../../lib/components/settings'
import { DEMO_USER } from '../config'
import { SHIPPED_HIGHLIGHTS, SHIPPED_PALETTES } from '../../lib/settings'
import { DEMO_APPEARANCE, useDemoFeatures } from '../demoFeatures'

/**
 * The account dialog behind the sidebar avatar's "User settings".
 *
 * It is the other half of the split the library's settings components were
 * written for: the two pickers are a *viewer's* preferences, so they belong
 * here beside the profile, while FeatureTogglesModal keeps the switches that
 * decide what a response is allowed to render. Both dialogs are this app's
 * shell around `lib/components/settings`; neither owns a control.
 *
 * Same anchoring as the other dialog — right, unblurred scrim — because both
 * change the conversation you are looking at, and a centred card would cover
 * the evidence.
 */
export function UserSettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const { highlight, setHighlight, palette, setPalette, resetAppearance } = useDemoFeatures()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby="user-settings-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="fixed top-1/2 right-4 left-auto m-0 max-w-none -translate-y-1/2 border-0 bg-transparent p-0 backdrop:bg-scrim/25"
    >
      <div className="glass flex max-h-[calc(100dvh-2rem)] w-[min(26rem,calc(100vw-2rem))] flex-col rounded-xl">
        <header className="flex items-start gap-3 px-5 pt-5 pb-4">
          <div className="min-w-0 flex-1">
            <h2 id="user-settings-title" className="text-base font-semibold text-ink-strong">
              User settings
            </h2>
            <p className="mt-1 text-[13px] leading-snug text-ink-soft">
              Your profile and how the chat looks. Saved on this device.
            </p>
          </div>
          <IconButton size="md" onClick={onClose} aria-label="Close user settings" title="Close">
            <XIcon width={16} height={16} />
          </IconButton>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3">
          {/* Read-only: this demo has no account backend, and a form that
              silently discarded an edit would be a worse lie than plain text. */}
          <div className="flex items-center gap-3 rounded-xl bg-panel-solid px-4 py-3 ring-1 ring-line">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-solid text-sm font-bold text-on-brand-solid"
            >
              {DEMO_USER.initials}
            </span>
            {/* The plan sits under the name rather than beside it: on the
                narrow card an email and a pill fighting for one row left the
                address truncated, and the address is the identifying half. */}
            <div className="min-w-0 flex-1 leading-tight">
              <div className="flex items-baseline gap-2">
                <span className="truncate text-sm font-semibold text-ink-strong">
                  {DEMO_USER.name}
                </span>
                <span className="shrink-0 text-[11px] font-semibold text-accent">
                  {DEMO_USER.plan}
                </span>
              </div>
              <div className="mt-0.5 truncate text-[13px] text-ink-soft">{DEMO_USER.email}</div>
            </div>
          </div>

          {DEMO_APPEARANCE.palette.show && (
            <PalettePicker
              options={SHIPPED_PALETTES}
              value={palette}
              onChange={setPalette}
              title={DEMO_APPEARANCE.palette.title}
              description={DEMO_APPEARANCE.palette.description}
            />
          )}

          {DEMO_APPEARANCE.highlight.show && (
            <HighlightPicker
              options={SHIPPED_HIGHLIGHTS}
              value={highlight}
              onChange={setHighlight}
              title={DEMO_APPEARANCE.highlight.title}
              description={DEMO_APPEARANCE.highlight.description}
            />
          )}
        </div>

        <footer className="border-t border-line px-5 py-3">
          <button
            type="button"
            onClick={resetAppearance}
            className="rounded-lg px-2 py-1 text-[13px] font-medium text-ink-soft transition hover:text-ink-strong"
          >
            Reset appearance
          </button>
        </footer>
      </div>
    </dialog>
  )
}
