import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon, FunnelIcon } from '../icons'
import type { AskedOverChip } from '../../types'
import type { AskedOverStripProps } from './types'

/** Labels in the collapsed line before the rest become "+N". */
const PREVIEW = { comfortable: 2, compact: 1 } as const

/**
 * What a question was asked over, recorded on the question.
 *
 * Reads above the bubble because it qualifies it — "over these 412 items, how
 * much did we spend" — and sits outside it, because nothing is allowed to
 * reflow the sentence the person wrote.
 *
 * The chips look like the filter rail's and behave nothing like them: this is
 * a record, and there is nothing to remove from a question already asked. The
 * only action is restoring the whole set, and it acts on the rail.
 */
export function AskedOverStrip({
  scope,
  changed = false,
  onRestore,
  density = 'comfortable',
  className = '',
}: AskedOverStripProps) {
  const [open, setOpen] = useState(false)
  if (scope.chips.length === 0) return null

  const preview = scope.chips.slice(0, PREVIEW[density]).map(chipText)
  const rest = scope.chips.length - preview.length
  const items = `${scope.total.toLocaleString()} ${scope.total === 1 ? 'item' : 'items'}`

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={false}
        aria-label={`Filters used: ${items}${changed ? ', changed since' : ''}`}
        className={`flex max-w-[82%] items-center gap-1.5 rounded-full border px-2.5 py-0.5 transition ${
          changed
            ? 'border-caution-line bg-caution-surface hover:bg-caution-surface/70'
            : 'border-line bg-panel hover:bg-tint/8'
        } ${className}`}
      >
        <FunnelIcon width={11} height={11} className="shrink-0 text-ink-soft" />
        {/* The count and the overflow never truncate: they are the half that
            says whether the answer above is worth anything. Only the labels
            in the middle give way. */}
        <span className="shrink-0 text-[11px] font-semibold text-ink tabular-nums">{items}</span>
        {preview.length > 0 && (
          <span className="min-w-0 truncate text-[11px] text-ink-soft">
            · {preview.join(' · ')}
          </span>
        )}
        {rest > 0 && <span className="shrink-0 text-[11px] text-ink-soft/70">+{rest}</span>}
        {changed && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-caution" />}
        <ChevronDownIcon width={10} height={10} className="shrink-0 text-ink-soft/70" />
      </button>
    )
  }

  return (
    <div
      // --chip, not --highlight: the latter is the citation wash (ember, and
      // tuned per swatch), so the panel came out warm against a rail full of
      // brand blue. This is the same tint the filter chips themselves use,
      // which is the point — it is the same filters, recorded.
      className={`max-w-[82%] rounded-xl border border-accent/20 bg-chip px-3 py-2 ${className}`}
    >
      <div className="mb-2 flex items-center gap-1.5">
        <FunnelIcon width={12} height={12} className="shrink-0 text-accent-fg" />
        <span className="flex-1 text-[11.5px] font-semibold text-ink-strong">
          Asked over <span className="tabular-nums">{items}</span>
        </span>
        {changed && (
          <span className="rounded-full border border-caution-line bg-caution-surface px-1.5 py-px text-[9.5px] font-bold tracking-wide text-caution uppercase">
            changed since
          </span>
        )}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Hide the filters used"
          className="grid size-5 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-tint/8"
        >
          <ChevronUpIcon width={11} height={11} />
        </button>
      </div>

      <div className="mb-2 flex flex-wrap gap-1.5">
        {scope.chips.map((chip, index) => (
          <RecordChip
            key={`${chip.kind}:${chip.prefix ?? ''}:${chip.label}:${index}`}
            chip={chip}
          />
        ))}
      </div>

      {changed && onRestore ? (
        <button
          type="button"
          onClick={onRestore}
          className="rounded-full bg-brand-solid px-2.5 py-1 text-[11px] font-semibold text-on-brand-solid"
        >
          Use these filters again
        </button>
      ) : (
        <p className="text-[11px] text-ink-soft">These are the filters currently set.</p>
      )}
    </div>
  )
}

/**
 * Same three shapes the rail uses, minus every affordance. Redrawn here rather
 * than imported so the transcript does not depend on the filters component:
 * a host can record a scope without ever mounting one.
 */
function RecordChip({ chip }: { chip: AskedOverChip }) {
  const skin =
    chip.kind === 'query'
      ? 'bg-brand-solid text-on-brand-solid'
      : chip.kind === 'custom'
        ? 'border border-dashed border-line bg-panel-solid text-ink'
        : 'bg-panel-solid text-chip-fg'

  return (
    <span
      className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${skin}`}
    >
      {chip.prefix && (
        <span className={chip.kind === 'custom' ? 'text-ink-soft' : 'opacity-70'}>
          {chip.kind === 'query' ? chip.prefix : `${chip.prefix}:`}
        </span>
      )}
      <span className="tabular-nums">{chip.label}</span>
      {typeof chip.count === 'number' && (
        <span className="opacity-70 tabular-nums">{chip.count.toLocaleString()}</span>
      )}
    </span>
  )
}

function chipText(chip: AskedOverChip): string {
  return chip.prefix && chip.kind !== 'scope' ? `${chip.prefix}: ${chip.label}` : chip.label
}
