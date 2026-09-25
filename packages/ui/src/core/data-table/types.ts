import type { ReactNode } from 'react'
import type { Sort } from '../paging'

export type ColumnAlign = 'start' | 'end'

export type Column<T> = {
  /** Stable key. Also the React key for the cell. */
  id: string
  header: ReactNode
  cell: (row: T) => ReactNode
  /**
   * A CSS width, `'28%'` or `'140px'`. The table is `table-fixed`, so these
   * are honoured rather than negotiated against content: one long email
   * cannot shove every other column out of shape. Omit on the column that
   * should absorb the remainder.
   */
  width?: string
  /**
   * Drops this column below the given breakpoint instead of letting every
   * column get narrower. Order columns by priority and hide from the right:
   * a table that sheds `Email` at `md` stays readable far longer than one
   * that keeps all six columns and squeezes them.
   */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl'
  /**
   * Makes the header a sort button. The value is what goes on the wire
   * (`sort=<sortKey>,asc`), which is often the API's field name rather than
   * this column's `id`.
   */
  sortKey?: string
  align?: ColumnAlign
  /** Header-only class — for `sr-only` on an actions column, say. */
  headerClassName?: string
  cellClassName?: string
}

export type DataTableLabels = {
  selectAll: string
  selectRow: (row: string) => string
  expandRow: (row: string) => string
  sortBy: (column: string) => string
  selected: (n: number) => string
  clearSelection: string
  emptyTitle: string
  emptyBody?: ReactNode
}

export type DataTableProps<T> = {
  columns: Column<T>[]
  rows: T[]
  /** Stable identity per row. Selection and expansion are keyed on it. */
  rowId: (row: T) => string
  /** Accessible name for the table. Rendered as a visually hidden `<caption>`. */
  caption: string

  /**
   * The width below which the table scrolls sideways instead of compressing.
   *
   * Without a floor, `table-fixed` percentage columns keep shrinking until
   * cells overlap and names truncate to a single letter — the table does not
   * break loudly, it just becomes wrong. With one, the columns keep their
   * proportions and the container scrolls. Pass `'none'` to opt out, or widen
   * it for tables with more columns.
   */
  minWidth?: string

  /** Skeleton rows instead of content. Keeps the header and the frame. */
  loading?: boolean
  /** How many skeleton rows to draw. Match your page size. */
  skeletonRows?: number

  /** Single-column sort, in the `paging` model's shape. */
  sort?: Sort[]
  onSortChange?: (sort: Sort[]) => void

  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  /** Rendered in the bulk bar once something is selected. */
  bulkActions?: ReactNode

  /**
   * Supplying this makes rows expandable: clicking a row (or its name button)
   * opens this underneath. Omit and rows are inert.
   */
  renderExpanded?: (row: T) => ReactNode
  expandedIds?: string[]
  onExpandedChange?: (ids: string[]) => void

  /** Trailing per-row controls. Clicks inside never toggle the row. */
  rowActions?: (row: T) => ReactNode

  /** Replaces the whole empty state. */
  empty?: ReactNode
  /** Above the header — an omnibox, a filter bar. */
  toolbar?: ReactNode
  /** Below the rows — `Pagination`, typically. */
  footer?: ReactNode

  labels?: Partial<DataTableLabels>
  className?: string
}
