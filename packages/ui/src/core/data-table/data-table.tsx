import { Fragment, useId } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '../../components/icons'
import { Checkbox } from '../checkbox'
import { BulkBar } from './bulk-bar'
import { EmptyState, SkeletonRows } from './states'
import { directionFor, toggleSort } from './sorting'
import type { Column, DataTableLabels, DataTableProps } from './types'

const DEFAULT_LABELS: DataTableLabels = {
  selectAll: 'Select all rows on this page',
  selectRow: (row) => `Select ${row}`,
  expandRow: (row) => `Show details for ${row}`,
  sortBy: (column) => `Sort by ${column}`,
  selected: (n) => `${n.toLocaleString()} selected`,
  clearSelection: 'Clear',
  emptyTitle: 'Nothing to show',
}

const alignClass = (align: Column<unknown>['align']) =>
  align === 'end' ? 'text-right' : 'text-left'

/**
 * Written out in full rather than built from a template literal — Tailwind
 * scans source text for class names, and `hidden ${bp}:table-cell` produces
 * nothing at all in the stylesheet.
 */
const HIDE_BELOW: Record<NonNullable<Column<unknown>['hideBelow']>, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
}

const hideClass = (c: { hideBelow?: Column<unknown>['hideBelow'] }) =>
  c.hideBelow ? HIDE_BELOW[c.hideBelow] : ''

/**
 * A row's click target is the row, but the row is not the control.
 *
 * `<tr>` carries an `onClick` for the mouse, and the first cell carries a real
 * `<button>` for everything else — so Tab reaches the toggle, a screen reader
 * announces it with `aria-expanded`, and nobody has to hunt for a caret. The
 * row click is convenience layered on top, never the only path, which is what
 * keeps this from being the `onClick`-on-a-div pattern it superficially
 * resembles.
 *
 * Clicks that begin inside another control — the checkbox, a row action, a
 * link — must not also toggle the row, hence the `closest` guard.
 */
const cameFromAnotherControl = (target: EventTarget | null) =>
  target instanceof Element && target.closest('button, a, input, select, textarea, label') !== null

/**
 * The table.
 *
 * Controlled and inert, like everything else in the library: it fetches
 * nothing, sorts nothing and remembers nothing. `rows` are already the page,
 * `sort` is already applied, selection and expansion are the host's. That is
 * what lets one fixture and one live endpoint satisfy the same props.
 *
 * A real `<table>` rather than a grid of divs. Row and column relationships
 * are what a screen reader navigates a table by, and `role="…"` sprinkled on
 * divs reproduces them only if every role is right — which is a worse bet than
 * the element that has them for free.
 */
export function DataTable<T>({
  columns,
  rows,
  rowId,
  caption,
  minWidth = '680px',
  loading = false,
  skeletonRows = 5,
  sort = [],
  onSortChange,
  selectedIds,
  onSelectionChange,
  bulkActions,
  renderExpanded,
  expandedIds = [],
  onExpandedChange,
  rowActions,
  empty,
  toolbar,
  footer,
  labels,
  className = '',
}: DataTableProps<T>) {
  const t = { ...DEFAULT_LABELS, ...labels }
  const baseId = useId()

  const selectable = Boolean(onSelectionChange)
  const expandable = Boolean(renderExpanded)
  const selected = selectedIds ?? []

  const pageIds = rows.map(rowId)
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id))
  const someSelected = selected.length > 0 && !allSelected

  const extraCols = (selectable ? 1 : 0) + (expandable ? 1 : 0) + (rowActions ? 1 : 0)
  const totalCols = columns.length + extraCols

  const toggleAll = () =>
    onSelectionChange?.(
      allSelected
        ? selected.filter((id) => !pageIds.includes(id))
        : [...new Set([...selected, ...pageIds])],
    )

  const toggleRow = (id: string) =>
    onSelectionChange?.(
      selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id],
    )

  const toggleExpanded = (id: string) =>
    onExpandedChange?.(
      expandedIds.includes(id) ? expandedIds.filter((v) => v !== id) : [...expandedIds, id],
    )

  return (
    <div className={['flex min-w-0 flex-col gap-3', className].filter(Boolean).join(' ')}>
      {toolbar}

      {selectable && selected.length > 0 && (
        <BulkBar
          countLabel={t.selected(selected.length)}
          clearLabel={t.clearSelection}
          onClear={() => onSelectionChange?.([])}
        >
          {bulkActions}
        </BulkBar>
      )}

      <div className="min-w-0 overflow-hidden rounded-xl border border-line bg-panel-solid">
        <div className="min-w-0 overflow-x-auto">
          <table
            className="w-full table-fixed border-collapse text-left"
            style={minWidth === 'none' ? undefined : { minWidth }}
          >
            <caption className="sr-only">{caption}</caption>

            <thead>
              <tr className="border-b border-line bg-canvas">
                {selectable && (
                  <th scope="col" style={{ width: '44px' }} className="px-4 py-0">
                    <Checkbox
                      aria-label={t.selectAll}
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={toggleAll}
                    />
                  </th>
                )}

                {columns.map((c) => {
                  const dir = directionFor(c.sortKey, sort)
                  const head = (
                    <span className="text-[10.5px] font-extrabold tracking-[0.07em] uppercase">
                      {c.header}
                    </span>
                  )
                  return (
                    <th
                      key={c.id}
                      scope="col"
                      style={c.width ? { width: c.width } : undefined}
                      aria-sort={dir ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}
                      className={[
                        'h-11 truncate px-4 align-middle whitespace-nowrap text-ink-soft',
                        alignClass(c.align),
                        hideClass(c),
                        c.headerClassName ?? '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {c.sortKey && onSortChange ? (
                        <button
                          type="button"
                          onClick={() => onSortChange(toggleSort(c.sortKey!, sort))}
                          title={t.sortBy(String(c.header))}
                          className={[
                            'group inline-flex items-center gap-1.5 transition hover:text-ink-strong',
                            dir ? 'text-accent-fg' : '',
                            c.align === 'end' ? 'flex-row-reverse' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          {head}
                          {dir === 'desc' ? (
                            <ChevronDownIcon width={11} height={11} className="shrink-0" />
                          ) : (
                            <ChevronUpIcon
                              width={11}
                              height={11}
                              className={
                                dir
                                  ? 'shrink-0'
                                  : 'shrink-0 opacity-0 transition group-hover:opacity-50'
                              }
                            />
                          )}
                        </button>
                      ) : (
                        head
                      )}
                    </th>
                  )
                })}

                {expandable && <th scope="col" style={{ width: '34px' }} className="px-0" />}
                {rowActions && (
                  <th scope="col" className="px-4 text-right text-ink-soft">
                    <span className="text-[10.5px] font-extrabold tracking-[0.07em] uppercase">
                      Actions
                    </span>
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {loading && <SkeletonRows rows={skeletonRows} columns={totalCols} />}

              {!loading &&
                rows.length === 0 &&
                (empty ? (
                  <tr>
                    <td colSpan={totalCols} className="px-6 py-14">
                      {empty}
                    </td>
                  </tr>
                ) : (
                  <EmptyState colSpan={totalCols} title={t.emptyTitle} body={t.emptyBody} />
                ))}

              {!loading &&
                rows.map((row) => {
                  const id = rowId(row)
                  const isOpen = expandedIds.includes(id)
                  const isSelected = selected.includes(id)
                  const panelId = `${baseId}-panel-${id}`
                  const [first, ...rest] = columns

                  return (
                    <Fragment key={id}>
                      <tr
                        onClick={
                          expandable
                            ? (e) => {
                                if (!cameFromAnotherControl(e.target)) toggleExpanded(id)
                              }
                            : undefined
                        }
                        className={[
                          'group/row border-b border-line/70 transition',
                          isOpen
                            ? 'bg-chip shadow-[inset_3px_0_0_var(--brand-solid)]'
                            : isSelected
                              ? 'bg-chip/50'
                              : 'hover:bg-tint/4',
                          expandable ? 'cursor-pointer' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {selectable && (
                          <td className="px-4">
                            <Checkbox
                              aria-label={t.selectRow(id)}
                              checked={isSelected}
                              onChange={() => toggleRow(id)}
                            />
                          </td>
                        )}

                        <td
                          className={[
                            'h-13 overflow-hidden px-4 text-[13.5px] text-ink',
                            alignClass(first.align),
                            hideClass(first),
                            first.cellClassName ?? '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          {expandable ? (
                            <button
                              type="button"
                              aria-expanded={isOpen}
                              aria-controls={panelId}
                              onClick={() => toggleExpanded(id)}
                              className="w-full text-left"
                            >
                              {first.cell(row)}
                            </button>
                          ) : (
                            first.cell(row)
                          )}
                        </td>

                        {rest.map((c) => (
                          <td
                            key={c.id}
                            className={[
                              'h-13 overflow-hidden px-4 text-[13.5px] text-ink',
                              alignClass(c.align),
                              hideClass(c),
                              c.cellClassName ?? '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            {c.cell(row)}
                          </td>
                        ))}

                        {expandable && (
                          <td className="px-0 text-center align-middle">
                            {isOpen ? (
                              <ChevronUpIcon
                                width={14}
                                height={14}
                                className="inline text-accent-fg"
                              />
                            ) : (
                              <ChevronDownIcon
                                width={14}
                                height={14}
                                className="inline text-ink-soft opacity-0 transition group-hover/row:opacity-100"
                              />
                            )}
                          </td>
                        )}

                        {rowActions && (
                          <td className="px-3">
                            <div className="flex items-center justify-end gap-0.5">
                              {rowActions(row)}
                            </div>
                          </td>
                        )}
                      </tr>

                      {expandable && isOpen && (
                        <tr className="border-b border-line bg-chip shadow-[inset_3px_0_0_var(--brand-solid)]">
                          <td id={panelId} colSpan={totalCols} className="px-4 pt-1 pb-5 pl-16">
                            {renderExpanded?.(row)}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
            </tbody>
          </table>
        </div>

        {footer}
      </div>
    </div>
  )
}
