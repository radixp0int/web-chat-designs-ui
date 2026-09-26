import { useState } from 'react'
import { PlusIcon } from '../icons'

export type AddFacetRowProps = {
  types: string[]
  onAdd: (facet: { type: string; value: string }) => void
  describeType?: (type: string) => { placeholder?: string; hint?: string }
  title: string
  addLabel: string
  /**
   * Folds the whole block behind a single row until it is wanted. For the
   * widget panel, where about 90px of vertical is a real cost and hand entry
   * is the rarer of the two ways in.
   */
  collapsible?: boolean
}

/**
 * The escape hatch: a field the index never offered, entered by hand.
 *
 * Two small decisions carry most of its usefulness. The select drives the
 * value field — its placeholder, its hint, and on a phone its keyboard — so
 * picking "Amount over" does not leave you typing a currency into a text box.
 * And Enter commits without moving focus, because these arrive in bursts.
 */
export function AddFacetRow({
  types,
  onAdd,
  describeType,
  title,
  addLabel,
  collapsible = false,
}: AddFacetRowProps) {
  const [type, setType] = useState(types[0] ?? '')
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(!collapsible)
  const meta = describeType?.(type) ?? {}
  const ready = value.trim().length > 0

  function commit() {
    if (!ready) return
    onAdd({ type, value: value.trim() })
    setValue('')
  }

  if (collapsible && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={false}
        className="flex w-full items-center gap-2 rounded-xl border border-dashed border-line bg-panel px-2.5 py-1.5 text-left transition hover:bg-tint/8"
      >
        <PlusIcon width={13} height={13} className="shrink-0 text-accent" />
        <span className="flex-1 text-[11.5px] font-semibold text-ink">{title}</span>
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-line bg-panel p-2.5">
      <p className="mb-2 text-[10px] font-semibold tracking-[0.12em] text-ink-soft uppercase">
        {title}
      </p>
      <div className="flex gap-1.5">
        <label className="sr-only" htmlFor="facet-type">
          Facet type
        </label>
        <select
          id="facet-type"
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="w-24 shrink-0 rounded-lg border border-line bg-panel-solid px-1.5 py-1.5 text-[12px] font-medium text-ink"
        >
          {types.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="facet-value">
          Facet value
        </label>
        <input
          id="facet-value"
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commit()
            }
            if (event.key === 'Escape') setValue('')
          }}
          placeholder={meta.placeholder}
          className="min-w-0 flex-1 rounded-lg border border-line bg-panel-solid px-2 py-1.5 text-[12px] text-ink placeholder:text-ink-soft/70"
        />

        <button
          type="button"
          onClick={commit}
          disabled={!ready}
          aria-label={addLabel}
          title={addLabel}
          className="grid w-[30px] shrink-0 place-items-center rounded-lg bg-brand-solid text-on-brand-solid transition disabled:cursor-default disabled:opacity-40"
        >
          <PlusIcon width={15} height={15} />
        </button>
      </div>
      {meta.hint && <p className="mt-1.5 text-[11px] leading-snug text-ink-soft">{meta.hint}</p>}
    </div>
  )
}
