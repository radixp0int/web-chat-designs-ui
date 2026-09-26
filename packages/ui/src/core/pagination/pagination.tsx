import { useId } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/icons'
import { Button } from '../button'
import { Select } from '../select'
import { pageWindow } from './pageWindow'
import type { PaginationLabels, PaginationProps } from './types'

const DEFAULT_LABELS: PaginationLabels = {
  rows: 'Rows',
  previous: 'Previous',
  next: 'Next',
  range: (from, to, total) =>
    `${from.toLocaleString()}–${to.toLocaleString()} of ${total.toLocaleString()}`,
  page: (n) => `Page ${n.toLocaleString()}`,
}

const DEFAULT_SIZES = [10, 25, 50, 100]

/**
 * The table footer: rows-per-page, a plain-language range readout, and the
 * numbered rail.
 *
 * Controlled and inert — it fetches nothing and holds no page of its own. It
 * is deliberately usable without a `Page` object, taking the four numbers it
 * needs directly, so a caller with a different envelope is not forced through
 * an adapter first.
 *
 * The readout is not decoration. "Next" alone leaves someone with no idea
 * whether they are near the end of ten rows or ten thousand, and it is the
 * part people actually read before deciding to filter instead of page.
 *
 * `busy` dims rather than unmounts. Replacing the footer with a spinner while
 * a page loads makes the control you just clicked vanish from under the
 * pointer, and the layout jump costs more than the stale numbers do.
 */
export function Pagination({
  page,
  size,
  totalElements,
  totalPages,
  offset,
  elements,
  sizeOptions = DEFAULT_SIZES,
  onPageChange,
  onSizeChange,
  compact = false,
  busy = false,
  boundaryCount,
  siblingCount,
  labels,
  className = '',
  ...rest
}: PaginationProps) {
  const t = { ...DEFAULT_LABELS, ...labels }
  const sizeId = useId()

  const from = offset ?? (page - 1) * size + 1
  const onThisPage = elements ?? Math.min(size, Math.max(0, totalElements - from + 1))
  const to = Math.max(from - 1, from + onThisPage - 1)

  const slots = compact ? [] : pageWindow(page, totalPages, { boundaryCount, siblingCount })
  const atStart = page <= 1
  const atEnd = page >= totalPages

  return (
    <nav
      aria-label="Pagination"
      className={[
        'flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-4 py-2.5 transition-opacity',
        busy ? 'pointer-events-none opacity-60' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {onSizeChange && (
        <span className="inline-flex items-center gap-2">
          <label htmlFor={sizeId} className="text-[12.5px] whitespace-nowrap text-ink-soft">
            {t.rows}
          </label>
          <Select
            id={sizeId}
            selectSize="sm"
            value={size}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            options={sizeOptions.map((n) => ({ value: n, label: String(n) }))}
          />
        </span>
      )}

      <span className="text-[12.5px] text-ink-soft tabular-nums">
        {totalElements > 0 ? t.range(from, to, totalElements) : ''}
      </span>

      <span className="grow" />

      <Button
        size="sm"
        icon={<ChevronLeftIcon width={13} height={13} />}
        disabled={atStart}
        onClick={() => onPageChange(page - 1)}
      >
        {t.previous}
      </Button>

      {slots.length > 0 && (
        <div className="flex items-center gap-0.5">
          {slots.map((slot, i) =>
            slot === 'gap' ? (
              <span
                key={`gap-${i}`}
                aria-hidden="true"
                className="min-w-5 text-center text-[13px] text-ink-soft"
              >
                …
              </span>
            ) : (
              <button
                key={slot}
                type="button"
                aria-label={t.page(slot)}
                aria-current={slot === page ? 'page' : undefined}
                onClick={() => onPageChange(slot)}
                className={[
                  'h-8 min-w-8 rounded-lg px-2 text-[13px] transition tabular-nums',
                  slot === page
                    ? 'bg-brand-solid font-extrabold text-on-brand-solid'
                    : 'font-bold text-ink hover:bg-tint/8',
                ].join(' ')}
              >
                {slot.toLocaleString()}
              </button>
            ),
          )}
        </div>
      )}

      <Button
        size="sm"
        trailingIcon={<ChevronRightIcon width={13} height={13} />}
        disabled={atEnd}
        onClick={() => onPageChange(page + 1)}
      >
        {t.next}
      </Button>
    </nav>
  )
}
