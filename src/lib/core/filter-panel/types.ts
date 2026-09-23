import type { ReactNode } from 'react'
import type { DateRange, IsoDate } from '../date-field'

type Base = {
  id: string
  label: string
  /** Shown under the label — say what the filter means, not how to use it. */
  hint?: ReactNode
}

export type StringFilterField = Base & {
  type: 'string'
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export type FilterOption = {
  value: string
  label: string
  /** How many rows this option would match. Omit when unknown — never fake it. */
  count?: number
}

export type OptionsFilterField = Base & {
  type: 'options'
  options: FilterOption[]
  value: string[]
  onChange: (value: string[]) => void
  /**
   * Many-of (checkboxes) or one-of (a select). Defaults to many.
   *
   * Above `selectThreshold` options the checkbox list becomes a select
   * whatever this says — a rail of forty checkboxes is not a filter, it is a
   * scrolling problem.
   */
  multiple?: boolean
  selectThreshold?: number
}

export type BooleanFilterField = Base & {
  type: 'boolean'
  value: boolean
  onChange: (value: boolean) => void
}

export type DateFilterField = Base & {
  type: 'date'
  value: IsoDate
  onChange: (value: IsoDate) => void
  min?: string
  max?: string
}

export type DateRangeFilterField = Base & {
  type: 'dateRange'
  value: DateRange
  onChange: (value: DateRange) => void
  min?: string
  max?: string
}

export type FilterField =
  | StringFilterField
  | OptionsFilterField
  | BooleanFilterField
  | DateFilterField
  | DateRangeFilterField

export type FilterPanelProps = {
  fields: FilterField[]
  title?: string
  /** Count shown beside the title. Omit to hide it. */
  activeCount?: number
  onReset?: () => void

  /**
   * Docked beside the table rather than floating over it.
   *
   * The same panel in both places on purpose: a floating panel and a docked
   * rail that merely resemble each other drift apart, and then a field added
   * to one is missing from the other.
   */
  pinned?: boolean
  onPinnedChange?: (pinned: boolean) => void
  /** Only meaningful while floating. */
  onClose?: () => void
  className?: string
}
