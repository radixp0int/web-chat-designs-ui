import { useEffect, useId, useRef, useState } from 'react'
import { SearchIcon, XIcon } from '../../components/icons'
import type { OmniboxProps, OmniboxSuggestion } from './types'

const DEFAULT_HINTS = (
  <>
    <span>
      <kbd className="font-bold text-ink">↑↓</kbd> move
    </span>
    <span>
      <kbd className="font-bold text-ink">↵</kbd> apply
    </span>
    <span>
      <kbd className="font-bold text-ink">⌫</kbd> remove last chip
    </span>
  </>
)

/**
 * One field that both searches and filters.
 *
 * The active filters live *inside* the border as chips, so the control reads
 * as one idea rather than a search box that happens to have a filter bar
 * stuck under it. Typing offers two things at once: the free-text search
 * across every field, and the same text narrowed to one field — which is the
 * whole point, because "search for cres" and "name contains cres" are
 * different questions that every other filter UI makes you decide between
 * before you start typing.
 *
 * Each suggestion names the query parameter it produces. That is what makes
 * the control learnable instead of magic: after a few uses you know what
 * `?search=` does differently from `name__icontains`, and the ones who never
 * look have lost nothing.
 *
 * Inert about data — it never filters anything. `groups` are supplied by the
 * host, already matched against `value`, and `onSelect` is the host's.
 */
export function Omnibox({
  label,
  value,
  onValueChange,
  placeholder,
  chips = [],
  groups = [],
  onRemoveLast,
  suffix,
  hints = DEFAULT_HINTS,
  className = '',
}: OmniboxProps) {
  const baseId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const flat: OmniboxSuggestion[] = groups.flatMap((g) => g.items)
  const showMenu = open && flat.length > 0

  // Clamp rather than reset: the list reflows on every keystroke, and snapping
  // the highlight back to the top each time makes arrowing down impossible.
  useEffect(() => {
    setActive((i) => Math.min(i, Math.max(0, flat.length - 1)))
  }, [flat.length])

  // Pointer-down, not click: a click on a suggestion would otherwise blur the
  // input and close the menu before the selection landed.
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const choose = (s: OmniboxSuggestion) => {
    s.onSelect()
    setActive(0)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!showMenu) return setOpen(true)
      e.preventDefault()
      setActive((i) =>
        e.key === 'ArrowDown' ? (i + 1) % flat.length : (i - 1 + flat.length) % flat.length,
      )
      return
    }
    if (e.key === 'Enter' && showMenu && flat[active]) {
      e.preventDefault()
      choose(flat[active])
      return
    }
    if (e.key === 'Escape' && open) {
      e.preventDefault()
      setOpen(false)
      return
    }
    if (e.key === 'Backspace' && value === '' && chips.length > 0) {
      onRemoveLast?.()
    }
  }

  let index = -1

  return (
    <div ref={wrapRef} className={['relative min-w-0', className].filter(Boolean).join(' ')}>
      <label htmlFor={`${baseId}-input`} className="sr-only">
        {label}
      </label>

      <div className="flex min-w-0 items-center gap-2 rounded-xl border border-line bg-panel-solid px-3 py-2 transition focus-within:border-accent focus-within:ring-3 focus-within:ring-accent/20">
        <SearchIcon width={16} height={16} className="shrink-0 text-ink-soft" />

        {chips.map((chip) => (
          <span
            key={chip.id}
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-chip py-0.5 pr-1 pl-2 text-[12.5px] font-bold text-chip-fg"
          >
            {chip.prefix && <span className="font-semibold opacity-65">{chip.prefix}</span>}
            {chip.label}
            {chip.onRemove && (
              <button
                type="button"
                onClick={chip.onRemove}
                aria-label={`Remove ${chip.prefix ?? ''}${typeof chip.label === 'string' ? chip.label : 'filter'}`}
                className="inline-grid size-[18px] place-items-center rounded transition hover:bg-chip-hover"
              >
                <XIcon width={10} height={10} />
              </button>
            )}
          </span>
        ))}

        <input
          id={`${baseId}-input`}
          type="text"
          role="combobox"
          aria-expanded={showMenu}
          aria-controls={`${baseId}-list`}
          aria-activedescendant={showMenu ? `${baseId}-opt-${active}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onValueChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="min-w-16 grow bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft"
        />

        {suffix}
      </div>

      {showMenu && (
        <div
          id={`${baseId}-list`}
          role="listbox"
          aria-label={label}
          className="absolute top-[calc(100%+6px)] left-0 z-30 w-full max-w-[34rem] overflow-hidden rounded-xl border border-line bg-panel-solid p-2 shadow-[0_12px_32px_var(--shadow-raised)]"
        >
          {groups.map((g) => (
            <div key={g.id} className="flex flex-col">
              <span className="px-2.5 pt-2 pb-1.5 text-[10.5px] font-extrabold tracking-[0.08em] text-ink-soft uppercase">
                {g.label}
              </span>
              {g.items.map((item) => {
                index += 1
                const i = index
                return (
                  <button
                    key={item.id}
                    id={`${baseId}-opt-${i}`}
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    onPointerDown={(e) => e.preventDefault()}
                    onPointerEnter={() => setActive(i)}
                    onClick={() => choose(item)}
                    className={[
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition',
                      i === active ? 'bg-chip' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {item.icon && (
                      <span className="inline-grid size-[22px] shrink-0 place-items-center rounded-md bg-chip text-[10px] font-extrabold text-chip-fg">
                        {item.icon}
                      </span>
                    )}
                    <span className="grow truncate text-[13.5px] text-ink">{item.label}</span>
                    {item.hint && (
                      <span className="shrink-0 text-[11px] font-semibold text-ink-soft">
                        {item.hint}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}

          {hints && (
            <div className="mt-1.5 flex items-center gap-3.5 border-t border-line px-2.5 pt-2 pb-1 text-[11px] text-ink-soft">
              {hints}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
