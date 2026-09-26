import type { ReactNode } from 'react'

/** One active filter, drawn inside the field. */
export type OmniboxChip = {
  id: string
  /** Dimmed qualifier before the value — `status:`. */
  prefix?: string
  label: ReactNode
  onRemove?: () => void
}

export type OmniboxSuggestion = {
  id: string
  icon?: ReactNode
  label: ReactNode
  /**
   * The query this would produce — `?search=cres`, `name__icontains`.
   *
   * Shown right-aligned and quiet. It is not decoration: the whole promise of
   * this control is that typing does something predictable, and naming the
   * parameter is how someone learns which of these two very similar-looking
   * options they actually want.
   */
  hint?: string
  onSelect: () => void
}

export type OmniboxGroup = {
  id: string
  label: string
  items: OmniboxSuggestion[]
}

export type OmniboxProps = {
  /** Visually hidden. The field still needs an accessible name. */
  label: string
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  chips?: OmniboxChip[]
  groups?: OmniboxGroup[]
  /**
   * Backspace in an empty field removes the last chip. Omit and it does
   * nothing — a destructive default is only safe where chips are cheap to
   * put back.
   */
  onRemoveLast?: () => void
  /** A `⌘K` badge, a count — rendered at the right edge of the field. */
  suffix?: ReactNode
  /** Keyboard legend under the suggestions. Pass `null` to drop it. */
  hints?: ReactNode
  className?: string
}
