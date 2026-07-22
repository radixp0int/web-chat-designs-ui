import { useEffect, useRef, useState } from 'react'
import { CheckIcon, ChevronDownIcon, SparkleIcon } from '../icons'
import type { PersonaMenuProps } from './types'

/** Persona picker: a trigger (labelled pill, or icon-only when compact) and a
 *  pop-up listbox. Closes on outside click. */
export function PersonaMenu({ personas, persona, onChange, compact }: PersonaMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const activePersona = personas.find((p) => p.id === persona) ?? personas[0]

  // Close on outside click. composedPath() (not contains()) because inside the
  // widget's shadow root, events reaching the document are retargeted to the
  // shadow host and contains() would always fail.
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (menuRef.current && !e.composedPath().includes(menuRef.current)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={menuRef} className="relative">
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Persona: ${activePersona.name}`}
          title={`Persona: ${activePersona.name}`}
          className="flex items-center justify-center rounded-full bg-brand-600/8 p-1.5 text-brand-600 transition hover:bg-brand-600/14 dark:bg-brand-300/12 dark:text-brand-200 dark:hover:bg-brand-300/20"
        >
          <SparkleIcon width={16} height={16} className="text-accent-500" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex items-center gap-1.5 rounded-full bg-brand-600/8 px-3.5 py-2 text-[13px] font-semibold text-brand-600 transition hover:bg-brand-600/14 dark:bg-brand-300/12 dark:text-brand-200 dark:hover:bg-brand-300/20"
        >
          <SparkleIcon width={14} height={14} className="text-accent-500" />
          {activePersona.name}
          <ChevronDownIcon
            width={14}
            height={14}
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
      )}

      {open && (
        <ul
          role="listbox"
          aria-label="Chat persona"
          className="absolute bottom-full left-0 z-20 mb-2 w-56 overflow-hidden rounded-2xl border border-(--panel-border) bg-(--panel-solid) p-1.5 shadow-xl shadow-brand-950/20"
        >
          {personas.map((p) => (
            <li key={p.id} role="option" aria-selected={p.id === persona}>
              <button
                type="button"
                onClick={() => {
                  onChange(p.id)
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition hover:bg-brand-600/8 dark:hover:bg-white/8"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-(--text-strong)">
                    {p.name}
                  </span>
                  <span className="block text-xs text-(--text-soft)">{p.hint}</span>
                </span>
                {p.id === persona && (
                  <CheckIcon width={15} height={15} className="text-accent-500" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
