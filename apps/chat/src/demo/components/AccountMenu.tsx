import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDownIcon, SlidersIcon, UserIcon, useOverlayLayer } from '@chat/ui'
import { DEMO_USER } from '../config'

type AccountMenuProps = {
  /** Matches the Sidebar's slim-rail state: the avatar alone, no name or
   *  chevron, and the menu opens out over the conversation. */
  collapsed: boolean
  onOpenUserSettings: () => void
  onOpenFeatureToggles: () => void
}

const MENU_W = 224
const GAP = 8

/**
 * The sidebar footer's account button and its drop-up menu.
 *
 * The avatar is the single entry point to everything account-shaped: what used
 * to be a separate sliders button sitting beside it is now the menu's second
 * item. Two controls in a 64px rail read as two unrelated glyphs; one avatar
 * that opens a named list says what each thing is.
 *
 * The menu is portalled rather than absolutely positioned, for the reason
 * overlay.ts (@chat/ui) exists: the sidebar is `.glass`, and a backdrop-filter clips
 * its descendants to its own box — so a 224px menu inside a 64px rail loses
 * everything past the rail's edge. It drops *up* because the trigger is pinned
 * to the bottom of the viewport.
 */
export function AccountMenu({
  collapsed,
  onOpenUserSettings,
  onOpenFeatureToggles,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false)
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  // Anchored only while open, so the layer re-resolves its theme classes on
  // every open: it lives outside the app shell and inherits nothing, so one
  // resolved once would still be wearing `dark` after a switch to light.
  const layer = useOverlayLayer(open ? trigger : null)
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null)

  // Measured before paint so the menu never shows at a stale spot, and again on
  // resize: the rail's width changes with the collapse state and the breakpoint.
  useLayoutEffect(() => {
    if (!open || !trigger) return
    const place = () => {
      const r = trigger.getBoundingClientRect()
      setPos({
        left: Math.min(r.left, window.innerWidth - MENU_W - GAP),
        bottom: window.innerHeight - r.top + GAP,
      })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open, trigger])

  // Close on outside click and on Esc. composedPath() rather than contains(),
  // matching PersonaMenu — and here it is doing real work, since the menu is
  // portalled and so is not a DOM descendant of the trigger.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const path = e.composedPath()
      if (trigger && path.includes(trigger)) return
      if (menuRef.current && path.includes(menuRef.current)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, trigger])

  const choose = (action: () => void) => () => {
    setOpen(false)
    action()
  }

  const menu = (
    <ul
      ref={menuRef}
      role="menu"
      aria-label="Account"
      style={{
        position: 'fixed',
        left: pos?.left ?? 0,
        bottom: pos?.bottom ?? 0,
        width: MENU_W,
        pointerEvents: 'auto',
        // Nothing to show until the first measurement lands.
        visibility: pos ? 'visible' : 'hidden',
      }}
      className="overflow-hidden rounded-lg border border-line bg-panel-solid p-1.5 shadow-xl shadow-(color:--shadow-menu)"
    >
      <MenuItem
        icon={<UserIcon width={16} height={16} />}
        label="User settings"
        hint="Profile and appearance"
        onClick={choose(onOpenUserSettings)}
      />
      <MenuItem
        icon={<SlidersIcon width={16} height={16} />}
        label="Feature toggles"
        hint="What a response shows"
        onClick={choose(onOpenFeatureToggles)}
      />
    </ul>
  )

  return (
    <>
      <button
        ref={setTrigger}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account: ${DEMO_USER.name}`}
        title={DEMO_USER.name}
        className={`flex w-full items-center gap-3 rounded-lg p-1 text-left transition hover:bg-panel ${
          collapsed ? 'lg:justify-center' : ''
        }`}
      >
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-solid text-xs font-bold text-on-brand-solid"
        >
          {DEMO_USER.initials}
        </span>
        <span
          className={`min-w-0 flex-1 text-[13px] leading-tight ${collapsed ? 'lg:hidden' : ''}`}
        >
          <span className="block truncate font-semibold text-ink-strong">{DEMO_USER.name}</span>
          <span className="block truncate text-ink-soft">{DEMO_USER.plan}</span>
        </span>
        {/* Points up when closed — where the menu will appear — and flips once
            it is open, the same way the persona menu's chevron does. */}
        <ChevronDownIcon
          width={15}
          height={15}
          className={`shrink-0 text-ink-soft transition-transform ${open ? '' : 'rotate-180'} ${
            collapsed ? 'lg:hidden' : ''
          }`}
        />
      </button>

      {open && layer && createPortal(menu, layer)}
    </>
  )
}

function MenuItem({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  hint: string
  onClick: () => void
}) {
  return (
    <li role="none">
      <button
        type="button"
        role="menuitem"
        onClick={onClick}
        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition hover:bg-tint/8"
      >
        <span className="shrink-0 text-ink-soft">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-ink-strong">{label}</span>
          <span className="block text-xs text-ink-soft">{hint}</span>
        </span>
      </button>
    </li>
  )
}
